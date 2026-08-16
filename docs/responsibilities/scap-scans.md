# SCAP Compliance Scans

Once a month, on the second Tuesday of each month, we are responsible for performing SCAP Scans on the ROPA IRS Servers and five of the Workstations.

## Servers

1. Login to USROYMKX11AP11.
2. Launch SCAP.
3. Click on Options at the top and then Show Options.
4. On the left-hand side, click on Output Options.
5. Select the option for "Save Results to a Custom Directory" and paste in the following path:
    1. `\\usroynxfsp01\securitylogs\SCC`
6. Click the Save button.
7. Set scan type to Windows Multiple Host Remote Scan.
8. Select remote scan mode of WMI.
9. Select existing Host File by clicking Browse:
    1. `C:\Program Files\SCAP Compliance Checker 5.8\server_hosts.txt`
10. Click the Edit Windows Host File button:
    1. Ensure the Servers listed under Server 2016 ARE NOT commented out (Line DOES NOT start with #).
    2. Ensure the Servers listed under Server 2022 ARE commented out (Line DOES start with #).
11. Select the Stream:
    1. `Windows_Server_2016_STIG`
12. Click on Start Scan
13. When the scan for the Windows Server 2016 Servers is complete, you now have to scan the Windows Server 2022 Servers.
14. Click on the Edit Windows Host File button:
    1. Ensure the Servers listed under Server 2016 ARE commented out (Line DOES start with #).
    2. Ensure the Servers listed under Server 2022 ARE NOT commented out (Line DOES NOT start with #).
15. Select the Stream:
    1. `MS_Windows_Server_2022_STIG`
16. Click on Start Scan.

## Workstations

### List of Workstations that currently have SCAP 5.12.1 installed

``` text title="Upstairs:"
    USW5W93XB4
    USWHW93XB4
    USWJV93XB4
    USW2X93XB4
    USWH5F3XB4
```

``` text title="Downstairs:"
    USW23RYQN3
    USWC1RYQN3
    USW10VYQN3
    USWGGNYQN3
    USWFMNTNZ3
```

1. Login to the Workstation with your CORP/FISMA adm account
2. Make sure SCAP Compliance Checker is version 5.12.1
    1. If not, browse to the following location:
        1. `\\usroynxfsp01\securitylogs\SCC\scc-5.12.1_Windows_bundle\scc-5.12.1_Windows`
    1. Run the following executable to install version 5.12.1:
        1. `SCC_5.12.1_Windows_Setup.exe`
3. Launch the SCAP Compliance Checker application
4. Set the scan type to Local Scan
5. On the right-hand side, select the Stream:
    1. `Microsoft_Windows_11_STIG`
6. Click on Start Scan

## Results

1. Results are found in: `\\usroynxfsp01\securitylogs\SCC`
    1. `{HOSTNAME}\Sessions\{DATED_FOLDER}\Results\SCAP\XML\FOO-XCCDF-Results-BAR.xml`
2. Collect the corresponding XML files and put them into an archive (zip)
    1. I like to put them all into a single folder on USROYMKX11AP11, IE: SCAP Scan Results, and then copy that folder into my Downloads folder on my local machine
    2. On Mac, you just right-click and click Compress to create a ZIP file of the folder
3. E-mail the archive to:
    1. `Tomika Leverett`
    2. `Chris Alexander`
    3. `#NA DMS ITAR Support`
