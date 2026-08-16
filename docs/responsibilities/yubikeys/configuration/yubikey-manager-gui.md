# YubiKey Manager GUI

!!! warning

    YubiKey Manager GUI will reach its End of Life on February 19, 2026. If you already have the application installed you will still be able to continue to use it, but it will no longer be supported once it goes EoL.

First, download and install the [YubiKey Manager](https://www.yubico.com/products/services-software/download/yubikey-manager/).

When you open the Yubico OTP settings (under Applications), you may generate a new "Public ID", "Private ID", and/or "Secret Key", but these are not written to the token unless you actually click the Finish button. There is no way to read your existing "Public ID" (if you did not use the device serial), "Private ID", and "Secret Key" information off the token once it has been written.

To create or overwrite a YubiKey slot's configuration:

1. Insert the YubiKey into a USB port.
2. Start the YubiKey Manager.
3. Wait for the YubiKey Manager to recognize your YubiKey. You'll see the YubiKey model, firmware version, and serial number shown in the application.
4. Click Applications → OTP.
![YubiKey-Manager-GUI-1](../../../overrides/assets/images/yubikey-manager-gui-1.png#center)
5. Click the Configure button for slot 1.
6. Keep Yubico OTP selected on the "Select Credential Type" screen and click Next.
7. Check the Use serial box for "Public ID" (recommended).
8. Click the Generate buttons to create a new "Private ID" and "Secret key".
9. Click Finish to update the OTP information for the selected slot.

There is no need to check the Upload option. Enabling this uploads the new configuration to Yubico's YubiCloud OTP validation service. Duo confirms the passcodes generated independently of Yubico's service. However, you may upload the configuration if you wish to also use YubiCloud OTP to authenticate to services other than Duo.

![YubiKey-Manager-GUI-1](../../../overrides/assets/images/yubikey-manager-gui-2.png#center)

You will need the Public ID (which is the token serial number if you checked the "Use serial" box earlier), Private ID, and Secret key to add the YubiKey to your Duo account. You may also want to save this information, along with the Public Identity, somewhere safe since you will need them if you use this YubiKey with other services in the future.