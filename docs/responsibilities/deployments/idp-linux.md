# IDP Linux Server Deployments

This is a reference guide for IDP deployments for the IRS project. Every deployment is different so you will need assistance from Princess Palmer/team for specifics, but this will get you through the set-up.


## Support Information

You will need to reach out to `Princess Palmer` to request access to the IDP Linux Servers.

For Hardware/Linux support: `Rob Rehault`

For IDP configuration support: `Mohan Chandra Kambara`


### Links to Resources

[IRS Production Docker Container Distribution Spreadsheet](https://docs.google.com/spreadsheets/d/1dyUoacxuGop63JP3l7g-dkGfpiFucLwF4Ac35w6cN6g/edit?gid=0#gid=0)

[IRS Linux Knowledge Transfer Recording](https://drive.google.com/file/d/1HV6Ybc5N5cN__yl9c7Vr_SW6nYrWA0Ue/view?usp=drive_web)

[IRS IDP Docker Container Discussion Recording](https://drive.google.com/file/d/1AC9qqt3AH8p8Stigxx8xiisnN4gQ4D8G/view?ts=6489fd53)


<!-- This is for the actual Linux Team Members so I am hiding it here:
1. Login to the jump server: `USNUSMJHP01`
2. Open MobaXterm or mRemote and specify your session as SSH/SSH1.
3. Login to all the servers using your standard IRM username and password (IS10100-IS10131) Note: IS10102 is the load balancer and does not receive IDP updates. No need to login to it.
4. Login to the service accounts using the following commands and your standard IRM password:
    1. For servers IS10103 and IS10104: `sudo /usr/bin/su - svc_mltrainer`
    2. For all other servers: `sudo /usr/bin/su - mlinference`
5. A standard deployment is moving and unzipping files, then running a pre-made shell script, but every deployment varies.
-->

## Common Commands & Tips

Here are some basic, commonly used Linux CLI commands, what they do, and how to use them.

!!! example "Linux Tech Tip"

    When typing out a file name, you only need to type a couple of the first letters and then press tab to autofill the rest of the name. ex. If i want to look at the deploy Containers script I would type cat de then tab and it will outfill the rest of the name then just add the extension that differentiates it in the folder (.sh).


### Linux Commands

=== "cd"

    ``` text
        Change directory for folder traversal.
            - Move into the /IRS directory: cd /IRS
    ```

=== "ls"

    ``` text
        List contents of the directory you’re in
    ```

=== "cp"

    ``` text
        Creating a copy of a file or folder
            - Copy a file: cp file1 file2
            - Copy a folder: cp -R folder1 folder2
    ```

=== "mv"

    ``` text
        Moving a file or folder from one location to another.
        It is also used for renaming a file/folder when you do not need a copy of the old one.
            - Move a file into a folder: mv filename newfolderpath
            - Move (rename) a file: mv filename newfilename
    ```

=== "rm"

    ``` text
        Deleting files and folders.
            - Deleting a file: rm filename
            - Deleting a folder and its contents: rm -r foldername
        You can use the -f option to force and not be prompted to confirm the deletion.
            - Deleting a file: rm -f file
            - Deleting a folder: rm -rf folder
    ```

=== "sh"

    ``` text
        Run a shell script.
            - sh scriptname.sh
    ```

=== "cat"

    ``` text
        Concatinate (view) the contents of a file:
            - cat filename
    ```

=== "vi/vim"

    ``` text
        File editors. Can be used to create or edit files.
            - Create/edit a file: vi file
            - Create/edit a file: vim file
    	While viewing the contents press "i" to edit.
	    To exit the edit interface press the "esc" key then type ":wq" and then press Enter.
    ```


### Extract/unzip Options

For most deployments you will need to extract `.tar.bz2` files. Both the `.bz2` and then the corresponding `.tar` files need to be extracted.

=== "tar -ixjv *.tar.bz2"

    ``` text
        Extracts all .tar.bz2 files within a directory.
        (Note: this command extracts both the .bz2 and the .tar)
    ```

=== "bzip2 -dk"

    ``` text
        Extracts a single .bz2 file.
            - bzip2 -dk filename.tar.bz2
    ```

=== "bzip2 -dk *.bzip2"

    ``` text
        Extracts all .bz2 files in your current directory.
    ```

=== "tar -xf"

    ``` text
        Extracts a single .tar file.
            - tar -xf filename.tar
    ```


### Docker Commands

=== "docker images"

    ``` text
        Shows currently deployed images.
    ```

=== "docker compose logs"

    ``` text
        Shows general logs for Docker Compose services.
    ```

=== "docker ps"

    ``` text
        Shows running Containers(services) and their statuses.
    ```

=== "docker load --input"

    ``` text
        Loads a new image for the specified service.
            - docker load --input servicename
    ```

=== "docker compose down"

    ``` text
        Brings the Docker Compose Containers offline so that they can be updated.
    ```

=== "docker compose up"

    ``` text
        You usually won't use this command as it is in the deploy
        shell script that you will run at the end of the deployment.
    ```

=== "docker system prune --all"

    ``` text
        Warning: Removes all offline Containers!
        Do not run unless you have double-checked everything you need is running.
    ```

=== "docker compose up -d msft-OCR"

    ``` text
        Starts the OCR service on the specific server you are logged into.
    ```

!!! note

    Each server runs a different combination of services. To view the services that need to be running on that server move (cd) into the var/containers directory and then cat the deployContainers.sh file.

    If a container restart is requested for the servers you will need to log in to every server, cd into the var/containers directory and then run sh deployContainers.sh


## Requirements

Before getting started with the IDP deplyments you will need to make sure certain access and configurations have been setup.


### Linux Server Access

You will need to submit a Standard SNOW requests for access to the IDP LInux Servers, for the typical `sudo` access to be able to assist with deployments, and access to the `docker` command.

Once you have submitted a request for access and it has been completed, you need to make sure you have full root access on `is10100`. To verify this you will need to login to the Server and then run the following command:

```shell
    sudo su
```

You will then be prompted to enter your standard IRM password. If it doesn’t work, you’ll get a message stating that you don’t have the required permissions. Please refer to the previous notes on who to reach out to get that corrected.


### SSH Key Setup

We can take advantage of an SSH Key in order to remotely execute commands from one Server to all of the others, making it easier by preventing the need for you to login to each Server one at a time. You will need to perform the following steps to create your SSH Key and then copy it to each of the IDP Linux Servers:

1. Login to `is10100`.
2. Type `ssh-keygen` and press `Enter`.
    1. When prompted for the directory, just press `Enter` to use the default.
    2. When prompted to enter a paraphrase, just leave it blank and press `Enter`, then `Enter` again to confirm.
3. Move into the `.ssh` directory:
    1. `cd .ssh`
4. 
    1. To copy your newly created SSH Key to all of the Servers, you can run the following command:
        1. Replase `YourUserName` with the same Username you used to login to the Server and then press `Enter`:
            1. `USERNAME=YourUserName; for SERVER in $(seq 100 131); do ssh-copy-id -i ~/.ssh/id_rsa.pub "${USERNAME}"@is10"${SERVER}".ironmountain.com; done`
    2. Type `yes` for fingerprint.
    3. Type/paste your password and press `Enter`.
    4. Repeat `b` and `c` until complete.


### Docker Multi-Server Commands

Once you have your SSH Key setup, you can take advantage of a command called `pssh` (Parallel SSH) which allows you to run the same command on multiple Servers simultaneously, saving you time as you won't need to login to each Server one at a time.

!!! info

    To run these commands you have to log into the is10100 Server and then cd into the .ssh directory first.

All of these commands depend upon the `hosts_file.txt` which contains a list of all of the IDP Linux Servers.

```shell title="Generic Parallel SSH Command"
    pssh -i -h hosts_file.txt "<COMMAND_TO_RUN>" # (1)!
```

1. Replace `<COMMAND_TO_RUN>` with the actual comand you are trying to run, IE: `ls -la` or `docker ps -a`, etc.

```shell title="Creates and starts the msft-OCR Container"
    pssh -i -h hosts_file.txt "cd /IRS; docker compose up -d msft-OCR" # (1)!
```

1. You can replace the `msft-OCR` Container name with any other Container name.

```shell title="Shows all running Docker Containers"
    pssh -i -h hosts_file.txt "docker ps"
```


### Advanced Docker Multi Server Commands

!!! info

    To run these commands you have to log into the is10100 Server and then cd into the .ssh directory first.

```shell title="Cleaner Docker PS command w/ better output"
    pssh -i -h hosts_file.txt "docker ps --format '{{.Names}}\t{{.Status}}'"
```

```shell title="Docker PS command w/ just Name and Status"
    pssh -i -h hosts_file.txt "docker ps --filter "name=msft-OCR" --format '{{.Names}}\t{{.Status}}'"
                                                        # (1)!      
```

1. Replace the container name, `msft-OCR`, with the name of any other Docker container to see its details.


## Performing Deployments

More often than not, we will not be the ones performing these steps and it will be someone from the Linux Team, IE: Princess. We are usually the ones who perform the Windows side of the deployment.

### Preparation

Each deployment is different, but for the majority of them you need to prep(unzip) the following files in the /IRS share:

!!! info

    You will need root access to perform most of these commands. We only have root access on is10100. To get root access, right after login to your base account run `sudo su` and then type your same password when prompted.

To get to the /IRS share cd /IRS

Enter the commands under the screenshots to prep that folder. You only need to run the commands if you see the following folders in red present in the /IRS directory. These can all be done during production before the deployment. However, if the deployment is cancelled you must revert to the backups you create here before the scheduled service reboot at 3am


yolo_checkbox.tar.bz2
![IDP-Linux-1](../../overrides/assets/images/idp-linux-1.png#center)
1. rm -rf yolo_checkbox_backup
2. mv yolo_checkbox yolo_checkbox_backup
3. tar -xf yolo_checkbox.tar.bz2

You should end up with the same thing you started with as seen in the screenshot above. You can verify the age of the files by running ls -lrt

entity_ext-latest_06092025.tar.bz2
![IDP-Linux-2](../../overrides/assets/images/idp-linux-2.png#center)
This will have the day of the deployment in the name if it is meant to be deployed. 

From the /IRS directory:

1. mv entity_ext-latest_06092025.tar.bz2 ransac
2. cd ransac
3. ls  to ensure it is present in the ransac directory
There are a few extra steps to this one. The entity_ext_latest_XXXXX.tar.bz2 file contains a new build-info.txt and a new entity_ext. Before extracting the new tar.bz2 file we need to make new backups of the current ones.
4. rm -f build-info_backup.txt
5. mv build-info.txt build-info_backup.txt
6. rm -rf entity_ext_backup
7. mv entity_ext entity_ext_backup
8. ls to confirm that there is no entity_ext or build-info.txt present (only the backups)
9. tar -xf entity_ext_latest_XXXXXXXX.tar.bz2
10. ls to ensure you see a new entity_ext and build-info.txt as well as the backups of each

If there are no new services being deployed you still need to check both deploy containers scripts and ensure that all docker load commands are commented out with a # see below for more information on those scripts.

If there are any other files in the /IRS directory that end with the extension .tar.bz2. They likely are new services that are being deployed. Princess will tell you if and what services are being deployed. There are two steps for each one of these, but you only extract these down to the .tar

ralexand1-rules_engine.tar.bz2
![IDP-Linux-2](../../overrides/assets/images/idp-linux-2.png#center)
1. bzip2 -dk ralexand1-rules_engine.tar.bz2
2. Then you must update the deployContainers scripts (deployContainers.sh and deployContainers_104.sh
3. To edit a script vi deployContainers.sh
4. Then i.

these contain a number of docker load commands that are all commented out. You need to uncomment the docker load command as well as the echo command below it for each service that is being deployed that day **in both scripts**
![IDP-Linux-3](../../overrides/assets/images/idp-linux-3.png#center)
5. To exit the file and save, hit esc then type :wq 


### Deployment

For deployment using this setup you will need to be in the .ssh directory. There are 3 files there that are relevant to the deployment (hosts_deploy1_file.txt  hosts_deploy2_file.txt  hosts_logs_file.txt). Deploy1 contains 3 servers that have different services running than the rest of the servers. Deploy2 contains the rest. The logs file contains a few servers picked out to check the logs of when testing a new deployment. The SSH procedure is as follows:
This portion is for testing the new deployment on a single server before pushing it to the remaining ones.

1. Login to is10100 as your profile then  sudo /usr/bin/su - mlinference using your corp password
2. cd /IRS
3. sh deployContainers.sh
4. docker ps (check services rebooted)
5. docker images (check the newest images were deployed)
6. docker compose logs -f (running logs during batch processing)

After verifying testing is successful you can proceed to deploying to the rest

1. exit (goes back to user profile)
2. cd ~ (goes to home directory)
3. cd .ssh
4. (deploys for the first set of servers) pssh -i -h hosts_deploy1_file.txt -t 0 "cd /IRS; sh deployContainers.sh"
5. (deploys for the second set of servers) pssh -i -h hosts_deploy2_file.txt -t 0 "cd /IRS; sh deployContainers_104.sh"
6. (runs logs on a few servers to verify deployment) pssh -i -h hosts_logs_file.txt -t 0 "cd /IRS; docker compose logs -f"
