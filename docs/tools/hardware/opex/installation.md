# Installation

## Prerequisites

1. Similar to IBML set up there will need to be an `“OPEX”` folder established on the CTERA pathway. This folder will handle shared file and job settings along with temp image storage and other configuration data. Below is an example folder:
![Opex-Install-1](../../../overrides/assets/images/opex-install-1.png#centered)
    1. Add the `“OPEX”` symbolic link to the CTERA `.bat` file. This will need to be used on all OPEX Workstations and VMs running `“Transformation”`.
2. Next, there will need to be a local Windows VM set up alongside the CTERA VM to be used by the `“Transformation Module”` which is similar to the PostScan setup for the IBML machines.


## Workstation

1. Once the OPEX has been physically set up and connected to the network onsite it will need to be joined to the domain. Typical naming convention is “Site-OPEX-01, 02, 03, etc” for example the ones we set up for Hazelwood, MO we used “HAMO-OPEX-01”, then “HAMO-OPEX-02”, etc. The default name on the machine in the past is not unique to that machine so it must be changed.
2. Next will be adding CTERA pathways(typical to a Kofax installation) to the workstations. The machines are preinstalled with the software required by the OPEX team to operate the machine. When asked by the OPEX team what folder to use for storage of Job files and shared settings use the “C:\CTERA\OPEX” and ensure they are aware that the directory is a symbolic link and not a local pathway.
3. After that OPEX will handle the Job set up and Transformation set up based on the project they are setting it up for. After they have completed here are some settings we want to ensure are enabled.
    1. Set up the “Active Directory” file and place it within the “OPEX Data Jobs Falcon” folder. Copy the below data into an empty .txt file and change the “AD” group after the = sign to the ones required by the site:
```yaml
[Groups]

Entry=
User=
Manager=
Superivisor=
```
    2. For any group not required just leave as is. Once created change the extension to .INI and place inside the jobs folder “C:\CTERA\OPEX\OPEX Data Jobs FalconP”
    3. Next, go to System Setup, General Settings, and ensure OperatorManagement is set to Active Directory and the “ActiveDirectoryConfigFile” is pointing to the location you had placed the file earlier:
![Opex-Install-2](../../../overrides/assets/images/opex-install-2.png#centered)
    4. Lastly verify all the directories listed below are pointing to C:\CTERA\OPEX(these are for the shared job and set up folders which should have already been established by OPEX)
        1. `System Setup -> General Settings -> SharedSettingsFilePath`
![Opex-Install-3](../../../overrides/assets/images/opex-install-3.png#centered)
        2. `System Setup -> ONS Settings -> Network Batch Log Path and Network Batch Stats Path`
![Opex-Install-4](../../../overrides/assets/images/opex-install-4.png#centered)
        3. `System Setup -> Storage Settings -> OperatorDataPath and ProductionPath`
![Opex-Install-5](../../../overrides/assets/images/opex-install-5.png#centered)


## Transformation VM

A shared session with OPEX will need to be done to move the installation files to the server and then to do the initial installation and set up the license for the transformation module.

1. Establish the CTERA folders using the `.bat` file.
2. Next, have OPEX place the installation files on the desktop of the workstation. Then remote into the Workstation and move them to one of the CTERA pathways so you can access them from the VM. On the VM copy the files from their stored location to the desktop. There should be 2 files `“SetupOPEXScannerSoftware”` and `“SetupCertainScanTransform”`; Similar to the ones shown below (names may differ based on current versions):
![Opex-Install-6](../../../overrides/assets/images/opex-install-6.png#centered)
3. OPEX should inform you of this as you start installation but you must install the `“ScannerSoftware”` one first and `“Transformation”` second or the other will fail to install.
4. During installation it will ask you to install Framework, if it is not already installed.
5. The last thing you need to check for during installation is when installing the `“Transform”` portion you need to make sure that `“Start as a service”` is selected (wording may change with different versions).
6. Next you need to open up the `“CertainScanMonitor”` shortcut on the Desktop and set the `“System Setup”` paths the same as earlier in the Workstation setup:
    1. `System Setup -> General Settings -> SharedSettingsFilePath`
![Opex-Install-7](../../../overrides/assets/images/opex-install-7.png#centered)
    2. `System Setup -> Storage Settings -> OperatorDataPath and ProductionPath`
![Opex-Install-8](../../../overrides/assets/images/opex-install-8.png#centered)
7. Last things to do is ensure the below settings with the `“CertainScan Monitor”` are set and then apply the services account to the `“OPEX CertainScan Software”` in Services.
	1. `System Setup -> Batch Monitor Settings -> RunBatchProcess and RunBatchTransform`
![Opex-Install-9](../../../overrides/assets/images/opex-install-9.png#centered)
![Opex-Install-10](../../../overrides/assets/images/opex-install-10.png#centered)