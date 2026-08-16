# IM Integration Modules

Iron Mountain builds and maintains custom Kofax 11 modules that sort, organize, and manipulate scanned images for customer projects. Each batch class can use one or many of these modules depending on customer need.


## Examples of IM Modules

### GDIT

- **IM1** - Import Special Media
- **IM2** - Thumbnail creation.
- **IM3 (Release)** - PDF (Portable Document Format) files are moved from CaptureSV to Release Folder, ready for customer delivery.
- **IM4** - Match and merge scanned images from multiple sources.
- **IM5** - Remove blank pages
- **IM6** - CTERA Image sync validation script / barcode reading
- **IM7 (PDF Gen)** - PDF (Portable Document Format) Creation. Kofax uses this module to convert raw image data and present it in PDF (Portable Document Format).


### IRS

- **IM2** - Thumbnail creation.
- **IM3 (Release)** - PDF (Portable Document Format) files are moved from CaptureSV to Release Folder, ready for customer delivery.
- **IM30** - Sends the batch to the Cloud or on-prem IDP Cluster for processing.


## v1 Installation

This is the older, legacy installation. They still exist, but we generally do not install them anymore.

1. Login to the Server.
2. Open an elevated Command Prompt and run the following command:
    1. `InstallUtil.exe -module=3 -instance=1 -interval=5000 "C:\Program Files (x86)\Kofax\Capture\Bin\IMIntegrationModule.exe"`
        1. Make sure you specify the correct IM Module and instance number.
3. Open the Registry Editor and browse to:
    1. `Computer\HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Services\IM Integration Module [Instance: 1]`
        1. Be sure to find the correct Service which you just created above.
4. Double-click (open) the ImagePath key and add a leading double-quote to the beginning of the line, in front of `C:\`.
5. Double-click (open) the ObjectName key and paste in the Service Account:
    1. `imtn.gov\SVC_Kofax_IMGS`
6. Open Services and find the Service you created.
7. Double-click (open) the Service.
8. Go to the Recovery tab and set both the `"First failure"` and `"Second failure"` options to `"Restart the Service"`.
9. Go to the Log On tab and enter the following password for the Service account:
    1. Talk to your Lead/Supervisor for the password.
10. Go to the General tab and set the `"Startup type"` to `"Automatic (Delayed Start)"`.
11. Click Apply.
12. Start the Service by clicking the Start button.
13. Verify the newly created Service is now running.


## v2 Installation

1. Open an elevated Command Prompt and run the following commands to setup the Service:
    1. `cd "C:\Program Files (x86)\Kofax\Capture\Bin\IMIntegrationModuleBin\AEX"`
    2. `InstallUtil.exe -module=Alpha -instance=1 -interval=5000 "C:\Program Files (x86)\Kofax\Capture\Bin\IMIntegrationModule.exe"`
2. Copy module files to C:\temp:
    1. `xcopy /s "\\10.86.25.134\kofax\KC11Setup\KC 11 Customizations\NewIMModules2023" "C:\temp\NewIMModules2023\"`
3. Unblock the files in the elevated Command Prompt:
    1. `powershell -command "get-childitem "C:\temp" -recurse | unblock-file"`
4. Disable FIPs via the Registry Editor:
    1. Open Regedit: Press `Win + R`, type `regedit`, and press `Enter`.
    2. Navigate to the following:
        1. `HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\Lsa\FIPSAlgorithmPolicy`
    3. Find the `Enabled` DWORD key and set its `Value data` to `0` (zero).
5. Log out of the Server and log back in as quickly as possible.
6. Run the installer in the elevated Command Prompt:
    1. `cd C:\temp\NewIMModules2023`
    2. `IMModules.msi`
7. Copy the JSON file from `"C:\temp"` to the Kofax BIN folder:
    1. `xcopy /s "C:\temp\NewIMModules2023\IMIntegrationModule_config.json" "C:\Program Files (x86)\Kofax\Capture\Bin"`
8. Open the Registry Editor and update the ImagePath for the following key with a leading double quote:
    1. `Computer\HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Services\IM Integration Module Alpha [Instance: 1]`
9. Open Services and update the new IM Integration Module service:
    1. Recovery tab, set `"First failure"` and `"Second failure"` to `"Restart the Service"`.
    2. Log On tab, select `"This account"` and put in the following credentials:
        1. `imtn.gov\SVC_Kofax_IMGS`
        2. Talk to your Lead/Supervisor for the password.
10. General tab, set `"Startup type"` to `"Automatic (Delayed Start)"`.
11. Click the `Apply` button and then click the `Start` button.