# IMGS // GovCentral Laptops

When a User needs a new laptop for GovCentral, there is a process we must go through in order to get it setup properly for use within the Network, setup to connect to the VPN and setup to work with their respective Meraki Z4 Gateway.

1. Get a designated GovCentral Laptop from JP or our own inventory and make sure it is running the latest version of our image.
    1. If it is outdated, you can follow the [GovCentral Laptop // Workstation Re-Imaging](reimage.md) guide.
2. Login to the Workstation with the `eawilliam` account.
    1. Ask your Lead for the password if you do not have it.
3. There will be a window, `Select your Country`. Scroll down and select `United States of America (the)` and click `OK`.
![GC-Workstation-Setup-4](../../../../overrides/assets/images/gc-workstation-setup-4.png#centered)
4. A `Windows Powershell credential request` popup will appear. Type anything you want into the `User name` box and press `Enter` or click `OK`.
![GC-Workstation-Setup-5](../../../../overrides/assets/images/gc-workstation-setup-5.png#centered)
5. The machine will reboot. When it is back online login with the `eawilliam` account again.
6. If you are working on the Laptop in our office you can connect it to our Cisco switch or you can sit at any one of the IRS Workstation desks and plug the network cable in. DHCP is just fine for these situations.
    1. If you need to, for whatever reason, work down in DLA where we used to setup Laptops and Workstations, you will need to obtain an IP from John A. for use with the Laptop. It is a provided "Build Network" and usually consists of IP addresses from within the following range:
        1. `10.126.224.150 - 10.126.224.185`
    2. Login to the Laptop with the `eawilliam` account.
        1. Ask your Lead for the password if you do not have it.
    3. Configure the previously obtained static IP:
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
7. Add the Laptop to the GovCentral Domain, `imtn.gov`.
    1. From the `Network & internet > Ethernet` page from above, click on `System` on the left-hand side.
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
8. Once the machine is back up, login with the `mecm_clientpush` account.
    1. Ask your Lead for the password if you do not have it.
9. Login to the Production Application Jump Server via Remote Desktop from your GovCentral Laptop with your `adm_` account:
    1. `10.134.183.70`
10. Open `Active Directory Users and Computers`.
11. Expand `imtn.gov` and click on `Computers`. Make sure the Laptop is there.
![GC-Laptop-Setup-10](../../../../overrides/assets/images/gc-laptop-setup-10.png#centered)
12. Install the MECM Agent. Browse to:
    1. `\\10.134.184.62\reminst\ClientInstall\Client\`
13. Run the `ccmsetup.exe` file.
14. Sign out of the Laptop, give it a bit, and wait for it to show up in MECM:
    1. Login to the Production Application Jump Server via Remote Desktop from your GovCentral Laptop with your `adm_` account:
        1. `10.134.183.70`
    2. Click on the `Start Menu` and type `config`. You should see `Configuration Manager Console` at the top. Click it.
        1. If it is your first time launching the `Configuration Manager Console` you will need to search for `configuration manager` instead of just `config`.
![GC-Laptop-Setup-11](../../../../overrides/assets/images/gc-laptop-setup-11.png#centered)
    4. Click on `Devices` on the left-hand side and search for the Hostname of the Laptop, IE: `USL80451C4`, and press `Enter`.
![GC-Laptop-Setup-12](../../../../overrides/assets/images/gc-laptop-setup-12.png#centered)
15. Back on the new Laptop, login with your `adm_` account as you will need to setup the two connections for the VPN.
    1. Right-click on the Checkpoint VPN icon and select `VPN Options`.
    2. The Sites window will open. Click the `New` button.
![GC-Laptop-Setup-13](../../../../overrides/assets/images/gc-laptop-setup-13.png#centered)
    3. The `Site Wizard` window will appear. Click `Next`.
![GC-Laptop-Setup-14](../../../../overrides/assets/images/gc-laptop-setup-14.png#centered)
    4. Enter the following IP address in the `Server address or Name` box:
        1. `10.134.128.1`
    5. Check the box for `Display name` and enter the following:
        1. `IMGS Network`
    6. Click the `Next` button.
![GC-Laptop-Setup-15](../../../../overrides/assets/images/gc-laptop-setup-15.png#centered)
    7. It will test the connection and save it. You will then see a `Site created successfully` message.
    8. Click `Finish`.
![GC-Laptop-Setup-16](../../../../overrides/assets/images/gc-laptop-setup-16.png#centered)
    9. A box will pop up asking `"Would you like to connect?"`. Click `No`.
    10. Repeat steps `A-I` again while entering the following information:
        1. Server address or Name: `10.154.128.1`
        2. Display name: `IMGS Network 2`
    11. You will most likely see a window stating that `"The site's security certificate is not trusted!"`. You can just click the `Trust and Continue` button.
![GC-Laptop-Setup-32](../../../../overrides/assets/images/gc-laptop-setup-32.png#centered)
16. Sign out of the Laptop and then wait 10-15 minutes and then check the Laptop on MECM once more, making sure that a green checkmark appears over the icon.
17. Right-click on the Laptop, go to `Add Selected Items`, then click on `Add Selected Items to Existing Device Collection`.
![GC-Laptop-Setup-17](../../../../overrides/assets/images/gc-laptop-setup-17.png#centered)
    1. Scroll down to and select `New IMGS Laptop Build`.
    2. Click `OK`.
![GC-Laptop-Setup-18](../../../../overrides/assets/images/gc-laptop-setup-18.png#centered)
18. Take a 10 minute break and then login with your `adm_` account again. Go get yourself a cup of coffee, you deserve it.
19. Back on the Laptop you will need to run the three (3) `Config Manager` jobs:
    1. Click on the `Start Menu`, type in `control` and click on the `Control Panel`.
    2. Select `Large icons` from the `View by` drop-down menu in the upper, right-hand corner.
    3. Click on `Configuration Manager`.
![GC-Laptop-Setup-19](../../../../overrides/assets/images/gc-laptop-setup-19.png#centered)
20. The `Configuration Manager Properties` window will open. Click on the `Actions` tab and run the following actions by selecting them and then clicking the `Run Now` button:
    1. `User Policy Retrieval`
    2. `Machine Policy Retrieval`
    3. `Application Deployment Evaluation Cycle`
![GC-Laptop-Setup-20](../../../../overrides/assets/images/gc-laptop-setup-20.png#centered)
21. Click the `OK` button.
22. Click on the `Start Menu` and type in `software`. You should see the `Software Center`. Click on it.
![GC-Workstation-Setup-11](../../../../overrides/assets/images/gc-workstation-setup-11.png#centered)
    1. Go to `Installation Status` and make sure, at a minimum, `Crowdstrike` and `Nessus` get installed before proceeding any further.
![GC-Workstation-Setup-12](../../../../overrides/assets/images/gc-workstation-setup-12.png#centered)
23. The laptop will eventually get the Windows updates, just have to wait and let it run it's course.
24. Sign out and then log back in as the user with the password that was provided by John A.
25. Click on the `Start Menu`, type in `manage wi-fi`, and click on `Wi-Fi settings`.
![GC-Laptop-Setup-21](../../../../overrides/assets/images/gc-laptop-setup-21.png#centered)
26. Click on `Manage known networks`.
![GC-Laptop-Setup-22](../../../../overrides/assets/images/gc-laptop-setup-22.png#centered)
27. Click on `Add network`.
![GC-Laptop-Setup-23](../../../../overrides/assets/images/gc-laptop-setup-23.png#centered)
28. Add the `Peak` network with the folowing settings:
    1. Network name: `Peak`
    2. Security type: `WPA2-Enterprise AES`
    3. EAP method: `Protected EAP (PEAP)`
    4. Authentication method: `Secured password (EAP-MSCHAP v2)`
29. Click `Save`.
![GC-Laptop-Setup-24](../../../../overrides/assets/images/gc-laptop-setup-24.png#centered)
30. Login to the [Cisco Duo Admin Panel](https://admin-4ffea624.duofederal.com/) and run the sync with the GovCentral Active Directory Server to pull in the new User:
    1. Hover over `Users` and select `External Directories`.
![GC-Laptop-Setup-25](../../../../overrides/assets/images/gc-laptop-setup-25.png#centered)
    2. Click on the link for `GovCent`.
![GC-Laptop-Setup-26](../../../../overrides/assets/images/gc-laptop-setup-26.png#centered)
    3. Click the `Sync Now` button and wait for it to sync.
![GC-Laptop-Setup-27](../../../../overrides/assets/images/gc-laptop-setup-27.png#centered)
31. When a new User is added into Duo they are automatically sent the enrollment e-mail.
32. Go back into Active Directory on the Jump Server so you can add a note to the Laptop object:
    <!-- markdownlint-disable MD033 -->
    <div class="admonition tip">
    <p class="admonition-title">Heads up!</p>
        We do not have the access to perform this step! You will need to reach out to John Ayodele with the Hostname to have him take care of this.
    </div>
    <!-- markdownlint-enable MD033 -->
    1. Right-click on `imtn.gov` and select `Find`.
    2. Select `Computers` from the `Find` drop-down menu.
    3. Search for the Laptop name.
![GC-Laptop-Setup-33](../../../../overrides/assets/images/gc-laptop-setup-33.png#centered)
    4. Double-click on the Laptop to open the Properties window and a note in the Description field like `"USERNAME Laptop"`.
    5. Click the `OK` button.
![GC-Laptop-Setup-34](../../../../overrides/assets/images/gc-laptop-setup-34.png#centered)
33. Go back to the main Active Directory window and update the Group for the Laptop:
    <!-- markdownlint-disable MD033 -->
    <div class="admonition tip">
    <p class="admonition-title">Heads up!</p>
        We do not have the access to perform this step! You will need to reach out to John Ayodele with the Hostname to have him take care of this.
    </div>
    <!-- markdownlint-enable MD033 -->
    1. Expand `imtn.gov` and click on `Computers`.
    2. Find the Laptop within the right-hand pane.
    3. Drag the Laptop to `Shared Services`, `Compute`, `Laptops`.
![GC-Laptop-Setup-28](../../../../overrides/assets/images/gc-laptop-setup-28.png#centered)
34. Open an elevated Command Prompt and update the Group Policy:
    1. Click on the `Start Menu`.
    2. Type in `command` and you will see `Command Prompt`. On the right side, click on `Run as administrator`.
![GC-Laptop-Setup-29](../../../../overrides/assets/images/gc-laptop-setup-29.png#centered)
    3. Click `Yes` to confirm.
    4. Type in the following command and press `Enter`:
        1. `gpupdate /force`
![GC-Laptop-Setup-30](../../../../overrides/assets/images/gc-laptop-setup-30.png#centered)
35. Reboot the Laptop.
36. Once it reboots, login with your `adm_` account.
37. If you had to configure a static IP address, go back and follow `Step 4`, `Substeps A-E`, to change the IPv4 configuration back to `Automatic (DHCP)`.
![GC-Laptop-Setup-31](../../../../overrides/assets/images/gc-laptop-setup-31.png#centered)
38. Shut down the Laptop.
39. Go back to MECM (Configuration Manager Console) on the Jump Server and add the Laptop to the `IMGS Laptops` collection following the instructions in `Step 16`.
40. Now you need to enroll the user in Cisco Duo on their phone so that they can get the prompts to connect to the VPN. You can follow the instructions [HERE](../../../user-management/duo.md) to do that.
41. Wait for the User to let you know they received it and then schedule some time to go through setting up their Z4, logging into the Laptop, logging into the VPN, and logging into Secret Server.


## Meraki Z4(C) Wireless Gateway

Eventually we will be handling the initial configuration of the Meraki Z4(C) Wireless Gateway for Users, but for now, we just need to grab one and send the serial number to David Smith with the User's name and he will get it configured for us.