# Miscellaneous Responsibilities

## Restaging SLMO Boxes

Several times a week we will receive an e-mail from the folks at SLMO stating that a Box has not been received and if we can please restage it. Something like this:

```text
We have the following box that did not get received:

M0000080419

Could someone please manually restage the box? Thank you in advance!
```

It is a simple fix and the steps are outlined below:

1. Login to the FISMA Jump Server.
2. Open up mRemoteNG and connect to the following Server:
    1. `USSTLHMKX11AP02` - It is located in the `FISMA`, then `GDIT - SLMO` folder of the mRemoteNG connections.
3. On the Desktop you will see the following Batch (BAT) script:
    1. `Rename ERR files HAMO and SLMO`
4. Right-click on the script and select `Edit`.
5. The Windows Powershell ISE will launch.
6. Click the little, green play button on the bar at the top to run the script.
    1. The output pane should look like this:
        1. ` PS C:\Users\adm_cyocum\Desktop> C:\Users\Public\Desktop\Rename ERR files HAMO and SLMO.ps1`
7. Once the script is done running, it will drop to a new, blank prompt.
8. Reply back to the e-mail that you've manually restaged the box.

![Restage-SLMO-Box-1](../overrides/assets/images/restage-slmo-box-1.png#center)