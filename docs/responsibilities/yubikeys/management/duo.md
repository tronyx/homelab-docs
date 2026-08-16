# Cisco Duo

YubiKeys can be used in conjunction with Cisco Duo for application and device authentication. We, specifically, will be using it as a form of authentication for logging into any device within the Government Central network.


## Adding the Token into the Duo Admin Panel

Before you can assign a Hardware Token to a User, you need to add the Hardware Token into the Duo Security Admin Panel:

1. Log into the [Duo Security Admin Panel](https://admin-4ffea624.duofederal.com/).
    1. You need special permissions in order to have access to this System.
2. Go to `Devices` and then `Hardware Tokens`.
![Duo-Import-1](../../../overrides/assets/images/duo-import-1.png#center)
3. Click the `Import Hardware Tokens` button.
![Duo-Import-2](../../../overrides/assets/images/duo-import-2.png#center)
4. Select `YubiKey AES` from the drop-down.
5. Enter the YubiKey's `Public ID` (usually the Serial #), `Private ID`, and `Secret key` values from the configuration tool you used to program the Key(s) into the CSV token data text box, separated by commas.
6. The YubiKey OTP information should look something like this after you paste it into the text box:
    1. `01231337,0c87995578ee,a4d093a9bd09e124e917b6720356a13b`
    2. If you wish to import multiple YubiKey OTP tokens, enter each token's information on a new line.
7. Click `Import Hardware Tokens` to create the YubiKey tokens in Duo.
![Duo-Import-3](../../../overrides/assets/images/duo-import-3.png#center)


## Assigning a YubiKey

After importing your YubiKey OTP tokens into Duo you can assign them to users for Duo-protected application logins, or to Duo administrators for use when logging into the Duo Admin Panel.

!!! tip

    A hardware token may be assigned to multiple end users, and a given Duo user can be associated with up to 100 hardware tokens.


### Assigning to a User

To assign a Key to a User:

1. Navigate to `Users` and then `Users` in the left sidebar.
![Duo-Assign-1](../../../overrides/assets/images/duo-assign-1.png#center)
2. Search for and then select a user by clicking their username.
![Duo-Assign-2](../../../overrides/assets/images/duo-assign-2.png#center)
3. Scroll down to the `Hardware Tokens` table on the User's properties page and then click the `Add Hardware Token` button.
![Duo-Assign-2](../../../overrides/assets/images/duo-assign-3.png#center)
4. Click the drop-down menu to see a list of available tokens. You can also search for a token by typing in the serial number. Click a token to select it, and then click `Attach`.
![Duo-Assign-4](../../../overrides/assets/images/duo-assign-4.png#center)
5. The User's properties page now lists the newly added token.
![Duo-Assign-5](../../../overrides/assets/images/duo-assign-5.png#center)


### Assigning to a Hardware Token

Hardware Tokens can also be associated with users from the token's properties page:

1. Navigate to `Devices` and then `Hardware Tokens` on the left sidebar.
![Duo-Import-1](../../../overrides/assets/images/duo-import-1.png#center)
2. Click on the serial number of a token to access the token's properties page.
![Duo-Assign-6](../../../overrides/assets/images/duo-assign-6.png#center)
3. On the token's properties page, scroll down to the `Users` table and click the `Attach User` button.
![Duo-Assign-7](../../../overrides/assets/images/duo-assign-7.png#center)
4. Select a User from the drop-down list and click `Attach`.
![Duo-Assign-8](../../../overrides/assets/images/duo-assign-8.png#center)
5. The token's properties page now lists the attached User.
![Duo-Assign-9](../../../overrides/assets/images/duo-assign-9.png#center)


## Removing a YubiKey

If a User leaves Iron Mountain or, in the likely event that a User loses their YubiKey, you will need to remove the key from their account.


### Removing from a User

To assign a YubiKey to a User:

1. Navigate to `Users` and then `Users` in the left sidebar:
![Duo-Assign-1](../../../overrides/assets/images/duo-assign-1.png#center)
2. Search for and then select a User by clicking their username:
![Duo-Assign-2](../../../overrides/assets/images/duo-assign-2.png#center)
3. Scroll down to the `Hardware Tokens` table on the User's properties page and click the delete button, which is a little trash can icon:
![Duo-Remove-1](../../../overrides/assets/images/duo-remove-1.png#center)
4. A pop-up will appear asking you to confirm the removal:
![Duo-Remove-2](../../../overrides/assets/images/duo-remove-2.png#center)
5. The User's properties page no longer lists the removed token:
![Duo-Remove-3](../../../overrides/assets/images/duo-remove-3.png#center)


### Removing from a Hardware Token

Users can also be removed from a Hardware Token from the token's properties page:

1. Navigate to `Devices` and then `Hardware Tokens` on the left sidebar:
![Duo-Import-1](../../../overrides/assets/images/duo-import-1.png#center)
2. Search for and then click on the serial number of a token to access the token's properties page:
![Duo-Remove-4](../../../overrides/assets/images/duo-remove-4.png#center)
3. On the token's properties page, scroll down to the `Users` table and click the delete button, which is a little trash can icon, to the right of the user:
![Duo-Remove-5](../../../overrides/assets/images/duo-remove-5.png#center)
4. There is no confirmation pop-up when you remove a User from a hardware token, just a successful message:
![Duo-Remove-6](../../../overrides/assets/images/duo-remove-6.png#center)