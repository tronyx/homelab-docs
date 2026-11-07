---
title: Weekly backups
description: Back up every Compose stack once a week with restic, one stopped stack at a time, with backup_stacks.py and a systemd timer.
---

# Weekly backups

Renovate and Komodo keep your images current, and a revert rolls an image back. Neither one protects the data of your stacks. This part adds a weekly backup of every stack with `backup_stacks.py` and restic.

restic is a backup program that stores each chunk of data once. After the first run, a backup writes only what changed, so a weekly run of a large stack takes seconds to minutes. restic also encrypts everything, and it can write to a local disk, an NFS share, SFTP, or S3-compatible storage such as Backblaze B2.

A copy of a database folder is only consistent while the database is stopped. So the script stops one stack, backs up the folders that its containers mount, and starts the stack again. Each stack is down only for its own backup.

The script does not depend on the rest of this guide. It finds stacks by the Compose project label, so it works with Komodo, Portainer, Dockge or plain `docker compose`.

## What a run does

1. It takes a run lock, so only one run works at a time.
2. If you name a backup share, it makes sure that the share is mounted and writable. If not, it stops no stack and reports the failure.
3. For each stack, in alphabetical order and then the stacks you name as last:
    - It stops the services that run, with 120 seconds for a database to shut down.
    - It runs `restic backup` on every folder that the stack mounts inside your data roots, plus its named volumes and a manifest file.
    - It starts the services again. A start that fails is tried 3 times, and then with `docker start`.
4. It deletes old snapshots by your retention rule, for example 4 weekly snapshots of each stack, and runs `restic check`.
5. It sends a report to Discord, Healthchecks.io or ntfy, whichever you set up.

The manifest file lists each container of the stack with its image, image digest and mounts. A restore uses it to find the image that can read the files, also after a later major upgrade of a database.

The script never pulls an image, never runs `docker compose down`, and never deletes a container or volume. A stack that was running is running after the backup, also when its backup fails. A stack that was stopped stays stopped, and its files are still backed up.

!!! note "What is not backed up"
    Only folders that a stack's containers mount are in a snapshot. Paths outside your data roots, such as `/etc/localtime` or a media share under `/mnt`, are skipped, and so are anonymous volumes. The report lists every skipped path. See [Look for data in anonymous volumes](#look-for-data-in-anonymous-volumes) before your first run.

## What you need

- Docker with the Compose plugin, and Python 3.9 or later. The script uses the standard library only.
- A current release of restic on each server. The setup was tested with 0.19.1.
- A place for the repository: a disk or share that is not the server's own system disk, or a bucket.
- The script, an example config and the systemd units from the [Scripts](scripts.md#backup_stackspy) page.

## Set it up

Do these steps on each server, in a root shell. The examples use `server-a`, with its data in `/home` and the repository on an NFS share at `/mnt/backup`.

1. Install restic from its release page, and check the download against the release's `SHA256SUMS`:

    ```bash
    cd /tmp && curl -fsSLO https://github.com/restic/restic/releases/download/v0.19.1/restic_0.19.1_linux_amd64.bz2 && curl -fsSLO https://github.com/restic/restic/releases/download/v0.19.1/SHA256SUMS && grep ' restic_0.19.1_linux_amd64.bz2$' SHA256SUMS | sha256sum -c -
    ```

    The output must be `restic_0.19.1_linux_amd64.bz2: OK`. Then install it:

    ```bash
    bunzip2 -c /tmp/restic_0.19.1_linux_amd64.bz2 > /usr/local/bin/restic && chmod 755 /usr/local/bin/restic && restic version
    ```

2. Put the script in your repository as `tools/backup_stacks.py`, and the config as `tools/backup/server-a.json`. Edit the config for the server (see [The config](#the-config)), commit and push, and pull on the server.
3. Link both into place, so that a `git pull` updates them:

    ```bash
    install -d -m 755 /etc/backup-stacks && ln -s /root/<your-repo>/tools/backup/server-a.json /etc/backup-stacks/server-a.json && ln -s /root/<your-repo>/tools/backup_stacks.py /usr/local/sbin/backup_stacks.py
    ```

    Without a repository, copy the two files to those paths instead.

4. Create the secrets file, readable only by root, then fill it in an editor (see [The secrets file](#the-secrets-file)):

    ```bash
    install -m 600 /dev/null /etc/backup-stacks/server-a.env
    ```

    Keep the restic password in your password manager too. Without it, the backups cannot be read.

5. Create the repository:

    ```bash
    python3 -I /usr/local/sbin/backup_stacks.py server-a --restic init
    ```

    The output must say `created restic repository`.

6. Show what a run would do. It stops nothing and reads no secrets:

    ```bash
    python3 -I /usr/local/sbin/backup_stacks.py server-a --all --dry-run
    ```

    Read the order, and for each stack the paths, the skipped paths and the tests to pause. A `Note:` line means that a name in your config matches no stack.

7. Make the first snapshot of every stack without stopping them. This is the slow run, because it uploads everything:

    ```bash
    systemd-run --unit=backup-seed --setenv=HOME=/root /usr/bin/python3 -I /usr/local/sbin/backup_stacks.py server-a --all --seed
    ```

    It runs on after you close SSH. `journalctl -u backup-seed` shows the report when it is done. A snapshot of a running database can be torn, so seed snapshots get the tag `seed` and are never used for a restore. The script deletes them after the first stopped run of each stack succeeds.

8. Back up one small stack the real way, then restore it to a test folder and compare:

    ```bash
    python3 -I /usr/local/sbin/backup_stacks.py server-a <stack>; echo "exit=$?"
    ```

    ```bash
    python3 -I /usr/local/sbin/backup_stacks.py server-a --restic restore latest --tag stack:<stack> --target /tmp/restore-test && diff -rq /tmp/restore-test/home/<stack> /home/<stack> | head
    ```

    The run must end with `exit=0`. Files that the stack changed after its start can differ; the rest must be the same. Then delete `/tmp/restore-test`.

9. Install the service and a timer. The service is the same for every server. The timer starts it once a week:

    ```bash
    cp /root/<your-repo>/tools/systemd/backup-stacks@.service /root/<your-repo>/tools/systemd/backup-stacks-server-a.timer /etc/systemd/system/ && systemctl daemon-reload && systemctl enable --now backup-stacks-server-a.timer && systemctl list-timers 'backup-stacks*' --no-pager
    ```

    The timer uses the server's time zone. To fix a zone, write it after the time, for example `OnCalendar=Sun *-*-* 03:00:00 Etc/UTC`. With two servers, give them different times when one server's run stops something the other needs, such as the proxy in front of your Healthchecks.

!!! tip "Use --restic, not the shell"
    For every restic command, such as `snapshots`, `restore` or `check`, use `--restic`. It runs restic with the secrets file. Do not source the secrets file in a shell: the shell changes values that contain `$`, a backtick or `\`, and the script reads them as written.

## The config

`/etc/backup-stacks/server-a.json` holds the settings of one server. Only `data_roots` is required. An unknown key stops the run with an error, so a typing mistake cannot turn off a setting without you knowing.

| Key | Default | Meaning |
| --- | --- | --- |
| `data_roots` | (required) | Folders whose bind mounts are backed up, for example `["/home"]` or `["/srv/appdata"]`. Not `/`. |
| `host` | the host name | restic's `--host`. Keep it the same, or the retention and the seed clean-up start a new history. |
| `require_mount` | none | A share that must answer. It is checked before the run and before each stack. |
| `last` | `[]` | Stacks that go at the end, in this order. Put the reverse proxy last. |
| `exclude` | `[]` | Stacks that `--all` leaves out. A stack named on the command line still runs. |
| `timeout_minutes` | `60` | The limit for one stack. restic is killed at the limit, and the stack starts again. |
| `retention` | `{"keep_weekly": 4}` | Any of `keep_last`, `keep_hourly`, `keep_daily`, `keep_weekly`, `keep_monthly`, `keep_yearly`. |
| `tronitor` | off | Pause Healthchecks tests while a stack is stopped (see below). |
| `hooks` | none | Commands before and after the run and each stack (see below). |
| `secrets_file` | `<name>.env` next to the config | |
| `manifest_dir`, `lock_path` | `/var/lib/backup-stacks/manifests`, `/run/backup-stacks.lock` | |

A name in `last`, `exclude` or `tronitor.monitors` that matches no stack is a note in the report and in the dry run.

### Monitoring with Tronitor

If you check your apps with Healthchecks and use [Tronitor](https://github.com/tronyx/Tronitor), the script can pause each stack's tests while it is stopped:

```json
"tronitor": {
  "path": "/opt/tronitor/tronitor.sh",
  "lock_dir": "/opt/tronitor/tmp",
  "monitors": {
    "media": ["Sonarr", "Radarr"],
    "proxy": ["*"]
  }
}
```

- `monitors` names the tests by the names that `tronitor.sh -m hc -l` shows. `["*"]` means every test that is neither paused nor down. Use it for a stack that many checks depend on, such as the reverse proxy.
- A test that is already paused or down is left alone, so a test that you paused by hand stays paused.
- After the start, a test counts as unpaused only when Tronitor's list shows it, and the script tries again for up to 5 minutes. Tronitor can exit with 0 while Healthchecks itself is still starting.
- `lock_dir` is optional. Set it to Tronitor's temp folder if your check scripts skip an app while `<test ID>.lock` exists there. The script then creates those lock files, and `healthchecks.lock` for `"*"`, and removes the ones that Tronitor writes when it pauses a test.

### Hooks

A hook is a command, written as a list of words. It runs without a shell, with a 5-minute limit, and gets no secrets:

```json
"hooks": {
  "before_run": ["touch", "/run/backup-running"],
  "after_run": ["rm", "-f", "/run/backup-running"]
}
```

| Hook | When | Variables |
| --- | --- | --- |
| `before_run` | after the run lock and the share check | `BACKUP_HOOK` |
| `before_stop` | before a stack is stopped | `BACKUP_STACK` |
| `after_start` | after the stack started again, also after a failure | `BACKUP_STACK`, `BACKUP_STACK_OK` (`1` or `0`) |
| `after_run` | after the last stack, also when the run is stopped | `BACKUP_RUN_OK` (`1` or `0`) |

A seed run only runs `before_run` and `after_run`. A hook that fails, hangs or cannot start is a note in the report. It never changes the result of the backup. A file that another script checks, such as the one above, is a typical use: that script can skip its alerts while a backup runs.

## The secrets file

`/etc/backup-stacks/server-a.env` has one `KEY='value'` line for each setting. Put every value in single quotes. Only the first two are required:

```text
RESTIC_REPOSITORY='/mnt/backup/restic-server-a'
RESTIC_PASSWORD='<a long random password>'
DISCORD_WEBHOOK_URL='https://discord.com/api/webhooks/...'
HC_PING_URL='https://hc-ping.com/<uuid>'
NTFY_URL='https://ntfy.sh/<your-topic>'
NTFY_TOKEN='<ntfy access token>'
```

For a bucket, the repository and its keys look like this, here for Backblaze B2:

```text
RESTIC_REPOSITORY='s3:https://s3.<region>.backblazeb2.com/<bucket>/restic-server-b'
AWS_ACCESS_KEY_ID='<keyID>'
AWS_SECRET_ACCESS_KEY='<applicationKey>'
```

Keys that start with `RESTIC_`, `AWS_`, `B2_`, `AZURE_`, `GOOGLE_`, `OS_`, `ST_` or `RCLONE_` go to restic and to nothing else. The script refuses a file that others can read, and its messages name keys, never values.

!!! tip "A B2 bucket for restic"
    Give restic a bucket of its own. Set its lifecycle to "Keep only the last version of the file", leave Object Lock off, and make an application key for that bucket only, with read and write access. Otherwise, the weekly prune either frees no space or fails.

Each notification is used only when its key is set:

- **Discord:** one message per run, green or red.
- **Healthchecks.io:** a ping at the start, then success or `/fail` with the report. Give the check the schedule of the timer and a grace time of a few hours, and you also get an alert when a run never happens. Use a check that does not run on the server it watches.
- **ntfy:** the report, with the first line as the title, high priority and a warning tag on a failure.

## Read the report

| Line | Meaning |
| --- | --- |
| `Backup of server-a succeeded` | Every stack was backed up, the prune and the check worked. |
| `<stack>: ok, down 1m 15s, added 2.0 KiB` | The stack was stopped for that time, and the snapshot added that much new data. |
| `<stack>: FAILED, <error>` | That stack has no new snapshot. Its older snapshots are kept. |
| `Still stopped: <stack>` | The stack did not start again. Start it, and read its log. |
| `not backed up: backup target not answering` | The share or the bucket stopped answering. No further stack was stopped. |
| `Missing paths:` | A folder that a container mounts does not exist. The rest of the stack was backed up. |
| `Notes:` | For example a test that is still paused, a hook that failed, or a name in the config that matches no stack. |
| `restic check:` | The repository has a problem. Run `--restic check` by hand before the next prune. |
| `Skipped:` | Paths that are never backed up. |

Exit codes: 0 all stacks backed up, 1 something failed, 2 a problem with the arguments, the config or the secrets, another run, or the share. With exit code 2, no stack was stopped.

To stop a run that hangs, use `systemctl stop backup-stacks@server-a.service`. The script then starts the stack that is down, restores its tests, runs `after_run` and sends a red report before it exits.

## Restore a stack

The example restores the stack `media` on `server-a`.

1. List its snapshots, and choose one. `latest` is the newest:

    ```bash
    python3 -I /usr/local/sbin/backup_stacks.py server-a --restic snapshots --tag stack:media
    ```

2. Restore it to a new folder:

    ```bash
    python3 -I /usr/local/sbin/backup_stacks.py server-a --restic restore latest --tag stack:media --target /root/restore-media
    ```

3. Read the manifest. It shows the image of each container at the time of the backup:

    ```bash
    cat /root/restore-media/var/lib/backup-stacks/manifests/media.json
    ```

    If a database image there has another major version than your stack file, set the image from the manifest first. A database folder can only be read by the major version that wrote it.

4. Stop the stack, for example with Stop in Komodo.
5. Move each live folder aside, and copy the restored folder into its place:

    ```bash
    mv /home/media /home/media.before-restore && cp -a /root/restore-media/home/media /home/media
    ```

    Do the same for each folder of the stack.

6. Start the stack again, for example with Deploy in Komodo.
7. When the stack works, delete `/root/restore-media` and the `.before-restore` folders.

To restore only some files, add `--include <path>` to the restore command.

## Look for data in anonymous volumes

An image can declare a volume, for example `VOLUME /var/lib/app`. If your compose file mounts nothing at that path, Docker creates an anonymous volume. The data in it is not backed up, and it is replaced by an empty volume every time the container is recreated, for example after an image update.

The dry run lists these as `anonymous volume <path> of <container>`. For each one, look at what is inside:

```bash
docker exec <container> sh -c 'du -sh <path>; ls -la <path> | head'
```

An empty folder or a cache is fine. If it holds data, such as keys or uploads, copy it to a folder in your data root and mount that folder at the path:

```bash
docker stop <container> && mkdir -p /home/<app>/var && docker cp -a <container>:<path>/. /home/<app>/var/
```

Add `- /home/<app>/var:<path>` under `volumes:` in the stack file, and deploy it. If the app runs as another user, make sure that it owns the copied files, for example with `docker exec <container> chown -R <user> <path>`.
