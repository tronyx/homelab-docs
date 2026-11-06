---
title: Daily use
description: Merge an update, make sure that it deployed, find a forgotten Deploy with check_images.py, and roll back with a revert.
---

# Daily use

Each day, Renovate opens pull requests for new images, up to 10 at a time. You review them, merge the ones you want, and Komodo deploys the normal stacks. This page describes that loop, how to make sure that a merge deployed, and how to roll back.

## Merge an update

1. In Forgejo, open a pull request from the bot, and review it as the [Renovate](renovate.md#review-a-pull-request) part describes.
2. If you want proof of the result, record the state on the server of the stack before you merge:

    ```bash
    cd /root/<your-repo> && git pull && bash tools/collect_state.sh > work/before-merge.txt
    ```

3. Merge the pull request with Create merge commit, the default of Forgejo. The rollback below expects a merge commit.
4. For a normal stack, wait for the new run of the Procedure of its server. The stack of the pull request takes a few seconds in the log, and the other stacks less than a second.
5. For a critical stack, nothing deploys. When you are ready, click Deploy on the Stack in Komodo. In the Compose Up stage, the changed service shows `Recreated`, and the others show `Running`. Then do the steps in "Find an update that did not deploy" below.

    <!-- screenshot: komodo-deploy-log.png -->

6. Record the state again, and compare the configured image (field 2), the image ID (field 3) and the start time (field 8):

    ```bash
    bash tools/collect_state.sh > work/after-merge.txt && for f in 2 3 8; do diff <(cut -d'|' -f1,$f work/before-merge.txt) <(cut -d'|' -f1,$f work/after-merge.txt); echo "field $f done"; done
    ```

    Only the containers of the changed service can appear. Field 2 shows the new digest from the pull request.

7. Open the application and make sure that it works.

## Find an update that did not deploy

A merge for a critical stack deploys nothing until you click Deploy. If you forget the click, the server keeps running the older image, and nothing tells you. `tools/check_images.py` finds that. It compares the image of each container on a server with the image in the stack files of that server and in its `komodo_files`. It only reads.

1. Run it on the server, in its clone. Run it after each merge for a critical stack, and at any other time on any server:

    ```bash
    cd /root/<your-repo> && git pull && python3 -I tools/check_images.py server-a
    ```

2. Read the output. If all containers run the image from the repo, it shows one line with two equal numbers, for example `12 of 12 containers run the image from the repo`, and its exit code is 0.
3. If a line starts with `DIFFERENT`, click Deploy on that Stack. The two lines below it show the image in the repo and the image that runs.
4. If a line starts with `MISSING` or `NOT RUNNING`, open the Stack in Komodo and read the log of the container.
5. If a line starts with `NOT IN ANY FILE`, a container exists that no file describes. Find out who started it, and add it to a stack file or remove it.

## Roll back an update

A revert of the merge on `main` is the rollback. The webhook then deploys the old image again. A merge commit has two parents, so the revert needs `-m 1`, which keeps the side of `main` from before the merge. If you merged with squash or rebase instead, revert that one commit without `-m 1`.

Do these steps on your PC, in your clone of the repository.

1. Get the latest commits, and find the merge commit of the pull request. Its message starts with `Merge pull request` and contains the number of the pull request, such as `(#12)`:

    ```bash
    git pull && git log --oneline -10
    ```

2. Revert that merge. Replace `<commit>` with its short hash. Git opens an editor for the message:

    ```bash
    git revert -m 1 <commit>
    ```

3. Push:

    ```bash
    git push
    ```

4. For a normal stack, the Procedure deploys the old image. For a critical stack, click Deploy on the Stack.
5. Do step 6 of "Merge an update" again. Field 2 must show the old digest.

On its next run, Renovate opens the same update again, because `main` has the old digest. Leave that pull request open until a newer image fixes the problem, or close it.

!!! warning "Do not revert after a database migration"
    Do not revert an update of an application whose database changed when the new version started. The old version can fail to start with the changed database. Read the log of the new version for a migration before you revert. If a migration ran, restore the database from a backup instead, or wait for a fixed version.

## Keep it healthy

- After a reboot or a Docker update, follow [Reboots and Docker updates](critical-stacks.md#reboots-and-docker-updates).
- A database major upgrade is never a Renovate merge. Plan it: dump the database with `pg_dumpall` or `mariadb-dump`, restore the dump into a temporary container on a new data folder, compare the table and row counts of both, and only then change the stack file to the new image and folder. Keep the old folder as the rollback.
- A new major version of Forgejo is a Renovate pull request for a critical stack. Read the breaking changes in its release notes first. Then, before the Deploy: run `forgejo manager flush-queues` as the user `git` in the container, stop `forgejo` (not its database), dump the database and copy the data folder, and start `forgejo` again, because the Deploy pulls from it. Click Deploy: Forgejo runs its database migrations at the first start. Run `forgejo doctor check --all` as the user `git`. After the migrations, an older Forgejo does not start on that database, so the way back is a restore of both backups, not a revert.
- Look at the Dependency Dashboard from time to time. It lists the pending updates and any image that Renovate failed to look up. Updates that a rule turns off, such as database majors, do not appear there, so watch the release notes of your databases yourself.
