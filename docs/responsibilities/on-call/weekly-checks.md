# Weekly ITAR Checks

On Sunday, the last day of the on-call rotation, you are expected to perform some basic checks to ensure everything within the ITAR setup is working as it should.


## Prerequisites

On Monday, the first day of your on-call week, you will need to reach out to the following individuals:

- **John Panfile:** John.Panfile@ironmountain.com
- **Scott Garner:** Scott.Garner@ironmountain.com
- **Mark Guth:** Mark.Guth@ironmountain.com
- **Randy Sutton:** Randal.Sutton@ironmountain.com

You can send them all an e-mail or a chat, whatever you would like, but you need to coordinate with one of them to provide you with the results of the USDA healthchecks on Sunday. The main result is whether or not the Bitlocker credentials were entered. These are, currently, the only four folks that are cleared for the USDA project. Work with them to perform the checks and let you know the result some time on Sunday, so that you can include it in your weekly checks e-mail report.


## FISMA

1. Login to the jump Server.
2. Login to one of the Production Web Servers:
    1. `USNUSGMKX11WP02` - It is located in the `FISMA` folder of the mRemoteNG connections.
3. Open up Kofax Admin and check that all of the remote sites sync date is today.
    1. Click on the `Start Menu`.
    2. Click on/expand the `Kofax Capture 11.0` folder.
    3. Click on `Administration`.
![Weekly-Checks-1](../../overrides/assets/images/weekly-checks-1.png#centered)
    4. Click `Yes` on the pop-up about the application making changes.
![Weekly-Checks-2](../../overrides/assets/images/weekly-checks-2.png#centered)
    5. If you see a pop-up stating `Custom module setup is not complete` click `Cancel`.
![Weekly-Checks-7](../../overrides/assets/images/weekly-checks-7.png#centered)
    6. Click on the `Tools` tab.
    7. Click on the button that says `Remote`. Make sure you're clicking the top button, with the two little buildings, and not the bottom one with the arrow.
![Weekly-Checks-3](../../overrides/assets/images/weekly-checks-3.png#centered)
    8. Validate that the `Last Connected` date and time is within the last 30-60 minutes.
![Weekly-Checks-4](../../overrides/assets/images/weekly-checks-4.png#centered)
4. Run the following Powershell check scripts on the Desktop:
    1. `ITAR Services Check`
    2. `Server Up Checks`
        1. This checks the Commercial ITAR Servers as well.
5. If there is a failure on the first run of the scripts, give it a few minutes and try it again.
6. Verify that the Linux IDP Servers are up and that all Docker Containers are running:
    1. Login to the main Linux IDP Server:
        1. `is10100` - It is located in the `JumpHost`, then `IRS - Putty` folder of the mRemoteNG connections.
    2. Run the following command to check the Docker Containers:
        1. `cd .ssh; pssh -i -h hosts_file.txt "docker ps"`
    3. Verify that the Docker Containers are running on all of the Servers. Here is the output from one of the 32 Servers:
![Weekly-Checks-8](../../overrides/assets/images/weekly-checks-8.png#centered)
7. Verify that the `CTERA` Share is up and accessible.
    1. Login to a handful of the AP Servers and make sure you can browse around the `C:\CTERA` share.
        1. `USROYMKX11AP11`
        2. `USROYMKX11AP18`
        3. `USROYMKX11AP25`
8. Verify that the [FISMA URL](https://dcdfisma.ironmountain.com/acis/) is up and accessible.


## IMGS // GovCent

1. Login to the Production Jump Server:
    1. `USNUSJMPAPPGP01`
2. Login to the corresponding Server:
    1. `USNUSIKX11WP02` - It is located in the `Central`, then `Prod` folder of the mRemoteNG connections.
3. Open up Kofax Admin and check that all of the remote sites sync date is today.
    1. Click on the `Start Menu`.
    2. Click on/expand the `Kofax Capture 11.0` folder.
    3. Click on `Administration`.
![Weekly-Checks-1](../../overrides/assets/images/weekly-checks-1.png#centered)
    4. Click `Yes` on the pop-up about the application making changes.
![Weekly-Checks-2](../../overrides/assets/images/weekly-checks-2.png#centered)
    5. If you see a pop-up stating `Custom module setup is not complete` click `Cancel`.
![Weekly-Checks-7](../../overrides/assets/images/weekly-checks-7.png#centered)
    6. Click on the `Tools` tab.
    7. Click on the button that says `Remote`. Make sure you're clicking the top button, with the two little buildings, and not the bottom one with the arrow.
![Weekly-Checks-3](../../overrides/assets/images/weekly-checks-3.png#centered)
    8. Validate that the `Last Connected` date and time is within the last 30-60 minutes.
![Weekly-Checks-5](../../overrides/assets/images/weekly-checks-5.png#centered)
4. Run the following Powershell check scripts on the Desktop:
    1. `ITAR Services Check`
    2. `Server Up Checks`
5. If there is a failure on the first run of the scripts, give it a few minutes and try it again.
6. Login to the Production License Server:
    1. `USNUSIKX11AP01`
7. Verify that the [IMGS URL](https://usimgskx11web.imtn.gov/ACIS/) is up and accessible.


## Commercial ITAR

1. Login to the jump Server.
2. Login to the corresponding Server:
    1. `USNUSMKXG11P30` - It is located in the `Daily` folder of the mRemoteNG connections.
3. Open up Kofax Admin and check that all of the remote sites sync date is today.
    1. Click on the `Start Menu`.
    2. Click on/expand the `Kofax Capture 11.0` folder.
    3. Click on `Administration`.
![Weekly-Checks-1](../../overrides/assets/images/weekly-checks-1.png#centered)
    4. Click `Yes` on the pop-up about the application making changes.
![Weekly-Checks-2](../../overrides/assets/images/weekly-checks-2.png#centered)
    5. If you see a pop-up stating `Custom module setup is not complete` click `Cancel`.
![Weekly-Checks-7](../../overrides/assets/images/weekly-checks-7.png#centered)
    6. Click on the `Tools` tab.
    7. Click on the button that says `Remote`. Make sure you're clicking the top button, with the two little buildings, and not the bottom one with the arrow.
![Weekly-Checks-3](../../overrides/assets/images/weekly-checks-3.png#centered)
    8. Validate that the `Last Connected` date and time is within the last 30-60 minutes.
![Weekly-Checks-6](../../overrides/assets/images/weekly-checks-6.png#centered)
4. Confirm the results of the USDA healthchecks, outlined [above](https://na-dms-itar-eit-mkdocs-2156f1.gitlab.io/responsibilities/on-call/checks/#prerequisites) so you can complete your report.


## Results

Once you have completed all of the checks, you will need to send out an e-mail with the following format to `#NA DMS ITAR Support`:

``` text
1. FISMA
    A. All applicable services have been restarted and verified as listed below:
        i. KYVR – Kofax
        ii. GDIT – OPEX, IBML, and Kofax
        iii. DLA – Kofax
        iv. IRS – IBML and Kofax
        v. SCDOR – IBML,IMShort, GS, and Kofax
        vi. ROPA - Kofax
        vii. FISMA – Kofax, IMShort, and IIS
    B. Verified all site licenses are up to date.
    C. Verified all servers are up.
    D. Verified CTERA shares are up and accessible.
2. IMGS
    A. All applicable services have been restarted and verified as listed below:
        i. MEAZ – Kofax
        ii. IMGS – Kofax, IMShort, and IIS
        iii. ROPA - VHA and DLA - Kofax
        iv. FRVA - Kofax 
    B. Verified all site licenses are up to date.
    C. Verified all servers are up.
3. Commercial ITAR
    A. Verified all site licenses are up to date.
    B. Verified all servers are up.
    C. Verified USDA Bitlocker Credentials were entered.
4. Verified FISMA URL is up and accessible:
    a. https://dcdfisma.ironmountain.com/acis/
5. Verified IMGS URL is up and accessible:
    a. https://usimgskx11web.imtn.gov/ACIS/
```