---
title: Critical stacks and recovery
description: Move the reverse proxy and Forgejo with the compose-first method, retire the large compose file, and start stacks or Komodo without Komodo.
---

# Critical stacks and recovery

Some stacks are critical: the Git pull of a Deploy, the webhook or a Periphery connection goes through them (see [Adapt to your layout](index.md#adapt-to-your-layout)). In the example, they are `proxy` on both servers and `forgejo` on `server-b`. Komodo deploys them only when you click Deploy. They are in no Procedure, so a merge never restarts them by itself.

## Why critical stacks need another method

A Komodo Deploy starts with a Git pull from Forgejo. Forgejo runs on `server-b`, and the proxy on `server-b` sends its traffic. So while the containers of `proxy` or `forgejo` on `server-b` are stopped, the Deploy of that stack fails at the Git pull, and nothing starts them.

The compose-first method solves this. You start the new containers with a direct `docker compose` command from Komodo's own clone of the repository. Forgejo is then reachable again, and a Deploy lets Komodo take the stack over. Because the command uses Komodo's clone and the same project name, the containers carry the same labels that Komodo writes. The Deploy then finds nothing to change.

The proxy on `server-a` is not in that loop, so it can move with the normal steps of [Move the stacks](move-stacks.md). While it is stopped, `https://<komodo-host>` does not answer, so open Komodo at `http://<server-a-lan-ip>:9120` to click Deploy. The steps below use the `proxy` stack on `server-b`. Then move `forgejo` with the changes in [The Forgejo stack](#the-forgejo-stack): the proxy first, because Forgejo needs it.

## Before you start

1. Make sure that Periphery sees its root directory at the same path inside and outside. The output must include `/home/komodo/periphery -> /home/komodo/periphery`:

    ```bash
    docker inspect komodo-periphery --format '{{range .Mounts}}{{.Source}} -> {{.Destination}}{{println}}{{end}}'
    ```

2. Generate the stack files, read the stack file with `find_literals.sh` and `cat`, commit and push the stack, and click Pull on the Repo in Komodo. This is the last push before the stack stops. Make sure that Komodo's clone has the commit:

    ```bash
    git -C /home/komodo/periphery/repos/<your-repo>-server-b log -1 --oneline
    ```

3. Create the secret Variables and the Stack `server-b-proxy` as in [Create the Stack](move-stacks.md#create-the-stack), with Auto Update and Poll For Updates off. Do not click Deploy.
4. Record the state, and run three tests before the move. Periphery must list each env file with no error, each image must pull without an error, and `nginx -t` must say that the test is successful:

    ```bash
    bash tools/collect_state.sh > work/before-proxy.txt && cp /home/docker-compose.yml work/compose-before-proxy.yml
    grep -o '/home/.env_files/[^" ]*' server-b/proxy/docker-compose.yml | sort -u | xargs -r docker exec komodo-periphery ls -l
    grep -E '^\s+image:' server-b/proxy/docker-compose.yml | awk '{print $2}' | xargs -n1 docker pull -q
    docker exec swag nginx -t
    ```

5. Make the temporary env file with the plain values of your map and the secrets:

    ```bash
    (umask 077; { printf 'TZ=Etc/UTC\nPUID=1000\nPGID=1000\n'; cat /root/secrets-server-b.env; } > work/proxy.env)
    ```

## The move

Every site on `server-b`, Forgejo included, is down from step 1 until step 3 finishes, usually for less than a minute. Run the four commands one after the other, without a pause.

1. Stop and remove the old container:

    ```bash
    docker stop swag && docker rm swag
    ```

2. Write the large file without the stack, and put it in place:

    ```bash
    python3 -I tools/split_stacks.py --server server-b --compose /home/docker-compose.yml --remove proxy > work/compose-after-proxy.yml && cp work/compose-after-proxy.yml /home/docker-compose.yml
    ```

3. Start the new container from Komodo's clone, with the stack's project name:

    ```bash
    cd /home/komodo/periphery/repos/<your-repo>-server-b/server-b/proxy && docker compose -p proxy -f docker-compose.yml --env-file /root/<your-repo>/work/proxy.env up -d; cd /root/<your-repo>
    ```

4. Delete the temporary env file:

    ```bash
    rm work/proxy.env
    ```

## After the move

1. Wait about a minute. SWAG must finish its start: the first command must print `1` or more. `nginx -t` must say that the test is successful, and Forgejo must answer through SWAG with `200` or a redirect such as `302`:

    ```bash
    docker logs swag 2>&1 | grep -c 'ls.io-init\] done'
    docker exec swag nginx -t
    curl -s -o /dev/null -w '%{http_code}\n' https://<forgejo-host>/
    ```

2. In Komodo, click Deploy on `server-b-proxy`. Every stage must succeed, Git pull included. In the Compose Up stage, the container shows `Running`.

    If it shows `Recreated`, the Compose version on the host differs from the one inside Periphery, so the two compute a different configuration hash. The container restarts one time, and nothing else changes. Compare with `docker compose version` and `docker exec komodo-periphery docker compose version`, and keep both versions close.

3. Record the state and compare it. The image ID diff and the environment hash diff must be empty:

    ```bash
    bash tools/collect_state.sh > work/after-proxy.txt && for f in 3 8 9; do diff <(cut -d'|' -f1,$f work/before-proxy.txt) <(cut -d'|' -f1,$f work/after-proxy.txt); echo "field $f done"; done
    ```

4. Open Forgejo and a few other sites, and make sure that each one loads with a valid certificate.

If the direct start fails, go back with the rollback steps of [Move the stacks](move-stacks.md#if-the-deploy-fails), without step 1, because Komodo deployed nothing yet. Remove the new container first with `docker rm -f swag`. If only the Deploy fails, the proxy keeps running from the direct start, so do not roll back: read the error first.

## The Forgejo stack

Move `forgejo` after the proxy, with the same steps and these changes. Forgejo is down for longer, because its data is copied while it is stopped.

1. Before "The move", while Forgejo runs, dump its database. The command reads the user and the database name from the container's environment, so you never type them. Only root can read the dump:

    ```bash
    (umask 077; docker exec forgejo-postgres sh -c 'pg_dump -U "$POSTGRES_USER" -d "${POSTGRES_DB:-$POSTGRES_USER}" -Fc' > /root/backups/pre-automation/forgejo-db.dump) && ls -l /root/backups/pre-automation/forgejo-db.dump
    ```

    The file must be larger than 0 bytes.

2. List the data folders of the stack and their sizes, and make sure that `/root` has more free space than their total:

    ```bash
    sed -nE 's/^\s+- "?(\/[^:"]+):.*/\1/p' server-b/forgejo/docker-compose.yml | sort -u | xargs -r du -sh; df -h /root
    ```

3. In "The move", step 1 stops every container of the stack, then copies the data folders while nothing writes to them, then removes the containers. Use the container names of your stack. The backup holds secret keys from `app.ini`, so only root can read it:

    ```bash
    docker stop runner docker_dind forgejo forgejo-postgres
    (umask 077; sed -nE 's/^\s+- "?(\/[^:"]+):.*/\1/p' server-b/forgejo/docker-compose.yml | sort -u | tar -czf /root/backups/pre-automation/forgejo-data.tar.gz -T -)
    docker rm runner docker_dind forgejo forgejo-postgres
    ```

4. Do steps 2 to 4 of "The move" with `forgejo` in place of `proxy`, and `work/forgejo.env` as the env file.
5. After the move, sign in to Forgejo, click Pull on the Repo in Komodo, and click Deploy on `server-b-forgejo`.

## Retire the large compose file

When every stack runs from Komodo, the large file has no services left. Rename it on each server, so that nobody starts containers from it by mistake. Its tags are old, and some of them point to newer images by now.

```bash
mv /home/docker-compose.yml /home/docker-compose.yml.retired
```

- Do not run `docker compose -p home down`. The shared network still belongs to the old project `home`, and every stack uses it.
- `split_stacks.py` still needs `--compose`, for example to make a key secret later. Use the retired file. It has no service, so the tool keeps every stack file and prints `0 stack files written, N already migrated and kept`.
- Look for old jobs that used the large file, such as a cron job that pulls images or an alias, and turn them off.
- When no more moves or rollbacks are planned, delete the secrets files `/root/secrets-server-*.env`. Komodo holds the values as Variables, and the Komodo database backups hold them too. To make a key secret later, follow the note in [Move the stacks](move-stacks.md#the-other-stacks).

## Start a stack without Komodo

Use these steps when Komodo Core is down, or when Forgejo is down. While Forgejo is down, every Deploy fails at the Git pull. The containers that run keep running. These steps only start, restart or recreate a stack.

Komodo keeps its clone of the repository on each server, in `/home/komodo/periphery/repos/<your-repo>-server-a` and `-server-b`. The run directory of a stack is `<server>/<stack>` in that clone. After each Deploy, Komodo leaves the Environment of the stack in the file `.env` in the run directory, with the real secret values, and Compose reads it by itself.

1. Go to the run directory of the stack:

    ```bash
    cd /home/komodo/periphery/repos/<your-repo>-server-b/server-b/forgejo
    ```

2. If the stack has an Environment in Komodo, make sure that the file `.env` exists. Do not show its content:

    ```bash
    ls -l .env
    ```

    If it is missing, start the stack from Komodo when Komodo works again, because Komodo writes `.env` at each Deploy.

3. Start the stack with its project name, and show the containers. All of them must be up:

    ```bash
    docker compose -p forgejo up -d && docker compose -p forgejo ps
    ```

    To restart without a change, use `docker compose -p forgejo restart`. Do not use `down`, and do not add `--remove-orphans`.

4. When Komodo and Forgejo work again, click Deploy on the Stack. Compose Up must show `Running` for each container.

If several stacks on `server-b` are down, start `proxy` first, then `forgejo`. After that, Komodo can deploy the others.

## Start Komodo again

Komodo Core is not a Komodo Stack, so Komodo cannot deploy it. Start it on `server-a`:

```bash
cd /root/<your-repo> && docker compose -f komodo/docker-compose.yml --env-file /home/.env_files/.komodo.env up -d
```

The first start after an update of Compose on the host recreates all three containers. That is expected, and the data stays in `/home/komodo`.

Then do steps 6 to 8 of [Start Komodo on server-a](komodo.md#start-komodo-on-server-a), and open Servers in Komodo. Both servers must show OK. `server-b` connects through SWAG on `server-a`, so the proxy on `server-a` must run first. It can take a minute to reconnect.

The Periphery of `server-b` starts with:

```bash
cd /root/<your-repo> && docker compose -f komodo/periphery-server-b/docker-compose.yml up -d
```

## Reboots and Docker updates

Every service uses `restart: unless-stopped`. After a reboot or a restart of the Docker daemon, Docker starts each container again, except one that you stopped by hand, for example with Stop in Komodo.

!!! warning "Do not use `restart: on-failure`"
    With `on-failure`, Docker starts a container again only if it stopped with an exit code other than 0. Postgres stops with code 0 at a clean shutdown, and so do many other services. An update of `docker-ce` restarts the Docker daemon, and the containers stay down.

At a start, Docker starts all containers at the same time and ignores `depends_on`. An application that starts before its database can stop with an error. `unless-stopped` starts it again until the database answers.

An update of `docker-ce` or `containerd.io` restarts every container on the server, like a reboot. For both:

1. Do one server at a time, and `server-b` first. Komodo on `server-a` stays available while `server-b` starts.
2. After the reboot, wait one minute, so that the databases and the applications can start.
3. Run the image check of [Daily use](daily-use.md#find-an-update-that-did-not-deploy). The two numbers must be equal, and no other line can appear.
4. If a line starts with `NOT RUNNING`, read the log of that container with `docker logs <container>` before you start it.
5. After a reboot of `server-a`, open Komodo. SWAG downloads its Docker mods at each start, so it needs DNS and the registry. If Komodo does not open, read the log of `swag` first.
