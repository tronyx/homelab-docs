---
title: Unraid servers
description: Add an Unraid server to the setup, with anchors in the stack files, Periphery on a disk, a pinned Compose plugin and a weekly version message.
---

# Unraid servers

An Unraid server can join the same loop as the other servers. Renovate opens the pull requests, and a merge deploys the changed stacks. In November 2026, I moved one Unraid server with two containers into this setup. This page explains what is different on Unraid, and how the move went.

The examples call the Unraid server `server-c`. `<appdata>` is a folder on the array or on a pool of `server-c`, so that its files stay after a restart. Replace both with your own values.

## How Unraid differs

| | `server-a` and `server-b` | `server-c` on Unraid |
| --- | --- | --- |
| Containers before the move | One large compose file | Templates in the Docker tab of Unraid |
| Restart policy | `unless-stopped` | `"no"`, except for Periphery |
| Komodo folders | `/home/komodo` | `<appdata>/komodo`, because Unraid keeps `/etc`, `/home` and `/root` in RAM |
| Compose on the host | The Compose plugin from [Prerequisites](prerequisites.md#what-you-need) | A pinned plugin that a User Script installs at each start of the array |
| Clones of the repository | The server's clone and Komodo's clone | Komodo's clone only |
| Periphery connects to Core | Through the restricted route (`server-b`) | Directly on the LAN |

The server has no clone of its own, so it needs no deploy key. `check_images.py` needs Python. My Unraid server has no Python, so that script does not run there, and the server has no stack map. The other steps on this page use the User Scripts plugin of Unraid, and bash, `curl` and Docker on the server.

## The stack files

`server-c` has one compose file for each stack, such as `server-c/monitoring/docker-compose.yml`, as on the other servers. One file for the whole server is also possible. But Komodo, Renovate and the backup tool work stack by stack, and a bad update then stops only one stack. You write each stack file yourself, from the settings of the running container.

The top of each file holds two YAML anchors. An anchor is a named block that the file can reuse. `x-base-defaults` holds the restart policy, the stop time and the log limits. `x-env-defaults` holds the time zone:

```yaml
name: monitoring

x-base-defaults: &base_defaults
  restart: "no"
  stop_grace_period: 120s
  logging:
    driver: json-file
    options:
      max-file: "10"
      max-size: 2m
x-env-defaults: &env_defaults
  TZ: ${TZ:-Etc/UTC}

services:
  telegraf:
    <<: *base_defaults
    container_name: telegraf
    image: telegraf:1.40.3-alpine@sha256:<digest>
    labels:
      net.unraid.docker.icon: "<icon-url>"
    environment:
      <<: *env_defaults
      HOST_PROC: /rootfs/proc
```

Set `TZ` to your time zone. The tools of the repository, such as `check_images.py` and `split_stacks.py`, read a compose file line by line. So two rules apply to the anchors:

1. An anchor never holds `image` or `container_name`. Each service has its own two lines.
2. Each service takes `<<: *base_defaults`.

The rule against anchors in [Prepare the large file](backup.md#prepare-the-large-file) is for the large file that `split_stacks.py` splits. A stack file that you write yourself can use anchors with these two rules.

Each service has the label `net.unraid.docker.icon`, so that the Docker tab of Unraid shows its icon. In my repository, tests hold these rules for each Unraid stack file:

- Each service has the restart policy `"no"` and 120 seconds to stop. A service can have its own value only if the test lists it.
- Each image has a tag and a digest.
- Each service has the icon label.
- The env files are only in the env folder of the server.
- No stack file holds a secret value.

Unraid sets the variables `HOST_OS`, `HOST_HOSTNAME` and `HOST_CONTAINERNAME` when it makes a container from a template. If the application does not use them, leave them out of the stack file.

## The restart policy

In my lab, no container on the Unraid server starts by itself after a restart of the server. I start each one by hand. So the app containers have `restart: "no"`.

Periphery is the exception, with `restart: unless-stopped`. It is the only container on the server that starts by itself. It starts no other container, and you then start each stack in Komodo.

!!! warning "A merge starts a stopped stack"
    The Procedure of the server deploys each changed stack after a merge. I chose this over a Deploy by hand, because a merged update must not wait until somebody remembers to click Deploy. A Deploy also starts a stack that you stopped on purpose.

## Docker Compose on the host

Komodo does not need Compose on the host, because Periphery has its own. The host needs Compose only to create or update the Periphery container.

An older User Script of mine downloaded the newest Compose from GitHub at each start of the array, to `/usr/local/bin/docker-compose`. It had four faults:

- It had no pin, so each start took the newest release.
- It had no checksum.
- If a download failed, it was able to save an error page as the program.
- It installed `docker-compose`, but this guide uses `docker compose`.

`tools/install_compose.sh` ([Scripts](scripts.md#the-unraid-scripts)) replaces it. It runs as the User Script `Install_Compose` with the schedule "At Startup of Array":

- It copies the pinned plugin from the folder `<appdata>/tools/compose` to `/usr/local/lib/docker/cli-plugins/docker-compose`, with mode 755.
- It copies the plugin only if its SHA256 matches the first word of `docker-compose.sha256` in the same folder.
- It needs no internet.
- It copies to a temporary name first and then renames the file. So a failed copy never leaves half a plugin.
- If the folder is on a disk that Unassigned Devices mounts late, the script waits up to 5 minutes for it. It looks every 10 seconds.

The exit code 0 means that the script installed the plugin. 1 means that the checksum does not match or the install failed. 2 means that a file is missing.

### Install or update the plugin

A new version comes only when you put it into the tools folder. Do these steps on `server-c`, in a root shell. Replace `<version>` with the version of the release, such as `5.7.1`.

1. Make the tools folder:

    ```bash
    install -d -m 755 <appdata>/tools/compose
    ```

2. Download the file of the release to `/tmp`:

    ```bash
    curl -fL -o /tmp/docker-compose https://github.com/docker/compose/releases/download/v<version>/docker-compose-linux-x86_64
    ```

3. Show its checksum. Compare it with the checksum of `docker-compose-linux-x86_64` on the release page of GitHub. If they differ, stop:

    ```bash
    sha256sum /tmp/docker-compose
    ```

4. Copy the file to the tools folder:

    ```bash
    install -m 755 /tmp/docker-compose <appdata>/tools/compose/docker-compose
    ```

5. Write the checksum file:

    ```bash
    printf '%s  docker-compose\n' '<the SHA256 checksum of the release page>' > <appdata>/tools/compose/docker-compose.sha256 && chmod 644 <appdata>/tools/compose/docker-compose.sha256
    ```

6. The first time only: in the User Scripts plugin, add a script named `Install_Compose` with the text of `install_compose.sh`. Set its schedule to "At Startup of Array".
7. Run the script `Install_Compose`. The output must end with the new version, for example `install_compose: installed from <appdata>/tools/compose: Docker Compose version v5.7.1`.
8. Show the version:

    ```bash
    docker compose version
    ```

Keep this version close to the version inside Periphery (see [Lessons learned](lessons.md#a-compose-version-gap-recreates-containers)).

## A weekly message about new versions

The plugin never updates by itself. `tools/check_compose.sh` ([Scripts](scripts.md#the-unraid-scripts)) tells you in Discord when a newer release is out. It runs as the User Script `Check_Compose` on a custom schedule, for example `0 9 * * 1` (each Monday at 09:00).

The script reads its configuration from the flash drive, in `/boot/config/plugins/compose/check-compose.conf`. Give it its own Discord webhook:

```text
DISCORD_WEBHOOK_URL=<discord-webhook-url>
DISCORD_MENTION=<an optional text at the start of the message>
```

The script reads this file and never runs it. It never prints the webhook address. A run does these steps:

1. It compares `docker compose version --short` with the release `releases/latest` of Compose on GitHub, as numbers. That release is never a pre-release.
2. If a newer release exists, or Compose is missing, it sends a message. The message names the host, both versions and the link to the release notes. It also says when the first number of the version changes.
3. The message comes again at each run, until you install the new version.
4. If GitHub does not answer, the script sends nothing and exits with 1. The next run tries again.

To test the message, move the plugin aside, run `Check_Compose`, and move the plugin back. Discord must show the message that Compose is not installed. When the newest version is installed, the output is one line such as `check_compose: 5.7.1 is the newest release.`

## Komodo Periphery

The Periphery file of `server-c` is `komodo/periphery-server-c/docker-compose.yml` in the repository (see [Scripts](scripts.md#configuration-files)). Renovate updates it with the other Komodo files. The `komodo` group of `renovate.json` matches the image names, and the rule for `komodo/**` adds the label `deploy-by-hand`.

### The folders

Unraid keeps `/etc`, `/home` and `/root` in RAM. So Periphery keeps its folders on a disk. Each folder belongs to root, with mode 700:

| Folder | Content |
| --- | --- |
| `<appdata>/komodo/keys` | The keys of Periphery. The onboarding writes `core.pub` here. |
| `<appdata>/komodo/periphery` | The root directory, with the same path inside and outside the container. Komodo clones the repository to `repos/<your-repo>-server-c` here. |
| `<appdata>/.env_files` | The env files of the stacks, mounted read-only at the same path. Compose runs inside Periphery, and the stack files name host paths. |

```bash
install -d -m 700 <appdata>/komodo/keys <appdata>/komodo/periphery <appdata>/.env_files
```

### The connection to Core

The Periphery of `server-c` connects out to Core directly on the LAN, with `PERIPHERY_CORE_ADDRESS: ws://<server-a-lan-ip>:9120`. The restricted route lets `/ws/periphery` through only from `server-b`. So the public name returns 403 from the LAN. The direct connection has no TLS. But it stays on the LAN, and each side authenticates the other with its keys.

### Copy the file to the server

The server has no clone outside Komodo, so it gets a copy of the Periphery file.

1. In Forgejo, open `komodo/periphery-server-c/docker-compose.yml`, and click Raw.
2. On `server-c`, paste the text into `<appdata>/komodo/docker-compose.yml`.
3. Show the checksum of the copy on `server-c`, and of the file in your clone on your PC. Both must be the same:

    ```bash
    sha256sum <appdata>/komodo/docker-compose.yml
    sha256sum komodo/periphery-server-c/docker-compose.yml
    ```

### Connect server-c

Do the steps of [Connect server-b](komodo.md#connect-server-b), with these changes:

- The env file for the onboarding key is `<appdata>/.env_files/.komodo-periphery.env`.
- Start Periphery with `docker compose -f <appdata>/komodo/docker-compose.yml up -d`, and add `--force-recreate` after you empty the env file.
- The first start logs `Failed to read public key at "/config/keys/core.pub"`. This is expected. The onboarding writes that file a moment later.

When the onboarding is done, the server `server-c` shows OK in Komodo with all of its containers. Delete the onboarding key.

To update Periphery after you merge a `komodo` pull request, copy the file again as above. Then run `docker compose -f <appdata>/komodo/docker-compose.yml up -d` on `server-c`.

## Create the Repo and the Stack

Do these steps in Komodo, as in [Prepare Komodo](move-stacks.md#prepare-komodo) and [Create the Stack](move-stacks.md#create-the-stack).

1. Create a Repo named `<your-repo>-server-c`: Server `server-c`, git provider `<forgejo-host>`, account `<your-user>`, repo `<your-user>/<your-repo>`, branch `main`, webhook off.
2. Click Clone on the Repo. The clone must finish without an error.
3. Create a Stack named `server-c-monitoring`:

    - Server: `server-c`
    - Source: the Repo `<your-repo>-server-c`
    - Run Directory: `server-c/monitoring`
    - File Paths: `docker-compose.yml`
    - Project Name: `monitoring`
    - Image Registry: `docker.io`, with your Docker Hub account
    - Environment: empty, because the env files hold the secrets

4. Make sure that the webhook, Auto Update and Poll For Updates of the Stack are off.

Do not create the Procedure of `server-c` yet. It comes after the first Deploy.

## Move the containers

### Before the move

1. Write the stack file with the digest of the image that runs now, so that the move changes no version. [Pin the images](backup.md#pin-the-images) explains how to find it. Commit and push the file, and click Pull on the Repo in Komodo.
2. Copy each secret of the old container into an env file, without showing it. This example copies `INFLUX_TOKEN` of `telegraf`:

    ```bash
    (umask 077; docker inspect telegraf --format '{{range .Config.Env}}{{println .}}{{end}}' | grep '^INFLUX_TOKEN=' > <appdata>/.env_files/.telegraf.env)
    ```

3. List the mounts of each old container:

    ```bash
    docker inspect scrutiny --format '{{range .Mounts}}{{.Source}} -> {{.Destination}}{{println}}{{end}}'
    ```

    Compare the list with the folders where the application keeps its data. If a data folder is not under a mount, the data is inside the container. A new container does not have it. See [An application keeps its data inside the container](lessons.md#an-application-keeps-its-data-inside-the-container).

4. Keep the old templates. Unraid keeps them in `/boot/config/plugins/dockerMan/templates-user`, as `my-<name>.xml`. They are the rollback.

### The move

The applications are down from step 1 until the Deploy finishes.

1. Stop the old containers:

    ```bash
    docker stop telegraf scrutiny
    ```

2. Copy the data out of a stopped container that keeps it inside. The folder `<appdata>/scrutiny` must exist and must not hold old files. Move old files aside first. The stack file binds `<appdata>/scrutiny/config` and `<appdata>/scrutiny/influxdb`:

    ```bash
    docker cp scrutiny:/opt/scrutiny/config <appdata>/scrutiny/ && docker cp scrutiny:/opt/scrutiny/influxdb <appdata>/scrutiny/
    ```

3. Remove the old containers:

    ```bash
    docker rm telegraf scrutiny
    ```

4. In Komodo, open the Stack `server-c-monitoring` and click Deploy.

In my move, the metrics of the server had a gap of about 4.5 minutes. Telegraf installs `smartmontools` and `nvme-cli` at each start, so its work began about two minutes after the container started.

### After the move

1. Show the project, the restart policy and the stop time of each container. After the container name, each line must show `monitoring no 120`:

    ```bash
    docker inspect --format '{{.Name}} {{index .Config.Labels "com.docker.compose.project"}} {{.HostConfig.RestartPolicy.Name}} {{.Config.StopTimeout}}' telegraf scrutiny
    ```

2. Count the error lines in the Telegraf log. The count must be `0`:

    ```bash
    docker logs telegraf 2>&1 | grep -c 'E!'
    ```

3. Make sure that new points from the server arrive in your metrics database.
4. Open each application, and make sure that your data is there. In my move, the drive history of Scrutiny still went back to April.

If the move fails, click Destroy on the Stack. Then, in the Docker tab of Unraid, click Add Container, and choose each old template.

## Create the Procedure

Create the Procedure `deploy-changed-server-c` only after the first Deploy of each Stack in its pattern. A Stack that never deployed can count as changed. A push can then create its containers a second time, next to the running ones.

1. Create the Procedure as in [Create the Procedures](webhooks.md#create-the-procedures), with one stage: Batch Deploy Stack If Changed on `server-c-monitoring`.
2. Click Save. The header of the Procedure must show `1 STAGE`. A Procedure saved with `0 STAGES` runs without an error but deploys nothing (see [Lessons learned](lessons.md#a-procedure-with-no-stage-deploys-nothing)).
3. Turn on its webhook, and add one more Forgejo webhook as in [Create the webhooks in Forgejo](webhooks.md#create-the-webhooks-in-forgejo).
4. Push a commit that changes only a comment in the stack file. The Stack must then show `deployed: <commit>`, and no container restarts.

## After a restart of the server

1. Periphery starts by itself.
2. The User Script `Install_Compose` runs at the start of the array.
3. In Komodo, start each Stack of `server-c`.

## Close the appdata share

!!! warning "Do not export the appdata share without a password"
    Unraid can export a share over SMB or NFS, also as public and writable. If the share that holds `<appdata>` is exported that way, any device on the LAN can read and change its files without a password. These include the configuration files of privileged containers. In the settings of the share, set Export to No.
