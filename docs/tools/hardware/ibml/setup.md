# Setup

## Windows 10

1. Locate/create a USB drive with a Windows 10 image.
![IBML-Setup-1](../../../overrides/assets/images/ibml-setup-1.png#centered)
2. Insert the USB drive into the front of the Dell Server the IBML utilizes to control the scanner.
    1. Ensure you take the door off on the endcap on the left side.
![IBML-Setup-2](../../../overrides/assets/images/ibml-setup-2.png#centered)
3. Boot the Server up. On boot press F11 for more boot options.
    1. This will allow us to select the USB drive to apply the image.
![IBML-Setup-3](../../../overrides/assets/images/ibml-setup-3.png#centered)
4. Now ensure you choose the `"One Shot UEFI Boot Menu"`. This should boot the system to the USB drive that was inserted.
![IBML-Setup-4](../../../overrides/assets/images/ibml-setup-4.jpg#centered)
5. Choose English as your primary language.
![IBML-Setup-5](../../../overrides/assets/images/ibml-setup-5.jpg#centered)
6. Again, make sure you select English to proceed and click Next.
![IBML-Setup-6](../../../overrides/assets/images/ibml-setup-6.jpg#centered)
7. Now choose Install.
![IBML-Setup-7](../../../overrides/assets/images/ibml-setup-7.jpg#centered)
8. Agree to the Legal Terms of Use for Windows.
![IBML-Setup-8](../../../overrides/assets/images/ibml-setup-8.jpg#centered)
9. Click on the custom install since we do not want the old files on the system.
![IBML-Setup-9](../../../overrides/assets/images/ibml-setup-9.jpg#centered)
10. Now we need to format both drives and ensure nothing is on them. Click on delete on all of the partitions listed.
    1. Remember, these are to run in a RAID configuration, nothing is required for the RAID configuration.
![IBML-Setup-10](../../../overrides/assets/images/ibml-setup-10.jpg#centered)
11. Now it should show as one partition. Click next since now this will be the partition Windows will install on.
![IBML-Setup-11](../../../overrides/assets/images/ibml-setup-11.jpg#centered)
12. Now it should show the install progress.
![IBML-Setup-12](../../../overrides/assets/images/ibml-setup-12.jpg#centered)
13. Now select English again.
![IBML-Setup-13](../../../overrides/assets/images/ibml-setup-13.jpg#centered)
14. Select the United States and click yes.
![IBML-Setup-14](../../../overrides/assets/images/ibml-setup-14.jpg#centered)
15. Select the US keyboard layout.
![IBML-Setup-15](../../../overrides/assets/images/ibml-setup-15.jpg#centered)
16. Click skip for now to the network add. You will eventually join a domain so that's why you do not want to select anything now.
![IBML-Setup-16](../../../overrides/assets/images/ibml-setup-16.jpg#centered)
17. Click no to go back to the connection settings.
![IBML-Setup-17](../../../overrides/assets/images/ibml-setup-17.jpg#centered)
18. Accept the Windows 10 Agreement.
![IBML-Setup-18](../../../overrides/assets/images/ibml-setup-18.jpg#centered)
19. Make sure the name is `“IBML”` in all caps and click next.
![IBML-Setup-19](../../../overrides/assets/images/ibml-setup-19.jpg#centered)
20. Set the password to `“IBML12345”` and click next.
![IBML-Setup-20](../../../overrides/assets/images/ibml-setup-20.jpg#centered)
21. Set all of the hints to `"IBML"` even though Group Policy will disable this.
![IBML-Setup-21](../../../overrides/assets/images/ibml-setup-21.jpg#centered)
22. Click decline to cortana.
![IBML-Setup-22](../../../overrides/assets/images/ibml-setup-22.jpg#centered)
23. Click no to share device activity.
![IBML-Setup-23](../../../overrides/assets/images/ibml-setup-23.jpg#centered)
24. Ensure all services are marked no. This will also change to reflect the Group Policy.
![IBML-Setup-24](../../../overrides/assets/images/ibml-setup-24.jpg#centered)
25. We need to get this machine on the Domain and these next steps will get us on the Iron Mountain network. On the taskbar, click on File Explorer.
![IBML-Setup-25](../../../overrides/assets/images/ibml-setup-25.png#centered)
26. Right-click on `"This PC"` and go to properties.
![IBML-Setup-26](../../../overrides/assets/images/ibml-setup-26.png#centered)
27. Under PC Properties click on Change settings.
![IBML-Setup-27](../../../overrides/assets/images/ibml-setup-27.png#centered)
28. Under the Systems property Tab click on change.
![IBML-Setup-28](../../../overrides/assets/images/ibml-setup-28.png#centered)
29. Make sure the IBML is labeled with the proper naming convention; IE: For a Boyers IBML it is `“USBOPMIBMLP06”`. Now add `“NA.IMTN.COM”` for the Domain under the domain field. It will then ask for username and password. Use your ADM credentials and it should look like this when it is complete.
![IBML-Setup-29](../../../overrides/assets/images/ibml-setup-29.png#centered)
30. Now that this IBML is on the Domain, go to the share drive for your location to pull the IBML install folder. To access this copy and paste the address into the search bar in the task bar and a file explorer window should pop up.
    1. For example, the Boyers server is: `\\10.131.108.17`
    2. Once you are in there select the IBML share.
![IBML-Setup-30](../../../overrides/assets/images/ibml-setup-30.png#centered)
31. Copy the folder labeled `“ibml Software”` and paste it into the `"C: Drive"` of the IBML.
![IBML-Setup-31](../../../overrides/assets/images/ibml-setup-31.png#centered)
32. Should look like this.
![IBML-Setup-32](../../../overrides/assets/images/ibml-setup-32.png#centered)
33. Now in that folder, install `SoftTrac Capture Suite 4.5.3.757`.
    1. Please be aware that the version could be different from the time this was written.
![IBML-Setup-33](../../../overrides/assets/images/ibml-setup-33.png#centered)
34. When you run the Capture Suit install as admin, it may need to install a few additional items so click install as you are prompted.
![IBML-Setup-34](../../../overrides/assets/images/ibml-setup-34.png#centered)
35. Click Next.
![IBML-Setup-35](../../../overrides/assets/images/ibml-setup-35.png#centered)
36. Click finish.
![IBML-Setup-36](../../../overrides/assets/images/ibml-setup-36.png#centered)
37. Install `CaptureSuiteDocnetics 5.7.0.136`.
    1. Please be aware that the version could be different from the time this was written.
![IBML-Setup-37](../../../overrides/assets/images/ibml-setup-37.png#centered)
38. Click Next.
![IBML-Setup-38](../../../overrides/assets/images/ibml-setup-38.png#centered)
39. Click next again and choose Complete setup and click next after.
![IBML-Setup-39](../../../overrides/assets/images/ibml-setup-39.png#centered)
40. Once that is completed install `ImageTrac Manager 6.8.4.227`.
    1. Please be aware that the version could be different from the time this was written.
![IBML-Setup-40](../../../overrides/assets/images/ibml-setup-40.png#centered)
41. Now choose `"ImageTrac Series 6"`. DO NOT USE Series 6 V2!
![IBML-Setup-41](../../../overrides/assets/images/ibml-setup-41.png#centered)
42. Click Install.
![IBML-Setup-42](../../../overrides/assets/images/ibml-setup-42.png#centered)
43. Once finished installing, click finish.
44. Now we need to configure the PC to allow the connection between the IBML and the software. First we will add the static IP to the NIC the IBML is connected to. Down on the taskbar right click on the connection icon to get to the Network and Internet settings.
![IBML-Setup-43](../../../overrides/assets/images/ibml-setup-43.png#centered)
45. Click on adapter options > and you should see 4 NIC’s listed. NIC 2 is the connection to the IBML. NIC 1 is the connection to the Iron Mountain Network.
![IBML-Setup-44](../../../overrides/assets/images/ibml-setup-44.png#centered)
46. Right-click and go to Properties, then click on and go to properties of the IPv4 Settings.
![IBML-Setup-45](../../../overrides/assets/images/ibml-setup-45.png#centered)
47. Ensure you select a static IP Address and enter the following IP, `192.0.2.127`, and Subnet Mask, `255.255.255.0`. Click OK and exit out.
![IBML-Setup-46](../../../overrides/assets/images/ibml-setup-46.png#centered)
48. Next we need to go to the Authentication tab under the NIC 2 properties and uncheck `“Enable IEEE802.1x"`.
    1. If this tab isn't there go to services, and enable `“Wired AutoConfig”` and ensure this Service is running.
![IBML-Setup-47](../../../overrides/assets/images/ibml-setup-47.png#centered)
![IBML-Setup-48](../../../overrides/assets/images/ibml-setup-48.png#centered)
49. Click on the start menu, and search for View Network status and tasks.
![IBML-Setup-49](../../../overrides/assets/images/ibml-setup-49.png#centered)
50. Click on Change adapters settings.
![IBML-Setup-50](../../../overrides/assets/images/ibml-setup-50.png#centered)
51. Right-click on NIC2 and go to properties.
![IBML-Setup-51](../../../overrides/assets/images/ibml-setup-51.png#centered)
52. Once you are in properties click on the configure tab.
![IBML-Setup-52](../../../overrides/assets/images/ibml-setup-52.png#centered)
53. Under the advanced tab scroll to Speed and Duplex. Ensure Speed and Duplex’s value is set to Auto Negotiation.
![IBML-Setup-53](../../../overrides/assets/images/ibml-setup-53.png#centered)
54. Click on the power management tab and ensure the `“Allow the computer to turn off this device to save power”` is unchecked.
![IBML-Setup-54](../../../overrides/assets/images/ibml-setup-54.png#centered)
55. Open a File explorer tab, and right click on this PC and goto properties.
![IBML-Setup-55](../../../overrides/assets/images/ibml-setup-55.png#centered)
56. Now click on advanced system properties.
    1. If this does not show up you can search for advanced system properties and it will come up.
![IBML-Setup-56](../../../overrides/assets/images/ibml-setup-56.png#centered)
57. Click on the Advanced Tab. And click on Environment Variables at the bottom.
![IBML-Setup-57](../../../overrides/assets/images/ibml-setup-57.png#centered)
58. In the Environment variables, click new and add the following variables one at a time.
    1. `IMAGETRAC2_HOSTIP = 192.0.2.127`
    2. `IMAGETRAC2_XPTIP = 192.0.2.2`
    3. `IMAGETRAC2_XPTBROADCAST = 192.0.2.255`
![IBML-Setup-58](../../../overrides/assets/images/ibml-setup-58.png#centered)
59. Go to Control Panel and open up Device Manager. In there you should see an unknown device. Right-click on it and go to Update Driver.
![IBML-Setup-59](../../../overrides/assets/images/ibml-setup-59.png#centered)
60. Click on browse my PC for driver software.
![IBML-Setup-60](../../../overrides/assets/images/ibml-setup-60.png#centered)
61. The Location of the local driver file is the following:
    1. `“C:\Program Files\IBML\SoftTracCaptureSuite\Base\Ise Driver”`
![IBML-Setup-61](../../../overrides/assets/images/ibml-setup-61.png#centered)
62. This is what Device Manager should look like after:
![IBML-Setup-62](../../../overrides/assets/images/ibml-setup-62.png#centered)
63. Load up Capture Suite for the first time and go to Admin Console. You will be prompted for a license. Click on Select License and choose the one inside the `"IBML Software"` folder that was put on the `C: Drive`. Go to the folder labeled `"Lic File - 050622"`. Inside choose `IM_Boyers_SCS.lic` or the file designated to your work center. Once the license is accepted, close out of Capture Suite.
![IBML-Setup-63](../../../overrides/assets/images/ibml-setup-63.png#centered)
64. The proper Hardware parm file for the older IBML’s is `75IPS_200dpi_40SF`.
![IBML-Setup-64](../../../overrides/assets/images/ibml-setup-64.png#centered)
65. The Software File is `75ips ibmladj.prmx`.
    1. Both can be found in the `"IBML software"` folder located on the `C: Drive`.
![IBML-Setup-65](../../../overrides/assets/images/ibml-setup-65.png#centered)
66. Next, open the `ParmSetup Tool`. We will ensure we setup the parm files for the IBML. We will start off with the Software file. Click on the parm file registration button and find the SW file located in the `"IBML software"` folder.
![IBML-Setup-66](../../../overrides/assets/images/ibml-setup-66.png#centered)
67. Click on the hardware files tab. Click on the parm file registration tab again, and find the HW listed above in the IBML software folder and import it.
![IBML-Setup-67](../../../overrides/assets/images/ibml-setup-67.png#centered)
68. Click on the HW file you loaded and click on Store Config.
![IBML-Setup-68](../../../overrides/assets/images/ibml-setup-68.png#centered)
69. Next, go back to the software tab and click on the SW file you loaded. In the top row of options click on advanced. You now need to select the Hardware file Option. (This will link the software file with the Hardware file)
![IBML-Setup-69](../../../overrides/assets/images/ibml-setup-69.png#centered)
70. Click on the Hardware File in the file explorer window.
![IBML-Setup-70](../../../overrides/assets/images/ibml-setup-70.png#centered)
71. You can now close out of the parm setup tool.
72. IMPORTANT: Open Windows Firewall and turn all firewalls to off, if they are not off already.
73. Click on the up arrow on the taskbar and right click on the stop light to get into image server, or click the Start Menu, Navigate to the IBML folder and click on Image server
![IBML-Setup-71](../../../overrides/assets/images/ibml-setup-71.png#centered)
74. The 1 and 2 columns should show ready. Once it shows that, the IBML is all set.
![IBML-Setup-72](../../../overrides/assets/images/ibml-setup-72.png#centered)
75. Make sure this box is checked under the Hardware Parm setup or the Inkjet Printer WILL NOT WORK! And make sure you click `“Store Config”` afterwards.
![IBML-Setup-73](../../../overrides/assets/images/ibml-setup-73.png#centered)
76. Navigate to `“\\10.131.108.17\KC11Setup\CTERAFolderScripts”` and then run `BOPA_GDIT.bat` or the CTERA mapping script appropriate for your location, as an Administrator.


### Troubleshooting

If you see `"overlap error"` in the Soft Parm Menu IJP Layout - this is caused by having 2 IJPs installed. Go to the top of the window and select `"2 of 2"` (if there) and delete. The Overlap Error should go away.

![IBML-Setup-74](../../../overrides/assets/images/ibml-setup-74.png#centered)

#### IJP errors

1. Open the Hardware Parm menu:
    1. If the top box under the IJP setting is `“0”` change it to `“1”`.


#### Optional

1. Open the Software Parm menu:
    1. Select Printer, then under `“Layout”` (see above picture) make sure the top setting is `“1 of 1”` and change the font to something else.
    2. Click the select box to the right of the font line.
    3. Select `“ArialP16.fnt”` for example, and see if that fixes the error. 


## Windows 11

Should be pretty much the same as the Windows 10 installation, but you'll need to adapt the steps to the redesign that Windows 11 has and obviosuly make sure you have the Windows 11 flash drive.