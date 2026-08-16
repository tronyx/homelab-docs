# Troubleshooting

## Restarting PostScan Services

For this example, we are going to use the Royersford FISMA IRA Postscan Servers. The list of Servers will vary depending on the Site and/or Project. Sometimes the Postscan Services get a little wonky and need to be restarted.

1. Login to one of the corresponding Postscan Servers:
    1. `USROYMKXAP12`
    2. `USROYMKXAP13`
    3. `USROYMKXAP15`
    4. `USROYMKXAP17`
2. Launch `ibml CaptureSuite`.
3. Click on `Administration Console`:
![PostScan-Restarts-2](../../../overrides/assets/images/postscan-restarts-2.png#centered)
4. Click on `PostScan Admin` at the top:
![PostScan-Restarts-3](../../../overrides/assets/images/postscan-restarts-3.png#centered)
5. Click on the `Clients` tab:
![PostScan-Restarts-4](../../../overrides/assets/images/postscan-restarts-4.png#centered)
6. Depending on the issue, you can select which PostScan Server you'd like to stop and start the Service on or you can click on `Stop All` at the top to stop them all, wait a minute, and then click `Start All` to start them all back up.


## Camera Calibration

Here's how to calibrate the front and rear cameras on an IBML scanner:

1. Log into the scanner.
2. **Very Important** – Wipe the glass clean on both the front and rear cameras.
3. You will need white calibration sheets. 
4. On the Desktop, click on the Capture Suite Parmfile icon.
5. Select Hardware Parm File.
6. Select Utilities.
7. Select Camera Utility.
8. **Very Important** - DO NOT select Factory Calibration. Select Routine Calibration.
9. Hit Next.
10. Hit Next.
11. Select Front Camera.
12. Select Visible Light.
13. Hit Next.
14. Select Handfeed.
15. Diagnostics will be performed.
16. Wait for screen to say “Waiting For Hand Feed”.
17. Place white calibration sheet on the belt.
18. Select OK when the calibration sheet has been scanned.
19. Hit next.
20. Select Create and Upload Profile.
21. Click OK.
22. Click Finish.
23. Perform Steps 6-20, but select Rear Camera for Step 10 this time.


## Authentication Error

In some rare circumstances a User could get an authentication error, as seen below, when trying to open CaptureSuite:

![Capturesuite-Auth-Error-1](../../../overrides/assets/images/capturesuite-auth-error-1.png#centered)

The typical cause of this is if someone force-closed the app or it crashed during the login process.

In order to resolve this issue, you will need to do the following:

1. Delete the `IBMLAuthenticationConfig.dat` file which is located in the following directory:
    1. `C:\ProgramData\ibml\SoftTracCaptureSuite\SCS 4\`
![Capturesuite-Auth-Error-2](../../../overrides/assets/images/capturesuite-auth-error-2.png#centered)
2. Now, CaptureSuite will need to re-esablish its connection with the respective Kofax Database.
    1. Select the corresponding Server and Database for the environment from the drop-down menus.
![Capturesuite-Auth-Error-3](../../../overrides/assets/images/capturesuite-auth-error-3.png#centered)
3. Now Operations should be able to relaunch CaptureSuite and login as they normally would.