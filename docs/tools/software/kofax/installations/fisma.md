# Kofax installtion on a FISMA Workstation

## Prerequisites

Before you can begin the Kofax installation you must ensure the following:

1. Within [Active Roles (AD)](https://usnusmarsp04.na.imtn.com/ADUC/) you need to:
    1. Move the Workstation to the IRS OU.
    2. Add the Workstation to the PM-Kofax Group.


## Installation

1. Open up File Explorer and browse to:
    1. `\\usroynxfsp01\kofax\KC11Setup\`
2. Copy the `KofaxCapture-11.0.1` folder to `C:\Temp`.
3. Launch an elevated Command Prompt.
4. Browse to `C:\Temp\KofaxCapture-11.0.1` and open the `COMMANDS.txt` file.
5. Run the following command by copying and pasting it into the elevated CMD you opened:
    1. `powershell -command "get-childitem "C:\Temp" -recurse | unblock-file"`
6. Right-click on the "ROFO IRS.bat" file and click "Run as administrator".
7. Go back to the `COMMANDS.txt` file and run the following command by copying and pasting it into the elevated CMD you opened:
    1. `"C:\CTERA\CaptureSV\WrkInst\setup.exe /NoVRS"`
8. It will give the warning that UAC is still enabled so ignore it and move on through.
9. Make sure you check the box for the Kofax update thing on the Language Install screen.
10. When the Kofax install finishes, you need to install VRS.
    1. Navigate to the following directory:
        1. `"C:\CTERA\CaptureSV\WrkInst\Prerequisites\VirtualReScan 5.1.1"`
    2. Right-click on setup.exe and click "Run as administrator".
11. Go through the install and you'll get to a screen asking you to select the default scanner.
    1. The default selection of Image Import is fine, continue.
12. Once the VRS install is complete, go back to the `COMMANDS.txt` file.
13. Run the following commands by copying and pasting them into the elevated CMD you have open:
    1. `xcopy /s "\\USROYNXFSP01\kofax\KC11Setup\KC 11 Customizations\Files to copy" "C:\Program Files (x86)\Kofax\Capture\Bin"`
    2. `powershell -command "get-childitem 'C:\Program Files (x86)\Kofax\Capture\Bin' -recurse | unblock-file"`
    3. `"C:\Program Files (x86)\Kofax\Capture\Bin\kofax_Workstation_Deployment.bat"`
14. Navigate to the following directory:
    1. `"C:\Program Files (x86)\Kofax\Capture\Bin\"`
        1. Run `Scan.exe` and make sure it opens.
15. Launch Batch Manager and make sure it works.