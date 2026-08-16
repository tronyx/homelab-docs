# Configuration

Each YubiKey with OTP support has two slots. The first slot is used to generate the passcode when the YubiKey is touched for between 0.3 and 1.5 seconds and released. The second slot is used if the button is touched between 2 and 5 seconds. When the YubiKey is shipped its first configuration slot is factory programmed for the "Works with YubiKey" YubiCloud OTP service and the second configuration slot is blank.

## Preparation

YubiKeys need to be prepared for use with Cisco Duo BEFORE they can be assigned to a user and setup within Okta for use with HITL. This preparation generates and writes a YubiOTP configuration to Slot 1 (short press) on the YubiKey. This process ERASES any existing configuration that is tied to Slot 1 on the YubiKey, which is why it needs to be done first.

The configuration is made up of a Public ID, a Private ID, and a Secret (AES) Key. These items, along with the Serial # of the YubiKey, are used to create a string that is then imported into the [Cisco Duo Administration Console](https://admin-4ffea624.duofederal.com/login?next=%2F) and assigned to the corresponding User Account.

The string that is created will end up looking like this:

```shell
    Serial_Number,Private_ID,Secrety_Key
    10209345,heq4w6idsla6,klma9197mj9kfdlvijz3biwolopmt5lm
```

!!! warning

    It is VERY, VERY important that you keep the YubiKeys in order when performing the configuration work. The corresponding Private ID and Secret Key that get generated and then written to the YubiKey HAVE to be matched up to the correct YubiKey.

!!! tip

    Take 5 or 10 keys and lay them out on your desk. Input the Serial Numbers into the corresponding Site sheet on the [YubiKey Cisco Duo Assignments](https://docs.google.com/spreadsheets/d/1wFMFn4RWxOvtct0n9iJSgVjn7AM5tqkUbm_JR11tyy4/edit?gid=59972332#gid=59972332) spreadsheet. Making sure you keep them in order, you can then configure them for use with Cisco Duo as outlined below. The exported/saved data (Private ID and Secret Key) from the below methods will then need to be added to the same spreadsheet with the corresponding Serial Number. A 3rd column is then automatically populated which is the token that is imported into Cisco Duo.

This preparation can be done in one of four different ways.