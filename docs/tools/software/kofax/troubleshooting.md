# Kofax Troubleshooting

## License Server Installation Issues

Sometimes during installation or after reboot the installer fails to continue the installation. This usually occurs when either UAC is not disabled (you will get a pop at the beginning of installation), or because you are running the installer over the network instead of locally. UAC is fixed by disabling it before install. The other is by copying the install folder to the local “C:\Temp” location and running the installer again. Below is an excerpt from the “Official Kofax Installation Guide” with some arguments that might help in certain situations as well:


### No VRS Install

From an elevated Command Prompt run:  

- **Workstation** - `C:\CTERA\CaptureSV\WrkInst\Setup.exe /NoVRS`
- **Standalone** - `<path>\Setup.exe /L /NoVRS`
- **License Server** - `<path>\Setup.exe /NoVRS`

!!! info

    VRS is required by Kofax to run, even if not being used. Only use this argument if you have already, plan to run the Manual installer for VRS, or have no plans to ever install a scanner or use Software Import on that device.


### No VB6 Components

From an elevated Command Prompt run:

- **Workstation** - `C:\CTERA\CaptureSV\WrkInst\Setup.exe /NoVB6`
- **Standalone** - `<path>\Setup.exe /L /NoVB6`
- **License Server** - `<path>\Setup.exe /NoVB6`


!!! info

    The Kofax Capture installer adds several Visual Basic 6 (VB6) components to your computer. If your organization's policy does not permit installation of VB6 components, use the following procedure to exclude them from your Kofax Capture installation.

With this procedure, the following VB6 components are excluded from the installation:

- AcAdMod.dll
- ACModule.dll
- ACWFLib.dll
- DBLite.dll
- DBLiteOpt.dll
- Kofax.ACWFLib.Interop.dll
- Kofax.AscentCaptureAdminMod.Interop.dll
- Kofax.DBLite.Interop.dll
- Kofax.DBLiteOpt.Interop.dll


### Reduce System Reboots

From an elevated Command Prompt run:

- **Install VRS before application installation** - `<path>\Setup.exe /vrssysfile`
- **Install SQL Express DB** - `<path>\Setup.exe /installstddb`

!!! info

    Use each switch in the order listed. If you attempt to use both switches at the same time, "installstddb" is ignored. After running each switch, you may need to restart your system.


## Kofax App Server\Workstation Installation Issues

Sometimes during installation or after reboot the installer fails to continue the installation. This usually occurs when either UAC is not disabled (you will get a pop at the beginning of installation), or because you are running the installer over the network instead of locally. UAC can sometimes be fixed by disabling it before install with a BAT script, but it doesn't always work and it is sometimes easier to just deal with it being active and re-install VRS after Kofax is installed.

The other instructions are listed below:

1. Navigate to `C:\CTERA` and create a local folder named `“CaptureSV”`. If the symbolic link already exists, delete it first then recreate it. Do not just rename the symlink as it will cause issues later.
![Kofax-Troubleshooting-1](../../../overrides/assets/images/kofax-troubleshooting-1.png#center)
2. Pull up a second window and navigate to the network path where the `“CaptureSV”` shared folder is located. The network path you use may be different than the one shown here.
![Kofax-Troubleshooting-2](../../../overrides/assets/images/kofax-troubleshooting-2.png#center)
3. Copy the `“WrkInst”` and the `“Config”` folders from the network path to the local path. Then run the `setup.exe` from the WrkInst folder like normal.
![Kofax-Troubleshooting-3](../../../overrides/assets/images/kofax-troubleshooting-3.png#center)
4. Once installation is complete then delete the local CaptureSV folder and re-run the symbolic link creation BAT file to re-create the correct CaptureSV folder.


## Convert to Remote Site does not work

After installation is complete and you need to convert the installation to a “remote site” to connect back to a central location for the license you will get an error window tell you to check your web url. Below are some troubleshooting tips if you get that error:

1. Make sure you have port 443 open from the Server to the web url and that it is accessible via a web browser.
    1. Try to telnet to the server the weburl is pointing to. To do that open an elevated Command Prompt and run:
        1. `telnet <server> 443`
        2. If it is successful then move onto the next step.
2. Next take the entire web url and throw it into a web browser window. If it loads like this screenshot below the url is accessible. If still having issues proceed to the next step.
![Kofax-Troubleshooting-4](../../../overrides/assets/images/kofax-troubleshooting-4.png#center)
3. Turn on TLS 1.0 and 1.1 in the registry:
    1. Open up Regedit and navigate to:
        1. `HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\SecurityProviders\SCHANNEL\Protocols`
![Kofax-Troubleshooting-5](../../../overrides/assets/images/kofax-troubleshooting-5.png#center)
    2. Go into each `“Client”` and `“Server”` subfolder and make the following changes:
![Kofax-Troubleshooting-6](../../../overrides/assets/images/kofax-troubleshooting-6.png#center)
4. After that, reboot the server. If that works, great. If not, then try the last step. Turn on `“StrongCrypto”` in the registry:
    1. Open up Regedit and navigate to:
        1. `HKEY_LOCAL_MACHINE\SOFTWARE\Wow6432Node\Microsoft\.NETFramework\v4.0.30319`
    2. Once there create a `“DWORD”` key and name it:
        1. `SchUseStrongCrypto`
    3. Then open up the key and apply the value:
        1. `00000001`
![Kofax-Troubleshooting-7](../../../overrides/assets/images/kofax-troubleshooting-7.png#center)
5. Now reboot and it should work from there.


## Remote Site Incorrect Temp Image Path

1. Ensure the following registry keys are updated (primarily on the License Server, but also at least each VM that has Kofax installed Also a good idea to spot check the computers in the environment as well). This ensures that new Batch Classes published will be pointing to the correct pathway:
    1. `Computer\HKEY_LOCAL_MACHINE\SOFTWARE\WOW6432Node\Kofax\SALicClient\SharedLicenseServerFileUnc`
        1. `C:\CTERA\CaptureSV\Config`
![Kofax-Troubleshooting-8](../../../overrides/assets/images/kofax-troubleshooting-8.png#center)
    2. `Computer\HKEY_LOCAL_MACHINE\SOFTWARE\WOW6432Node\Kofax Image Products\Ascent Capture\3.0\ServerPath`
        1. `C:\CTERA\CaptureSV`
![Kofax-Troubleshooting-9](../../../overrides/assets/images/kofax-troubleshooting-9.png#center)
2. Now copy the contents of the `“Images”` folder from the old path to the new correct path.
3. Next go to the local Kofax SQL Database. You will need to verify\update the Batch Classes and then the temp image path for Batches in Batch Manager:
    1. Table - `dbo.BatchDef`
        1. Update `“ImageDir”` column to reflect:
            1. `C:\CTERA\CAPTUR~1\Images`
![Kofax-Troubleshooting-10](../../../overrides/assets/images/kofax-troubleshooting-10.png#center)
    2. Table - `dbo.Batch`
        1. Update same column `“ImageDir”` with:
            1. `C:\CTERA\CAPTUR~1\Images`
![Kofax-Troubleshooting-11](../../../overrides/assets/images/kofax-troubleshooting-11.png#center)


## Batches Stuck In IM4 Ready

1. If you see a Batch that says IM4 Ready and you right click and go to Properties and get this error message or a similar error message:
![Kofax-Troubleshooting-12](../../../overrides/assets/images/kofax-troubleshooting-12.png#center)
2. Get the Batch ID for the Batch
![Kofax-Troubleshooting-13](../../../overrides/assets/images/kofax-troubleshooting-13.png#center)
3. Open up SQL Management Studio on the Database Server that has the KFX11PDB and run the following query:
    1.`Select * from xLock` - It will look like the below screenshot. The Batch ID will be the name you will use to find what server it is on.
        1. You are looking for `imintegrationmodule.exe` under the `ProcessName` column:
![Kofax-Troubleshooting-14](../../../overrides/assets/images/kofax-troubleshooting-14.png#center)
5. Next, you will run this query with the associated Database Server you found in Step 4:
```sql
SELECT  spid,
        sp.[status],
        loginame [Login],
        hostname, 
        blocked BlkBy,
        sd.name DBName, 
        cmd Command,
        cpu CPUTime,
        physical_io DiskIO,
        last_batch LastBatch,
        [program_name] ProgramName   
FROM master.dbo.sysprocesses sp 
JOIN master.dbo.sysdatabases sd ON sp.dbid = sd.dbid
where hostname = 'USCOLMKX11AP03'
```


## Standard Kofax Modules Not Opening

This is a guide for troubleshooting when a `“Standard Kofax Module”` (Scan, QC, Validation, Verification) will not open. Typically when opening a Batch in one of those modules you will see the application flash on the screen for a second then close for no apparent reason. There are a few ways to fix this and we will list them below:


### Incorrectly Configured Scanner Source

The most typical cause of this is an incorrectly configured `“Scanner Source”`. The most common of which is the `“Software Import”` source. To correct this, follow the steps below:

1. Check to see if any scanner, or scanner drivers are installed. If they are, make sure to leave that alone in the `“Scanner Configuration”` application.
2. Open up the `“Scanner Configuration”` utility:
![Kofax-Troubleshooting-15](../../../overrides/assets/images/kofax-troubleshooting-15.png#center)
3. When the application opens check mark the boxes at the bottom as seen below:
![Kofax-Troubleshooting-16](../../../overrides/assets/images/kofax-troubleshooting-16.png#center)
4. From there it sorts out ONLY the sources that have been configured. If there are no “Scanners” installed then make sure to delete any “Scanner Sources” that don’t belong. After that click on “File Import” and click “Set as Default” in the top right corner.
![Kofax-Troubleshooting-17](../../../overrides/assets/images/kofax-troubleshooting-17.png#center)
5. Next click on “Configure Sources…” to open a new window. From there delete any sources currently there and click “New” to create a new one. Copy the same settings as below:
![Kofax-Troubleshooting-18](../../../overrides/assets/images/kofax-troubleshooting-18.png#center)
6. Lastly click “OK” at the bottom and close out of the application. Now the Kofax default modules should open without any issue.


### VRS Is Not Installed Properly

The second reason is due to VRS not installing correctly during the installation process. Below describes how to reinstall from the base installation files.

1. Log into the machine that is having the issue and navigate to the following folder:
    1. `C:\CTERA\CaptureSV\WrkInst\Prerequisites\VirtualReScan` (version may vary)
![Kofax-Troubleshooting-19](../../../overrides/assets/images/kofax-troubleshooting-19.png#center)
2. From there run the `“Updater”` first then run the newer version with the `.msp` extension. After installation reboot and check to see if it’s fixed.


### VRS Needs to be Upgraded

The last way is to run a VRS upgrade to a newer version. 

1. For this you’ll need to navigate to a `"KC11Setup"` install folder on one of our Central Servers and grab the `"VRS"` folder and copy it to the local workstation:
![Kofax-Troubleshooting-20](../../../overrides/assets/images/kofax-troubleshooting-20.png#center)
2. Once the folder is on the local Workstation, run the `“setup.exe”` within the installer.
3. Once the installatoion has completed restart the machine and check again.


## Remote Site Name Will Not Update

This command should be used when there are station id or server path changes, as it updates the whole registry. You can find more information about it and it's parameters in the Capture installation guide. Also, there was a Workflow Agent missing error while synchronizing. To get past that, we re-registered the WFA.

1. Open an elevated Command Prompt and run the following command:
    1. `acdeployutil.exe /default`
![Kofax-Troubleshooting-21](../../../overrides/assets/images/kofax-troubleshooting-21.png#center)

!!! info

    "acdeployutil.exe /servername" or "acdeployutil.exe /stationid" should only be ran if no registry changes were previously made.


## Kofax RSA Sync Error

This is one that has multiple solutions based on the error message and other things. Please read through all the instructions to see which one applies to your scenario.

If you get this error message:

```shell title="Error Message 1"
(4900) General error while building batches: (57) Unable to write data to the transport connection:
An existing connection was forcibly closed by the remote host
Kofax Case reference: 26218149                                                                               
```

Or this error message:

```shell title="Error Message 2"
(5) The remote server returned an error: (413) Request Entity Too Large
Kofax Case reference: 26207140
```

The issue can be fixed by updating the `“TIMEOUT”` setting within the ACConfig file as well as on the Central Web Servers, which then require you to restart the IIS Central Server.

1. Log into the Remote Kofax Site Server (usually P01) and stop the `“ACIS Remote Synchronization Agent”` Service.
![Kofax-Troubleshooting-22](../../../overrides/assets/images/kofax-troubleshooting-22.png#center)
2. Next, navigate to the `“C:\CTERA\CaptureSV”` folder and locate the "`ACConfig.xml"` config file.
    1. Create a backup and place it within the `"Archive"` folder.
![Kofax-Troubleshooting-23](../../../overrides/assets/images/kofax-troubleshooting-23.png#center)
3. Next, open the file up in a text editor, locate the following tag lines, and insert the comment listed below. Once changed then close and save the file.
```shell title="Find this"
     <ACIServer RemoteSite="1" />
```
```shell title="Change to this"
  <ACIServer RemoteSite="1">
      <TransferTimeout>300</TransferTimeout>
  </ACIServer>
```
4. Next go to the `“Central Web Servers”` (usually labeled with WP01 and WP02). Once there, navigate to the `"KCN Server"` folder and locate the `“web.config”` file and open it in a text editor (you will need to do this on both of the web servers so they are in sync):
    1. `C:\Program Files (x86)\KCN Server\Bin\Web`
![Kofax-Troubleshooting-24](../../../overrides/assets/images/kofax-troubleshooting-24.png#center)
5. Locate the tagged section labeled `<system.webServer>` and add the following line in between the open and close tag line:
```xml
<requestLimits maxAllowedContentLength="419430400"></requestLimits>
```
![Kofax-Troubleshooting-25](../../../overrides/assets/images/kofax-troubleshooting-25.png#center)
6. Next locate the tagged section labeled `<system.web>` and add in the below line:
```xml
<httpRuntime maxRequestLength="102400" executionTimeout="300" />
```
![Kofax-Troubleshooting-26](../../../overrides/assets/images/kofax-troubleshooting-26.png#center)
7. Save the text file on both Servers.
8. On both Servers, open up an elevated Command Prompt and use the following command to restart the IIS services.
    1. `iisreset`
9. Once that is done, go back to the `“Remote Site”` and start up the `"ACIRSA"` Service again.

If you get this error message:

```shell title="Error Message 3"
The remote server returned an error (503) Server Unavailable
```

This is fixed by rebuilding the KC Web Site.

1. Navigate to the Kofax Web Servers(normally listed as WP01 and WP02) Check the IIS Manager and verified the customer is using the Default Web Site. If so then delete the `“ACIS”` and `“ACIUpload”` items out of IIS:
![Kofax-Troubleshooting-27](../../../overrides/assets/images/kofax-troubleshooting-27.png#center)
2. Navigate to the `"KCN Server"` folder listed below and run the `“acicfgwz.exe”` file and navigate through each of the prompts using the default information:
    1. `C:\Program Files (x86)\KCN Server\Bin`
![Kofax-Troubleshooting-28](../../../overrides/assets/images/kofax-troubleshooting-28.png#center)
    2. On this part, you should use the Kofax Service Account and Domain associated with that environment:
![Kofax-Troubleshooting-29](../../../overrides/assets/images/kofax-troubleshooting-29.png#center)
3. After that, open up an elevated Command Prompt and reset IIS using the following command:
    1. `iisreset`
4. Next, in the same elevated Command Prompt window, run the following commands to stop the `ACIS` Service, and then start it again:
    1. `AcisCfg.exe /d`
    2. `AcisCfg.exe`
5. Log back into the Remote Site and attempt to synchronize again.


### Performing a Manual RSA Sync

You can perform a manual RSA sync by following the below steps. A manual RSA sync is one method of confirming Remote Site connectivity to the Central Kofax Server.

1. Login to the corresponding AP01 Kofax Application Server for the Site you wish to perform the manual sync, IE: `usroyirsk11ap01` or `usdalirsk11ap01`, using Remote Desktop.
2. You need to open the Services window so click the `Start` button and type in `services` and then click the `Services` icon.
![Manual-RSA-Sync-1](../../../overrides/assets/images/manual-rsa-sync-1.png#centered)
3. A `User Account Control` box will pop-up asking if you want to allow the app to make changes to your device. Click the `Yes` button.
![Manual-RSA-Sync-2](../../../overrides/assets/images/manual-rsa-sync-2.png#centered)
4. Find the `ACIS Remote Synchronization Agent` Service, which should be right at the top, if not the first one. Right-click on the Service and click on `Stop` to stop the Service.
![Manual-RSA-Sync-3](../../../overrides/assets/images/manual-rsa-sync-3.png#centered)
5. Click the `Start` button and type in `run` to find the `Run` application, then click on it to open it.
![Manual-RSA-Sync-4](../../../overrides/assets/images/manual-rsa-sync-4.png#centered)
6. Now we need to launch the Agent under our local account, so type `ACIRSA` into the Run box and click the `OK` button.
![Manual-RSA-Sync-5](../../../overrides/assets/images/manual-rsa-sync-5.png#centered)
7. The Agent will start, most likely minimized, so you will have to epand the `System Tray` to see the RSA icon.
![RSA-Icon](../../../overrides/assets/images/rsa-icon.png#centered) ![Manual-RSA-Sync-6](../../../overrides/assets/images/manual-rsa-sync-6.png#centered)
8. Right-click on the RSA icon and select `Status`.
![Manual-RSA-Sync-7](../../../overrides/assets/images/manual-rsa-sync-7.png#centered)
9. This will open the RSA window where you can perform various actions and see the overall status. For our purpose, you want to click the `Synchronize Now` button and watch for new log entries at the top of the window to indicate that the sync was a success.
![Manual-RSA-Sync-8](../../../overrides/assets/images/manual-rsa-sync-8.png#centered)
10. If the manual sync was successful, you can click the `Hide` button, go back to the `System Tray`, right-click the RSA icon again, and select `Close` since we do not want to leave it running under our local account.
![Manual-RSA-Sync-9](../../../overrides/assets/images/manual-rsa-sync-9.png#centered)
11. A pop-up box will apear asking if you want to close the Agent, click the `Yes` button.
![Manual-RSA-Sync-10](../../../overrides/assets/images/manual-rsa-sync-10.png#centered)
12. Now we need to start the `ACIS Remote Synchronization Agent Service` again, so go back to the `Services` window, right-click on the Service, and click `Start`.
![Manual-RSA-Sync-11](../../../overrides/assets/images/manual-rsa-sync-11.png#centered)
13. The Service should start and show as `Running`.
![Manual-RSA-Sync-12](../../../overrides/assets/images/manual-rsa-sync-12.png#centered)


## Kofax Login Appears When Using Applications

This occurs for one of two reasons. First is because the user is not a part of the correct AD Group and does not have access to the Kofax application. It is typically best to start by checking there first. The Second is generally because either the `“registerimtlwfa.bat”` file was not run after Kofax was installed, or at some point the registration reverted back and no longer works. To correct that please see below.

1. Log into the desktop as an Admin.
2. Navigate to the `"Kofax Bin"` folder.
    1. `C:\Program Files (x86)\Kofax\Capture\Bin`
3. From there locate the `“RegisterIMTLWFA.bat”` file and run it.
    1. You will want to right-click on the file and select `"Run as administrator"`.
![Kofax-Troubleshooting-30](../../../overrides/assets/images/kofax-troubleshooting-30.png#center)