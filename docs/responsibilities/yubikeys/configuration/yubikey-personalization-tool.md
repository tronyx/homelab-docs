# YubiKey Personalization Tool

!!! warning

    YubiKey Personalization Tool will reach its End of Life on February 19, 2026. If you already have the application installed you will still be able to continue to use it, but it will no longer be supported once it goes EoL.

The [YubiKey Personalization Tool](https://www.yubico.com/products/services-software/download/yubikey-personalization-tools/) is no longer actively updated or maintained by Yubico. Consider updating to the [YubiKey Manager](https://www.yubico.com/products/services-software/download/yubikey-manager/) instead and following [these instructions](https://duo.com/docs/yubikey#using-yubikey-manager).

Every time you open the Yubico OTP tab, it generates a new "Public Identity", "Private Identity", and "Secret Key", but these are not written to the token unless you actually click Write Configuration. There is no way to read your existing "Public Identity", "Private Identity", and "Secret Key" off the token once it has been written.

To create or overwrite a YubiKey slot's configuration:

1. Start the YubiKey Personalization Tool.
2. Insert the YubiKey into a USB port.
3. Wait for the Personalization Tool to recognize the YubiKey.
4. Click Yubico OTP Mode in the main tool window, or Yubico OTP at the top-left.
![YubiKey-Personalization-Tool-1](../../../overrides/assets/images/yubikey-personalization-tool-1.png#center)
5. Click Advanced on the "Program in Yubico OTP mode" page.
6. Select "Configuration Slot 1". If you are only performing this with one key, you can skip to Step 9.
7. Select "Program Multiple YubiKeys".
8. Select "Automatically program YubiKeys when inserted".
9. Click Generate for all 3 items here; Public Identity, Private Identity, and Secret Key.
11. Click Write Configuration.
![YubiKey-Personalization-Tool-2](../../../overrides/assets/images/yubikey-personalization-tool-2.png#center)
12. You will be prompted to specify a CSV file for the confiturations of each of the YubiKeys to be saved to. Pick a location and name that will be easy for you to remember.
13. If you are programming a single YubiKey, you are now done and can remove the key. If you are prgramming more than one, now is when you will remove the first YubiKey and insert the next one.
14. The new configuration is automatically written to the next key you inserted.
15. Repeat Steps 13 and 14 until you are done.
16. When you are finished, click Stop.
17. You can now retrieve the configuration information for all of the keys from the CSV file you specified in Step 12.

You will need the Serial Number (in decimal format), Private Identity, and Secret Key to add the YubiKey to your Duo account. You may also want to save this information, along with the Public Identity, somewhere safe since you will need them if you use this Yubico OTP credential with other services in the future.

There is no need to click Upload to Yubico. Enabling this uploads the new configuration to Yubico's YubiCloud OTP validation service. Duo confirms the passcodes generated independently of Yubico's service. However, you may upload the configuration if you wish to also use YubiCloud OTP to authenticate to services other than Duo.