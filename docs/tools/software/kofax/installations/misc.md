# Miscellaneous Kofax Installation Tips & Tricks

Kofax is a fickle beast and, as such, tips & tricks get developed for dealing with it.

## .NET 3.5 Installation

Kofax requires .NET 3.5 to be installed. This is typically handled by Tanium, the software management application we utilize, but sometimes it takes too long to install on its own. To get around this you can do the following:

1. Login to the Workstation with your corresponding ADM account.
2. Open File Explorer and navigate to the following directory:
    1. `\\usroynxfsp01\kofax\KC11Setup`
3. Copy the `DotNET_35_Install.bat` file to the `C:\Temp` directory.
4. Right-click on the `DotNET_35_Install.bat` file and select `Run as administrator`.
5. You should see the .NET 3.5 installation complete.

```batch title="DotNET_35_Install.bat"

:: FISMA Kofax Workstation .NET Installer BAT

@echo off

:: Copy the CAB files
echo Copying CAB files to C:\temp
xcopy /s "\\usroynxfsp01\kofax\KC11Setup\DotNET_CAB_Files\" "C:\temp\DotNET_CAB_Files\"

:: Unblock the CAB files
powershell -command "get-childitem 'C:\temp' -recurse | unblock-file"

:: Install .NET 3.5 from the CAB files
echo Installing .NET 3.5
DISM /Online /Enable-Feature /FeatureName:NetFx3 /All /LimitAccess /Source:C:\temp\DotNET_CAB_Files

pause

```