# Kofax installation on a Gov Central Workstation

!!! tip "Heads up!"

    You MUST run all BAT files and commands from within an elevated Command Prompt or right-click and select "Run as administrator"

1. Open up FIle Explorer and browse to:
    1. `\\10.86.25.134\Kofax\`
2. Right-click the following BAT file and select "Run as Administrator":
    1. `IRS.bat`
3. Right-click the following BAT file and select "Run as Administrator":
    1. `1. Disable LUA(Kofax Install) then Reboot.bat`
4. After the reboot launch an elevated Command Prompt and run the below setup file:
    1. `"C:\CTERA\CaptureSV\WrkInst\setup.exe"`
        1. As you click through the windows of the installer, when you reach the “Language Packs” section, make sure to check the box for the “11.1.1 update package”
    2. The Kofax installation will require a reboot part way through, and will continue automatically once you log back in
5. Once the installation is complete, click the "Finish" button
6. Open an elevated Command Prompt and run the below command to copy the custom files to the local machine:
    1. `xcopy /s "\\10.86.25.134\Kofax\KC11Setup\KC 11 Customizations\Files to copy - K11.1 (GDS)" "C:\Program Files (x86)\Kofax\Capture\Bin"`
7. In the same elevated Command Prompt, run the below to unblock all the copied files:
    1. `powershell -command "get-childitem 'C:\Program Files (x86)\Kofax\Capture\Bin' -recurse | unblock-file"`
8. In the same elevated Command Prompt, run the below to complete the workstation deployment:
    1. `"C:\Program Files (x86)\Kofax\Capture\Bin\kofax_Workstation_Deployment.bat"`