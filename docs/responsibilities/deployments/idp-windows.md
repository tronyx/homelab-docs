# Windows IDP Deployments

This will not always need to be done in conjunction with a Linux IDP Deployment and will sometimes be done on its own. Please check with the Linux team before the meeting to find out if there is also a “pipeline” deployment happening along with the Linux deployment. If so make sure you log in at least 30 mins to an hour early to stop the `IM Integration Modules` Services.

1. Log into `USROYMKX11AP11` and `USROYMKX11AP12`. `AP11` is used to stop and stop the Services, and `AP12` is used for the actual deployment.
2. Go ahead and stop the services on `USROYMKX11AP11` using the `Stop Services.ps1` Powershell script found within the following location:
    1. `C:\temp\Weekly Reboot Powershell`
        1. Right-click on the file and click on `Edit` and it should open up a Powershell window for you to run it manually so you can see the output.
![IDP-Windows-1](../../overrides/assets/images/idp-windows-1.png#center)
3. Once the meeting for the deployment starts the Linux and Dev teams will start doing some testing on their end. Once testing is complete they should give you a directory path for the files that need to be deployed.
4. From `USROYMKX11AP12`, open File Explorer and navigate to the `C:\TEMP\irm` folder and open the text file `IRS_Deployment CMD` in Notepad++. Once open you’ll need to do a `Find and replace` (Ctrl+H) on the directory path located in the file with the new one given:
![IDP-Windows-2](../../overrides/assets/images/idp-windows-2.png#center)
![IDP-Windows-3](../../overrides/assets/images/idp-windows-3.png#center)
![IDP-Windows-4](../../overrides/assets/images/idp-windows-4.png#center)
5. Now confirm all services have been stopped with the `Service Check.ps1` Powershell script which is also located in the `C:\temp\Weekly Reboot Powershell` directory. If some of the Services still show as `StopPending` that indicates that those Servers are still processing Batches and the Service will not stop until the currently processing Batch finishes. You can check Batch Manager and filter by queue and check the IM30 and IM3 queues to see anything that is `In Progress`. Once all of the Services have stopped, open up an elevated Command Prompt and copy and paste the `xcopy` commands into the Command Prompt window and let it run through. There are other commands listed in the `IRS_Deployment CMD` file, but more often than not, you'll only be running the `xcopy` commands.
![IDP-Windows-5](../../overrides/assets/images/idp-windows-5.png#center)
6. After that is finished, without errors, go ahead and start the Services up again by using the `Start Services.ps1` Powershell script, also located in the `C:\temp\Weekly Reboot Powershell` directory. You will, once again, want to right-click and click `Edit` to open it in the Powershell IDE:
![IDP-Windows-6](../../overrides/assets/images/idp-windows-6.png#center)