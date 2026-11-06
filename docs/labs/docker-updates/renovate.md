---
title: Renovate
description: Run Renovate daily in Forgejo Actions, with one pull request per stack, digests on every image, and safe rules for databases.
---

# Renovate

Renovate is a bot that looks for newer images and opens a pull request for each change. Here it runs every day in Forgejo Actions, from the workflow `.forgejo/workflows/renovate.yml`, with its rules in `renovate.json`. Nothing merges by itself. You review and merge each pull request.

## The parts

| Part | What to set up |
| --- | --- |
| Bot account | A Forgejo user such as `renovate-bot`, added to `<your-user>/<your-repo>` as a collaborator with Write access. |
| Token | A token of the bot account with these scopes: `repository` read and write, `user` read, `issue` read and write, `organization` read. Store it in the repository as the Actions secret `RENOVATE_TOKEN`. |
| GitHub token (optional) | A classic GitHub token of `<github-user>` with only the `read:packages` scope, stored as the Actions secret `RENOVATE_GITHUB_COM_TOKEN`. Renovate uses it for release notes from github.com and to log in to `ghcr.io`, which limits anonymous requests. When it expires, create a new one and replace the secret. |
| Runner | A Forgejo runner with the label `docker` that can run job containers. |
| Image | `ghcr.io/renovatebot/renovate` with an exact version and digest. Renovate updates this line itself. |
| Label | A label named `deploy-by-hand` in `<your-user>/<your-repo>`, under Issues, then Labels. Create it before the first run, in a color that stands out. Renovate puts it on every pull request that the merge does not deploy. |

!!! note "Runner types"
    A runner of type Repository takes jobs from one repository only. If a job waits with `Waiting for a runner with the following label: docker`, open Site Administration, then Actions, then Runners, and make sure that a runner of type Individual or Global shows `Idle`.

## The workflow

Save this file as `.forgejo/workflows/renovate.yml`. It runs every day at 06:00 UTC, and it can also run by hand, as a dry run by default.

??? example ".forgejo/workflows/renovate.yml"

    ```yaml
    name: Renovate

    on:
      schedule:
        # Every day at 06:00 UTC.
        - cron: "0 6 * * *"
      workflow_dispatch:
        inputs:
          dry_run:
            description: "Dry run: show what Renovate would change, and open no pull request"
            type: boolean
            default: true

    jobs:
      renovate:
        runs-on: docker
        container:
          image: ghcr.io/renovatebot/renovate:44.221.5@sha256:ff73c6043e78a4fa0d32378bc2093e65fceb082a040d10db20add14ebe1c650a
        timeout-minutes: 30
        env:
          RENOVATE_PLATFORM: forgejo
          RENOVATE_ENDPOINT: https://<forgejo-host>/api/v1/
          RENOVATE_REPOSITORIES: <your-user>/<your-repo>
          RENOVATE_TOKEN: ${{ secrets.RENOVATE_TOKEN }}
          # A classic GitHub token with only read:packages: release notes from
          # github.com, and a login for the images on ghcr.io.
          RENOVATE_GITHUB_COM_TOKEN: ${{ secrets.RENOVATE_GITHUB_COM_TOKEN }}
          RENOVATE_HOST_RULES: '[{"hostType": "docker", "matchHost": "ghcr.io", "username": "<github-user>", "password": "${{ secrets.RENOVATE_GITHUB_COM_TOKEN }}"}]'
          RENOVATE_ONBOARDING: "false"
          RENOVATE_REQUIRE_CONFIG: required
        steps:
          - name: Run Renovate
            run: |
              if [ "${{ inputs.dry_run }}" = "true" ]; then
                export RENOVATE_DRY_RUN=full
                export LOG_LEVEL=debug
              fi
              renovate
    ```

Without the optional GitHub token, remove the lines `RENOVATE_GITHUB_COM_TOKEN` and `RENOVATE_HOST_RULES`.

## The rules

Save this file as `renovate.json` in the root of the repository. If your critical stacks have other folders, change the paths in the rule with `prBodyNotes` for critical stacks, the second rule from the end.

??? example "renovate.json"

    ```json
    {
      "$schema": "https://docs.renovatebot.com/renovate-schema.json",
      "extends": ["config:recommended", "docker:pinDigests"],
      "automerge": false,
      "assignees": ["<your-user>"],
      "prHourlyLimit": 0,
      "prConcurrentLimit": 10,
      "ignorePaths": ["tools/**"],
      "additionalBranchPrefix": "{{packageFileDir}}/",
      "commitMessageSuffix": "in {{packageFileDir}}",
      "packageRules": [
        {
          "description": "No major updates for databases. They need a planned upgrade.",
          "matchPackageNames": [
            "/^(docker\\.io/)?(library/)?postgres$/",
            "/^ghcr\\.io/immich-app/postgres$/",
            "/^(docker\\.io/)?(library/)?redis$/",
            "/^(docker\\.io/)?valkey/valkey$/",
            "/^(docker\\.io/)?(library/)?mariadb$/",
            "/^(docker\\.io/)?bitnami/mariadb$/",
            "/^(docker\\.io/)?timescale/timescaledb-ha$/",
            "/^(docker\\.io/)?(library/)?mongo$/"
          ],
          "matchUpdateTypes": ["major"],
          "enabled": false
        },
        {
          "description": "Keep patch updates of MariaDB and MongoDB apart from minor ones, so that the next rule does not hide them.",
          "matchPackageNames": [
            "/^(docker\\.io/)?(library/)?mariadb$/",
            "/^(docker\\.io/)?bitnami/mariadb$/",
            "/^(docker\\.io/)?(library/)?mongo$/"
          ],
          "separateMinorPatch": true
        },
        {
          "description": "For MariaDB and MongoDB, each x.y is a new release series, so a minor update is a database upgrade too.",
          "matchPackageNames": [
            "/^(docker\\.io/)?(library/)?mariadb$/",
            "/^(docker\\.io/)?bitnami/mariadb$/",
            "/^(docker\\.io/)?(library/)?mongo$/"
          ],
          "matchUpdateTypes": ["minor"],
          "enabled": false
        },
        {
          "description": "LinuxServer tags end in -lsNNN, the build number of the image.",
          "matchPackageNames": ["/^(docker\\.io/|ghcr\\.io/|lscr\\.io/)?linuxserver//"],
          "versioning": "regex:^v?(?<major>\\d+)\\.(?<minor>\\d+)\\.(?<patch>\\d+)-ls(?<build>\\d+)$"
        },
        {
          "description": "The Immich server and machine learning images must have the same version.",
          "matchPackageNames": ["ghcr.io/immich-app/immich-server", "ghcr.io/immich-app/immich-machine-learning"],
          "groupName": "immich"
        },
        {
          "description": "Core and both Periphery files must have the same version, so they share one pull request.",
          "matchPackageNames": ["ghcr.io/moghtech/komodo-core", "ghcr.io/moghtech/komodo-periphery"],
          "groupName": "komodo",
          "additionalBranchPrefix": "",
          "commitMessageSuffix": ""
        },
        {
          "matchFileNames": ["server-a/proxy/**", "server-b/proxy/**", "server-b/forgejo/**"],
          "addLabels": ["deploy-by-hand"],
          "prBodyNotes": [
            "This is a critical stack. The merge does not deploy it. After the merge, click Deploy on the Stack in Komodo."
          ]
        },
        {
          "matchFileNames": ["komodo/**"],
          "addLabels": ["deploy-by-hand"],
          "prBodyNotes": [
            "Komodo does not deploy this file. After the merge, apply it by hand."
          ]
        }
      ]
    }
    ```

What the rules do:

1. Every image keeps a version tag and a digest, and Renovate updates both.
2. Each pull request changes one stack folder. An image that is in several stacks gets one pull request for each stack, so that each merge deploys one stack.
3. Up to 10 pull requests are open at a time. Each daily run opens new ones until 10 are open.
4. Databases get no major updates, because those need a planned upgrade with a dump and a restore. MariaDB and Mongo also get no minor updates, because each x.y of those is a new release series. They still get patch and digest updates, which carry the security fixes.
5. The Immich server and machine learning images update together, and so do Komodo Core and both Periphery files.
6. LinuxServer tags such as `5.9.0-ls496` compare by version, then by the build number after `-ls`.
7. A pull request for a critical stack or for `komodo/` carries a note that the merge does not deploy it, and the label `deploy-by-hand`, which the list of pull requests shows.
8. Renovate assigns each new pull request to `<your-user>`, so Forgejo's filter "Assigned to you" lists every update. Renovate has no option to assign the Dependency Dashboard issue. Watch the repository to be told about it.

!!! tip "Database tags must name a series"
    Use a tag such as `postgres:18`, `redis:8-alpine` or `mariadb:11.4.13` for every database. A tag such as `latest` or `alpine` follows the newest major version, so a digest update of it can move a database to a new major version without a review.

To test a change to `renovate.json` before you push it, run the Renovate validator on your PC with the version of the workflow's image:

```bash
npx --yes --package renovate@44.221.5 -- renovate-config-validator --strict
```

## Run Renovate by hand

1. In Forgejo, open `<your-user>/<your-repo>`, then Actions, then the workflow `Renovate`, and click Run workflow on `main`.
2. Leave Dry run checked to see what Renovate would change. A dry run logs at debug level and creates no branch and no pull request. Read its log: it lists every file and image that Renovate found. Uncheck Dry run for a real run.

The first real run opens up to 10 pull requests and an issue named Dependency Dashboard, which lists all pending updates.


## Review a pull request

1. Read the title. `Update ... Docker digest to ...` means a new build of the same tag. `Update ... to v1.2.3` means a new version. Read the release notes of a new version before you merge.
2. Make sure that the pull request changes only the stack folder in its title.
3. The `0 / 1` in the list of pull requests is the checkbox that Renovate puts in each pull request. Tick it to make Renovate rebuild the branch on its next run. It is not a test result.
4. Merge the pull request in Forgejo.

<!-- screenshot: renovate-pull-request.png -->

What happens after the merge depends on the folder:

| Folder | After the merge |
| --- | --- |
| A stack in a Procedure | The webhook runs the Procedure, and Komodo deploys the stack. Compose recreates only the changed service. |
| A critical stack | Nothing deploys. Click Deploy on the Stack in Komodo when you are ready. |
| `komodo/` | Nothing deploys. Apply the file by hand, as below. |
| `.forgejo/workflows` | The next Renovate run uses the new image. |

!!! note "A pull request that you close by hand"
    Renovate treats a pull request that you close without a merge as ignored, and it does not open it again for that version. If an update was obsolete, Renovate closes the pull request by itself. If a pull request shows `branch already included` after a revert, tick its checkbox so that Renovate rebuilds the branch.

## Apply a komodo/ update by hand

Komodo does not deploy itself. After you merge a `komodo` pull request:

1. On `server-a`, start the new Core, Mongo and Periphery:

    ```bash
    cd /root/<your-repo> && git pull && docker compose -f komodo/docker-compose.yml --env-file /home/.env_files/.komodo.env up -d
    ```

2. Do steps 6 to 8 of [Start Komodo on server-a](komodo.md#start-komodo-on-server-a).
3. On `server-b`, start the new Periphery:

    ```bash
    cd /root/<your-repo> && git pull && docker compose -f komodo/periphery-server-b/docker-compose.yml up -d
    ```

4. In Komodo, both servers must show the status OK.
