# Setting up the Event Logger

1. Browse to `C:\Users\Public Desktop`.
    1. If you can't find the Public Desktop folder go to Folder Options and select Show hidden Files. Folders, and Options and Select show hidden files, folders, and Drives. This should make the folder appear.
2. Right-click on the desktop scanner (Falcon, AS7200, 05220, etc.) and select Properties.
2. In the target field at the end of the `.exe` put a space and type `-logger_ auto_ multi` and then click `"Apply"`.
3. Browse to `C:\OPEX\SCAN\ Tools` and rename the `"Applauncher"` folder to `"Applauncher1"`. You'll need to inform the Operators that CertainScan won't automatically load when they log onto Windows and that they will have to double-click on the desktop shortcut to launch it.
4. Now when CertainScan is started it will automatically start the logger and when CertainScan is closed or crashes the logger stops and save the logs to `C:\OPEX\Eventlogger`.