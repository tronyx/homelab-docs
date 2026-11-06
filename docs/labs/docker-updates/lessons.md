---
title: Lessons learned
description: The traps that cost time while moving a homelab to Forgejo, Renovate and Komodo, each with its cause and its fix.
---

# Lessons learned

These are the problems that cost time during the build, so that you can skip them. Each one says what you see, why it happens, and what to do.

## Docker

### Containers stay down after a Docker update

After an update of `docker-ce` or a reboot, some containers do not come back, often the databases first. With `restart: on-failure`, Docker starts a container again only if it stopped with an exit code other than 0, and Postgres stops with code 0 at a clean shutdown. Use `restart: unless-stopped` for every service. A container that you stop by hand still stays stopped.

### Moving Docker's data folder moves almost nothing

Docker 29 uses the containerd image store on new installs. The images and their layers are then in containerd's folder, `/var/lib/containerd`, not in `/var/lib/docker`. `docker info | grep driver-type` shows `io.containerd.snapshotter.v1` in that case. To move the data to a bigger disk, move both folders:

1. Stop `docker.socket`, `docker.service` and `containerd.service`, and copy both folders with `rsync -aHAXS --numeric-ids`. A dry run of the same command with `--delete --itemize-changes` must then list nothing.
2. Rename the old folders, so that nothing uses them by mistake.
3. Set `root = "/home/containerd"` in `/etc/containerd/config.toml` and `"data-root": "/home/docker"` in `/etc/docker/daemon.json`.
4. On a system with SELinux, give the new folders the labels of the old paths with `semanage fcontext -a -e /var/lib/containerd /home/containerd` and `semanage fcontext -a -e /var/lib/docker /home/docker`, then `restorecon -R /home/containerd /home/docker`.
5. Add `RequiresMountsFor=` in a drop-in file for each service, so that neither starts on an empty folder if the disk is not mounted. Run `systemctl daemon-reload`.
6. Start containerd and Docker again. `docker info --format '{{.DockerRootDir}}'` must show the new path, and the image list must be the same as before. Delete the old folders only after some days without a problem.

After each update of `containerd.io` or `docker-ce`, make sure that both settings are still in effect: `containerd config dump | grep -E '^root '` and `docker info --format '{{.DockerRootDir}}'`.

Docker rewrites the paths of each container at the next start, so no container needs a recreate.

### A prune leaves old images behind

With the containerd image store, `docker image prune -a` keeps a tag that the configuration of a container names, even when the container runs the image of a digest. Old images pulled by tag, before the stack files pinned digests, then stay on the disk. Find them with `docker system df -v`: a tagged image with `0` containers whose name a running service uses. Remove each by name with `docker image rm`, without `-f`. With the older `overlay2` storage, `prune -a` removes them as expected.

### A Compose version gap recreates containers

The first Komodo Deploy of a stack that you started by hand can recreate every container, although nothing changed. Compose stores a hash of the configuration in a label, and two Compose versions far apart compute different hashes. Keep the Compose plugin on the host close to the version inside Periphery, and compare them with `docker compose version` and `docker exec komodo-periphery docker compose version`.

### Docker Hub refuses requests

A pull or a registry lookup fails with `429 Too Many Requests`. Docker Hub limits anonymous requests for each public IP address, and all hosts behind one router share it. Log in with a read-only Docker Hub token on the host, add the same account as a registry in Komodo, and wait or use another host for lookups.

## Komodo

### A secret disappears after a #

A secret that holds a space and then `#` reaches the container cut short. Komodo reads ` #` in an Environment line as the start of a comment. Before you create the Variables, count such values with `grep -c ' #'` on the secrets file. It must print `0`.

### Words vanish from the logs

Komodo replaces the value of every secret Variable with a mask in its logs. If a secret value is a common word, such as a database user named like its service, that word disappears from every log line, container names included. Keep such values in mind when a log looks strange, or give the database user a name of its own.

### Periphery cannot read the env files

A Deploy fails because Compose cannot find an env file that exists on the host. Periphery runs Compose inside its own container, so it sees only what is mounted. Mount the env file folder read-only into Periphery, and mount its root directory at the same path inside and outside.

### Critical stacks cannot deploy themselves

The Deploy of the proxy or of Forgejo fails at the Git pull while that stack is down, because the pull goes through them. Start them with a direct `docker compose -p <stack> up -d` from Komodo's clone, then Deploy, as in [Critical stacks and recovery](critical-stacks.md).

## SWAG

### Every site is down after SWAG restarts

SWAG downloads its Docker mods from `lscr.io` at each start. If your DNS server blocks `lscr.io`, for example a Pi-hole block list, SWAG never finishes its start, and every site behind it stays down. Read the log of `swag`, and allow `lscr.io` on `<dns-server-ip>`.

### A route returns 502 after a move

After a stack moves, a SWAG route to one of its containers returns 502. A move recreates the container, and it can get a new IP address. nginx looks up a fixed name in `proxy_pass` only when it starts or reloads. Use the variable form with `resolver.conf`, `$upstream_app`, `$upstream_port` and `$upstream_proto`, which nginx looks up at each request.

### The LAN rule must allow the router

A LAN rule for `<komodo-host>` that allows only your PC also blocks your PC. A request to your public host name from the LAN goes out to the router and comes back in, so SWAG sees the router's LAN address. Allow the whole `<lan-subnet>`.

## Renovate

### A closed pull request never comes back

If you close a Renovate pull request without a merge, Renovate treats that version as ignored and opens no new pull request for it. A newer version gets a new pull request. For a major update, closing it ignores the whole major version, so newer releases of that major do not come either. Close a pull request only when you want to skip that update.

### A pull request shows "branch already included"

After a revert, a later pull request can have the same commit as the reverted one. Tick its checkbox, and Renovate rebuilds the branch on its next run.

### A database tag moves to a new major version

`postgres:latest` or `redis:alpine` follow the newest major version, so a digest update can move a database to a new major version without a review. Use tags that name a series, such as `postgres:18`, and turn off major updates for databases in `renovate.json`.

### MariaDB patch updates disappear

Turning off minor updates for MariaDB and Mongo can also hide their patch updates. When a newer minor version and a newer patch both exist, Renovate offers only the minor update by default, and the rule turns that off. Set `separateMinorPatch` for those images, as in the `renovate.json` of the [Renovate](renovate.md) part, so that the patch update gets its own pull request.

### Bitnami tags are gone

In 2025, Bitnami removed most of its free version tags from Docker Hub. An image such as `bitnami/wordpress:latest` gets new digests but no versions, and a pull of an old version tag can fail. Plan a move to the official image, and keep the old Bitnami image on the host while you need it for a rollback.

## Databases

### A database major upgrade needs a dump and a restore

Postgres does not read the data folder of an older major version, so a Postgres upgrade always needs a dump and a restore. MariaDB can upgrade a data folder in place (with `mariadb-upgrade`), and Mongo can do it one major version at a time, but a dump and a restore is the safe path for all three, because the old folder stays untouched as the rollback. Dump the old database, restore the dump into a temporary container on a new folder, compare the table and row counts of both, then change the stack file. Keep the old folder until the new version has run for some weeks.

### Postgres 18 mounts another path

The Postgres 18 image keeps its data in `/var/lib/postgresql/18/docker`, so its volume mounts `/var/lib/postgresql`. Postgres 17 and older mount `/var/lib/postgresql/data`.

### A restore also fixes the collation warning

A dump can warn that a database was created under another `glibc` version than the image has now. Postgres sorts text by rules from `glibc`, so indexes on text can be in the wrong order. A restore builds every index again, so a restored database has no mismatch. Alpine-based images use another C library and do not have the problem.

### Application images can pin their database extension

Immich checks the version of its vector extension at start. Its Postgres image must have the version that the Immich release expects, which can mean a newer Postgres image is not usable yet. Follow the compose file of the application's release, not the newest Postgres.

## Forgejo and Git

### The doctor breaks SSH passthrough

With SSH passthrough, Forgejo and the host share one `authorized_keys` file, which also holds a plain key line that the passthrough needs. `forgejo doctor check --all` reports that file as an error. Do not run the fixes it suggests (`forgejo admin regenerate keys`, `--run authorized-keys --fix`): they write the file from Forgejo's keys only, drop the plain line, and stop every push over SSH.

### HTTPS pushes hang on Windows

On a Windows PC, an HTTPS remote can make Git Credential Manager open a browser for the sign-in, and that can hang. Use an SSH remote on the PC.

## Oracle Linux

### dnf stops on an EPEL package

A plain `dnf update` stops with `nothing provides ... needed by ... from epel`. Oracle Linux sets the dnf variable `releasever` to the major version only, so the EPEL address becomes `epel-10`, which points at the EPEL branch for the next minor release. Until Oracle Linux catches up, update with `dnf update --nobest`, and make sure that the summary shows no package under Removing. Do not pin EPEL to a minor version: after the next upgrade, a forgotten pin keeps the host on a branch with no updates.
