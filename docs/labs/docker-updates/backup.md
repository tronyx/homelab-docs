---
title: Back up and record
description: Back up the compose and env files, prepare the large file for the split, record every container and its image, and pin each service to its exact image.
---

# Back up and record

This part makes a backup, makes the large file ready for the split, records what runs, and pins each service to the exact image it runs. Later parts compare against this record, so that a move of a stack can prove that nothing changed.

## Back up the files

Do these steps on each server.

1. Get the latest repository files:

    ```bash
    cd /root/<your-repo> && git pull
    ```

2. Make a backup folder that only root can read. It will hold real secrets:

    ```bash
    install -d -m 700 /root/backups/pre-automation
    ```

3. Copy the compose file, the env files, and the `.env` file beside the compose file if there is one:

    ```bash
    cp -a /home/docker-compose.yml /home/.env_files /root/backups/pre-automation/ && { [ ! -e /home/.env ] || cp -a /home/.env /root/backups/pre-automation/; }
    ```

Keep the backup until the whole project is finished.

## Prepare the large file

`split_stacks.py` copies the services of the large file into the stack files, line by line, and declares the one shared network. Nothing else at the top level of the file is copied: no `volumes:`, `secrets:`, `configs:` or `x-` blocks. Make the large file fit these rules now, while every container still runs from it. A first look with `bash tools/find_literals.sh < /home/docker-compose.yml` and `docker compose -f /home/docker-compose.yml config --quiet` helps.

1. Every volume is a bind mount with an absolute path, such as `/home/sonarr/config:/config`. A relative path such as `./sonarr:/config` is an error in the split, because the stack file lives in another folder. A named volume such as `db_data:/var/lib/postgresql/data` is not declared in the stack file. Change it to a bind mount, or add this block to the stack file after the split, before you commit it, with the real volume name from `docker volume ls`:

    ```yaml
    volumes:
      db_data:
        external: true
        name: home_db_data
    ```

2. Every service that talks to another service is on one shared network, named under `networks:` in each service. Services without `networks:` use the project's default network, and after the split each stack would get its own. To add one, declare it in the large file (for example `lab.docker`), add it to each service, and apply the file. Its real name is then `home_lab.docker`. Never run `docker compose -p home down`, because the stacks will keep using this network.
3. Every service has `restart: unless-stopped`. With `on-failure`, containers stay down after a Docker update (see [Lessons learned](lessons.md#containers-stay-down-after-a-docker-update)).
4. A value that the file takes from `/home/.env` as `${VAR}` stays a variable in the stack file. Komodo must provide it: add a secret value by hand to the secrets file as a `VAR='value'` line after the first split, and a plain value such as a time zone to `plain_env` in the stack map. Never put a secret into `plain_env`, because the map is committed.
5. The file uses no YAML anchors (`&name`, `*name`, `<<:`), no `extends`, and no `network_mode: service:<name>` that points to a service of another stack.
6. Services are indented by 2 spaces and their keys by 4. `check_images.py` reads that layout.

If you changed the file, apply it. Compose recreates only the services whose settings changed:

```bash
docker compose -p home -f /home/docker-compose.yml up -d
```

Make sure that every application still works before you go on.

## Record what runs

1. Make the folder for working files. The `.gitignore` keeps it out of Git:

    ```bash
    mkdir -p /root/<your-repo>/work
    ```

2. Record each container and its image. Use the name of the server in the file name:

    ```bash
    cd /root/<your-repo> && bash tools/collect_state.sh > work/state-server-a.txt
    ```

3. Make sure that the record has one line for each container. The two numbers must be equal:

    ```bash
    wc -l < work/state-server-a.txt; docker ps -aq | wc -l
    ```

    If they differ, a container was created or removed during the run. Run step 2 again.

Each line of the record has nine fields, split by `|`:

| Field | Content |
| --- | --- |
| 1 | Container name |
| 2 | Configured image, as the compose file names it |
| 3 | Image ID |
| 4 | Repository digests (`repo@sha256:...`) |
| 5 | Version label of the image (`org.opencontainers.image.version`) |
| 6 | Compose project |
| 7 | Compose file or files |
| 8 | Start time |
| 9 | Hash of the environment variables, which changes when a variable changes, without showing a value |

4. List the sensitive-looking keys of the compose file. The output shows line numbers and key names only, so it is safe to share:

    ```bash
    bash tools/find_literals.sh < /home/docker-compose.yml
    ```

    Keep this list. Each key marked `LITERAL` holds a real value in the file, and it goes into `secret_keys` of the stack map in [Move the stacks](move-stacks.md#write-the-stack-map).

Do not overwrite `work/state-server-a.txt` after this point. Later steps compare new records with it.

!!! tip "A first look at a server"
    If you do not know a server well yet, run `bash tools/inspect-server.sh > work/inspect-server-a.txt` first. It prints the versions, the containers, the networks, the open ports and every compose file, with secrets masked. Read its output before you share it, because host names and addresses stay visible.

## Pin the images

A pin is an image reference with a digest, such as `postgres:15-alpine@sha256:<64 hex digits>`. A digest is a hash that names one exact image. With pins, the move to stacks keeps each container on the image it runs today, even if the tag points to a newer image by now.

The pins of a server go into `tools/pins/server-a.json` in the server's clone, one entry for each service in the compose file that will move into a stack:

```json
{
  "sonarr": "lscr.io/linuxserver/sonarr:4.0.15.2941-ls292@sha256:<digest>",
  "sonarr-db": "postgres:15-alpine@sha256:<digest>"
}
```

Use these rules to write a pin:

1. Take the digest of the image that the container runs. It is in field 4 of the record (`repo@sha256:...`).
2. Use a version tag only if that tag still resolves to the same digest in the registry. Field 5 often names the version, so try that tag first.
3. Keep the current tag for a date tag or a channel, such as `nightly` or `stable`.
4. If no version tag matches, keep the current tag. An image without a tag uses `:latest`.
5. For a database, always use a tag that names a release series, such as `postgres:15-alpine` or `mariadb:11.4`, that resolves to the same digest. A database tag such as `latest` lets Renovate move it to a new major version (see [Renovate](renovate.md#the-rules)).

The tag decides what Renovate offers later. With a version tag, Renovate opens pull requests for new versions. With `latest` or a channel, it can only offer new digests of the same tag.

To see the digest that a tag has today, run this on any host with Docker. It only reads public registry data:

```bash
docker buildx imagetools inspect lscr.io/linuxserver/sonarr:4.0.15.2941-ls292 --format '{{.Manifest.Digest}}'
```

If field 4 of the record is empty, the tag moved to a newer image after the container started, so no repository digest names the running image. Then do one of these:

- If the server uses the containerd image store (`docker info | grep driver-type` shows `io.containerd.snapshotter.v1`), the image ID in field 3 is the digest. Use it.
- With the older `overlay2` storage, the image ID is not a registry digest. Find the digest of the running version in the registry, for example by its version label in field 5. The command above shows the digest of a tag.

Make sure that the registry still has each digest:

```bash
docker buildx imagetools inspect postgres@sha256:<digest> --format '{{.Manifest.Digest}}'
```

If the registry no longer has a digest, the move cannot pull it. With the containerd image store, the image is still on the host, so the move uses it. Otherwise, pin the newest digest of the tag, and expect a new image for that service at the move.

When the pins are complete, commit them from the server's clone:

```bash
git add tools/pins/server-a.json && git commit -m "Pin the images of server-a" && git push
```

!!! note "Docker Hub limits"
    Docker Hub limits anonymous requests for each public IP address. If a command fails with `429 Too Many Requests`, wait, or run it from a host with another public address.
