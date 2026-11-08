---
title: Prerequisites
description: The tools, the versions, and a private Forgejo repository for the Docker update setup.
---

# Prerequisites

This part makes sure that each server has the tools, and it creates the Git repository that will describe your stacks.

## What you need

- One or more servers with Docker Engine and the Docker Compose plugin (`docker compose`, version 2 or later).
- A root shell on each server.
- A Forgejo instance that you can reach from every server, with Forgejo Actions turned on.
- A Forgejo runner with the label `docker` that can run job containers, for example the runner image with a Docker-in-Docker service next to it. The [Renovate](renovate.md) part uses it.
- A reverse proxy with HTTPS in front of Forgejo. The example uses SWAG.
- A host name for Komodo, `<komodo-host>`, if a second server or Forgejo must reach Komodo from outside your LAN (see [Adapt to your layout](index.md#adapt-to-your-layout)). It needs a public DNS record that points to `<server-a-public-ip>`, and a certificate that covers the name. Your router must also forward port 443 to the proxy on `server-a`. With SWAG, add the name to `SUBDOMAINS` or use a wildcard certificate.
- A Docker Hub account with a read-only access token (permission `Public Repo Read-only`). Komodo and the hosts use it, because Docker Hub limits anonymous pulls.
- A computer with Git and an SSH key that Forgejo knows. The guide calls it your PC. To test changes to the Renovate rules on the PC, Node.js with `npx` is also useful.

I built and tested this setup with these versions. Newer versions are likely to work, but read the release notes of each one.

| Software | Version |
| --- | --- |
| Docker Engine | 29.9 |
| Docker Compose | 5.7 |
| Komodo | 2.3.4 |
| Forgejo | 17.0 |
| Forgejo runner | 13.2 |
| Renovate | 44.221 |
| Python on the servers | 3.9 or later |

## The tools on each server

Do these steps on each server.

1. Show the Git version:

    ```bash
    git --version
    ```

2. Show the Python version. It must be 3.9 or later:

    ```bash
    python3 --version
    ```

3. If either command fails, install the missing package before you continue.

## Create the repository

Do these steps in Forgejo, signed in as `<your-user>`.

1. Create a new repository with the name `<your-repo>`.
2. Set the repository to private. It will hold your compose files, and those show your whole homelab.
3. Set the default branch to `main`.
4. Leave the repository empty. Do not add a README, a license or a `.gitignore`.

## Fill the repository on your PC

When the guide is done, the repository has this layout. The [Scripts](scripts.md) page holds every file to copy.

```text
<your-repo>/
├── .gitignore
├── renovate.json
├── .forgejo/workflows/renovate.yml
├── komodo/
│   ├── docker-compose.yml                    # Komodo Core, Mongo and Periphery on server-a
│   ├── compose.env.example
│   ├── periphery-server-b/docker-compose.yml # Periphery on server-b
│   └── swag/komodo.subdomain.conf
├── server-a/                                 # one folder per stack, written later
├── server-b/
└── tools/
    ├── split_stacks.py
    ├── check_images.py
    ├── collect_state.sh
    ├── find_literals.sh
    ├── inspect-server.sh
    ├── scan_repo_secrets.py
    ├── pins/server-a.json                    # the exact image of each service
    └── stacks/server-a.json                  # the stack map of each server
```

You write the pins in [Back up and record](backup.md) and the stack maps in [Move the stacks](move-stacks.md), both in the server's clone. You commit them from there. The folders `server-a/` and `server-b/` stay empty until you move the stacks.

1. Make a folder on your PC. Copy into it the files from the [Scripts](scripts.md) page: the six scripts in `tools/`, `.gitignore`, and the Komodo files.
2. Replace the placeholders in the Komodo files with your values: `<komodo-host>`, `<lan-subnet>`, `<server-a-lan-ip>` and `<server-b-public-ip>`. Also set `TZ` to your time zone. Commit no placeholder.
3. Start a local repository on the branch `main`:

    ```bash
    git init -b main
    ```

4. Make sure that your SSH key works with Forgejo. The reply must name `<your-user>`:

    ```bash
    ssh -T git@<forgejo-host>
    ```

    If Forgejo listens for SSH on another port or host name, use those, as your Forgejo shows them in the clone address.

5. Connect the local repository to Forgejo:

    ```bash
    git remote add origin git@<forgejo-host>:<your-user>/<your-repo>.git
    ```

6. Make the first commit, then push it:

    ```bash
    git add -A
    git commit -m "Add the tools and the Komodo files"
    git push -u origin main
    ```

!!! tip "SSH, not HTTPS"
    On a Windows PC, an HTTPS remote can make Git Credential Manager open a browser for the sign-in, and that can hang. With HTTPS on a server, Git asks for your user name and a token on every pull. An SSH remote avoids both.

## Give each server a deploy key

A deploy key is an SSH key that belongs to one repository, not to a user. Each server gets its own, so that it can pull without a password, and you can remove one server's access without touching the others.

Do these steps on each server. The examples use `server-a`.

1. Make the key. It has no passphrase, so that a pull needs no prompt. Only root can read it:

    ```bash
    ssh-keygen -t ed25519 -f /root/.ssh/forgejo_deploy -N "" -C "deploy-server-a"
    ```

2. Show the public key, and copy it. Only the `.pub` file is safe to show:

    ```bash
    cat /root/.ssh/forgejo_deploy.pub
    ```

3. In Forgejo, open `<your-user>/<your-repo>`, then Settings, then Deploy keys, and click Add deploy key. Use the title `server-a`, paste the key, and turn on "Enable write access". The servers commit the stack files during the move.
4. Tell SSH to use this key for Forgejo. If your Forgejo uses another port for SSH, add a line `  Port <port>`:

    ```bash
    printf 'Host <forgejo-host>\n  User git\n  IdentityFile /root/.ssh/forgejo_deploy\n  IdentitiesOnly yes\n' >> /root/.ssh/config && chmod 600 /root/.ssh/config
    ```

5. Connect once:

    ```bash
    ssh -T git@<forgejo-host>
    ```

    SSH shows the fingerprint of the host key and asks you to accept it. Before you answer `yes`, compare it with the real one. On the host that runs Forgejo's SSH, `ssh-keygen -lf` with the public host key file shows it. If they do not match, answer `no` and find out why. The reply must then say that you authenticated.

!!! tip "Read-only after the move"
    When every stack runs from Komodo, the servers only pull. Then delete each deploy key and add it again without write access. A read-only key cannot change the repository, even if a server is broken into.

## Clone the repository on the servers

Do these steps on each server, after the first push.

1. Clone the repository over SSH:

    ```bash
    git clone git@<forgejo-host>:<your-user>/<your-repo>.git /root/<your-repo>
    ```

2. Give the clone a Git identity, so that commits from the server work and show which server made them:

    ```bash
    git -C /root/<your-repo> config user.name "server-a" && git -C /root/<your-repo> config user.email "server-a@<your-domain>"
    ```

3. Make sure that the scripts run:

    ```bash
    cd /root/<your-repo> && python3 -I tools/split_stacks.py --help
    ```

    The output starts with `usage: split_stacks.py`.

The guide calls this clone "the server's clone". Pull it before each command that reads the repository. `check_images.py` compares with this clone, so a clone that is behind shows every merged update as `DIFFERENT`.
