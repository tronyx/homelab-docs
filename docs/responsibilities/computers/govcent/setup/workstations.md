# IMGS // GovCentral Workstations

If there is one thing we have a lot of, it is most certainly Workstations. Here is how you get one setup for the ROPA IRS site.

1. Grab a Workstation, possibly from the Warehouse, and make sure it is running the latest version of our image.
    1. If it is outdated, you can follow the [GovCentral Laptop // Workstation Re-Imaging](reimage.md) guide.
2. Login to the Workstation with the `eawilliam` account.
    1. Ask your Lead for the password if you do not have it.
3. There will be a window, `Select your Country`. Scroll down and select `United States of America (the)` and click `OK`.
![GC-Workstation-Setup-4](../../../../overrides/assets/images/gc-workstation-setup-4.png#centered)
4. A `Windows Powershell credential request` popup will appear. Type anything you want into the `User name` box and press `Enter` or click `OK`.
![GC-Workstation-Setup-5](../../../../overrides/assets/images/gc-workstation-setup-5.png#centered)
5. The machine will reboot. When it is back online login with the `eawilliam` account again.
6. If you are working on the Workstation in our office you can connect it to our Cisco switch or you can set it up at any one of the IRS Workstation desks and plug the network cable in. DHCP is just fine for these situations.
    1. If you need to, for whatever reason, work down in DLA where we used to setup Laptops and Workstations, you will need to obtain an IP from John A. for use with the Laptop. It is a provided "Build Network" and usually consists of IP addresses from within the following range:
        1. `10.126.224.150 - 10.126.224.185`
    2. Configure the previously obtained static IP:
        1. Right-click the Wi-Fi/Network icon.
        2. Click on `Network and Internet Settings`.
![GC-Laptop-Setup-1](../../../../overrides/assets/images/gc-laptop-setup-1.png#centered)
    4. Click on `Ethernet`.
![GC-Laptop-Setup-2](../../../../overrides/assets/images/gc-laptop-setup-2.png#centered)
    5. Click on the `Edit` button for `IP assignment`.
![GC-Laptop-Setup-3](../../../../overrides/assets/images/gc-laptop-setup-3.png#centered)
    6. Select `Manual` from the drop-down menu.
![GC-Laptop-Setup-4](../../../../overrides/assets/images/gc-laptop-setup-4.png#centered)
    7. Toggle `IPv4` on.
    8. Configure the IP settings as follows:
        1. IP address: `10.126.224.XXX`
        2. Subnet mask: `255.255.255.192`
        3. Gateway: `10.126.224.129`
        4. Preferred DNS: `10.134.184.21`
        5. Alternate DNS: `10.154.184.21`
![GC-Laptop-Setup-5](../../../../overrides/assets/images/gc-laptop-setup-5.png#centered)
    9. Click `Save`.
7. Add the Workstation to the GovCentral Domain, `imtn.gov`.
    1. Click on the `Start Menu` and type in `System` and click on it.
![GC-Workstation-Setup-1](../../../../overrides/assets/images/gc-workstation-setup-1.png#centered)    
    2. Scroll all the way down to the bottom and click on `About`.
![GC-Laptop-Setup-6](../../../../overrides/assets/images/gc-laptop-setup-6.png#centered)
    3. Scroll down a little more than halfway until you see a `Related links` section.
    4. Click the `Domain or workgroup` link.
![GC-Laptop-Setup-7](../../../../overrides/assets/images/gc-laptop-setup-7.png#centered)
    5. There will be a pop-up asking `"Do you want to allow this app to make changes to your device?"`. Click `Yes`.
    6. The `System Properties` window will open.
    7. Click the `Change` button where it says `"To rename this computer or change its domain or workgroup, click Change"`.
![GC-Laptop-Setup-8](../../../../overrides/assets/images/gc-laptop-setup-8.png#centered)
    8. Select the `Domain` radio button.
    9. Type in: `imtn.gov`
    10. Click the `OK` button.
![GC-Laptop-Setup-9](../../../../overrides/assets/images/gc-laptop-setup-9.png#centered)
    11. You will be prompted to enter credentials for an account with Domain Join permissions:
        1. Username: `adm_djoin_win`
        2. See your Lead for the password if you do not have it.
        3. Click `OK`.
![GC-Workstation-Setup-6](../../../../overrides/assets/images/gc-workstation-setup-6.png#centered)
    12. You should get a pop-up saying `"Welcome to the imtn.gov domain.` Click `OK`.
![GC-Workstation-Setup-7](../../../../overrides/assets/images/gc-workstation-setup-7.png#centered)
    13. Another pop-up will appear telling you `"You must restart your computer to apply these changes"`. Click `OK`.
![GC-Workstation-Setup-8](../../../../overrides/assets/images/gc-workstation-setup-8.png#centered)
    14. You'll get dropped back to the `System Properties` window. Click the `Close` button.
![GC-Workstation-Setup-9](../../../../overrides/assets/images/gc-workstation-setup-9.png#centered)
    15. Another pop-up will appear telling you `"You must restart your computer to apply these changes"`. Click `Restart Now`.
![GC-Workstation-Setup-10](../../../../overrides/assets/images/gc-workstation-setup-10.png#centered)
8. Once the machine is back up login with the `mecm_clientpush` account.
    1. Ask your Lead for the password if you do not have it.
9. Install the MECM Agent. Browse to:
    1. `\\10.134.184.62\reminst\ClientInstall\Client\`
10. Run the `ccmsetup.exe` file.
11. Wait 15 minutes. Go get a cup of coffee.
12. From your GovCentral Laptop, login to the Production Application Jump Server via Remote Desktop from your GovCentral Laptop with your `adm_` account:
    1. `10.134.183.70`
13. Open `Active Directory Users and Computers`.
    1. Expand `imtn.gov`.
    2. Expand `New System Builds`.
    3. Click on `Workstations`.
    4. Make sure the new Workstation is there.
14. Open MECM and make sure the Workstation goes into the correct Collection.
    1. Login to the Production Application Jump Server via Remote Desktop from your GovCentral Laptop with your `adm_` account:
        1. `10.134.183.70`
    2. Click on the `Start Menu` and type `config`. You should see `Configuration Manager Console` at the top. Click it.
        1. If it is your first time launching the `Configuration Manager Console` you will need to search for `configuration manager` instead of just `config`.
    3. On the left-hand side, click on `Device Collections`.
    4. Scroll down to `New Desktops`.
![GC-Workstation-Setup-2](../../../../overrides/assets/images/gc-workstation-setup-2.png#centered)
    5. Double-click on the `New Desktops` Collection.
    6. Search for the Hostname of the Workstation, IE: `USWJ3F3XB4`, and make sure it is there in the Collection.
    7. Make sure the icon has a green checkmark as well.
15. Back on the Workstation you will need to sign out of the `mecm_clientpush` account and login with your `adm_` account and then run the three (3) `Config Manager` jobs:
    1. Click on the `Start Menu`, type in `control` and click on the `Control Panel`.
    2. Select `Large icons` from the `View by` drop-down menu in the upper, right-hand corner.
    3. Click on `Configuration Manager`.
![GC-Laptop-Setup-19](../../../../overrides/assets/images/gc-laptop-setup-19.png#centered)
16. The `Configuration Manager Properties` window will open. Click on the `Actions` tab and run the following actions by selecting them and then clicking the `Run Now` button:
    1. `User Policy Retrieval`
    2. `Machine Policy Retrieval`
    3. `Application Deployment Evaluation Cycle`
17. Click on the `Start Menu` and type in `software`. You should see the `Software Center`. Click on it.
![GC-Workstation-Setup-11](../../../../overrides/assets/images/gc-workstation-setup-11.png#centered)
    1. Go to `Installation Status` and make sure, at a minimum, `Crowdstrike` and `Nessus` get installed before proceeding any further.
![GC-Workstation-Setup-12](../../../../overrides/assets/images/gc-workstation-setup-12.png#centered)
18. Back on your GovCentral Laptop, go back into Active Directory on the Jump Server so you can move the Workstation into the correct Organizational Unit (OU):
    <!-- markdownlint-disable MD033 -->
    <div class="admonition tip">
    <p class="admonition-title">Heads up!</p>
        We do not have the access to perform this step! You will need to reach out to John Ayodele with the Hostname to have him take care of this.
    </div>
    <!-- markdownlint-enable MD033 -->
    1. Expand `imtn.gov`.
    2. Expand `Remote-Sites`.
    3. Expand `Royersford-IRS`.
    4. Expand `Compute`.
    5. Drag the Workstation from `New System Builds -> Workstations` into the corresponding `Workstations` OU.
![GC-Workstation-Setup-3](../../../../overrides/assets/images/gc-workstation-setup-3.png#centered)
    6. Remember you need to make sure you have the Site correct for the above steps.
19. Double-click on the Workstation to open the Properties window and a note in the Description field saying `"Royersford IRS Workstation"`. Click the `OK` button.
    1. The note will depend on the Site the Workstation is located at.
20. Back on the Workstation open an elevated Command Prompt and update the Group Policy:
    1. Click on the `Start Menu`.
    2. Type in `command` and you will see `Command Prompt`. On the right side, click on `Run as administrator`.
![GC-Laptop-Setup-29](../../../../overrides/assets/images/gc-laptop-setup-29.png#centered)
    3. Click `Yes` to confirm.
    4. Type in the following command and press `Enter`:
        1. `gpupdate /force`
![GC-Laptop-Setup-30](../../../../overrides/assets/images/gc-laptop-setup-30.png#centered)
21. Reboot the Workstation.
22. Now it should be all good for you to install Kofax following the [GUIDE](../../../../tools/software/kofax/installations/govcentral.md).