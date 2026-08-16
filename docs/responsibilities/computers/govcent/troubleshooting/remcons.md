# Remote Connections

Sometimes we need to remotely connect to Workstations and Laptops to perform troubleshooting, updates, software installations like Kofax, etc.


## Remote Desktop Connection

!!! warning "Warning!"

    This method ONLY works for connecting to GovCent Workstations and will not work for GovCent Laptops!

1. Login to your GovCentral laptop and connect to the VPN.
2. Connect to the GovCentral Production Jump Server via Remote Desktop:
    1. `USNUSJMPAPPGP01 // 10.134.183.70`
3. Open Remote Desktop and type in the Hostname of the Workstation you would like to connect to:
![GC-RemCons-6](../../../../overrides/assets/images/gc-remcons-6.png#centered)
4. Click the `Connect` button.
5. Enter the password for your Admin (adm) account and press `Enter`.
![GC-RemCons-7](../../../../overrides/assets/images/gc-remcons-7.png#centered)
6. Complete the login process as you normally would by authenticating with Cisco Duo.


## Remote Control via MECM

!!! tip "Heads up!"

    Only two Users can be logged into the MECM Server via Remote Desktop at a time so this should be used sparingly.

1. Login to your GovCentral laptop and connect to the VPN.
2. Connect to the GovCentral Production Jump Server via Remote Desktop:
    1. `USNUSJMPAPPGP01 // 10.134.183.70`
3. Connect to the MECM Server via Remote Desktop:
    1. `USNUSGADGOVGP04 // 10.134.184.60`
4. Click on the `Start Menu` and type `config`. You should see `Configuration Manager Console` at the top.
![GC-RemCons-1](../../../../overrides/assets/images/gc-remcons-1.png#centered)
5. Click on `Configuration Manager Console` to open it.
7. Click `Devices` on the left-hand side within the `Assets and Compliance` pane.
8. Enter the Hostname of the Workstation or Laptop you wish to connect to in the `Search current node` box and Enter`:
![GC-RemCons-2](../../../../overrides/assets/images/gc-remcons-2.png#centered)
9. Right-click on the Device, go to `Start` and then click on `Remote control`.
![GC-RemCons-3](../../../../overrides/assets/images/gc-remcons-3.png#centered)
10. A box will pop-up indicating that the connection is being established.
![GC-RemCons-4](../../../../overrides/assets/images/gc-remcons-4.png#centered)
11. You should now see the login screen for the Device. Simply login and do whatever it is that you need to do.
![GC-RemCons-5](../../../../overrides/assets/images/gc-remcons-5.png#centered)