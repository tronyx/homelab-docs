# IMGS/GovCentral Okta

Iron Mountain utilizes a cloud hosted FedRAMP instance of Okta (IMGS/GovCentral Okta) for managing access to the HITL/DXP/Insight application. This works with HITL as a secondary form of authentication and also utilizes a YubiKey for additional security.

You can access the Dashboard, assuming you've been granted access, [HERE](https://irm-us-imgs-prod-admin.okta-gov.com/admin/dashboard).


## User Management

One of our responsibilities is managing users within this Okta instance. Creating accounts, resetting passwords, deactivating accounts, etc.


### Creating Accounts

When a new user is onboarded an account will need to be created for them. You can do so following the steps outlined below.

1. Login to the FedRAMP Okta instance [HERE](https://irm-us-imgs-prod-admin.okta-gov.com/admin/dashboard).
    1. This requires special access which you may or may not have. Check with your Lead/Manager if you're not sure.
2. CLick on `Directory` and then `People`.
![IMGS-Okta-Add-User-1](../../overrides/assets/images/imgs-okta-add-user-1.png#centered)
3. Click on the `Add person` button.
![IMGS-Okta-Add-User-2](../../overrides/assets/images/imgs-okta-add-user-2.png#centered)
4. A pop-up will open for you to enter all of the information for the new user. The information should be provided in the New User GovSNOW ticket.
    1. It is absolutely IMPERATIVE that you use the `@USFED.ironmountain.com` e-mail address for the Username.
        1. When you type in this box, it automatically enters the EXACT same thing into the `Primary email` box beneath it. Make sure you follow the next step.
    2. It is absolutely IMPERATIVE that you use the `@ironmountain.com` e-mail address for the `Primary email`. Since what you type in the `Username` box gets copied into the `Primary email` box, you will need to make sure you remove the `usfed.` portion.
    3. For the `Groups` you will enter:
        1. `IRS-IMGS-DXP-HITL-USERS`
    4. When done, click the `Save` button.
![IMGS-Okta-Add-User-3](../../overrides/assets/images/imgs-okta-add-user-3.png#centered)
5. You will see a green success message that the user was created.
6. The user should receive an e-mail to activate their account, which you can see more information about [HERE](https://na-dms-itar-eit-mkdocs-2156f1.gitlab.io/responsibilities/yubikeys/management/okta/#okta).


### Resetting A Password

Users forget a lot of things, their passwords being one of the biggest. Here's how to initiate a password reset for IMGS Okta if someone forgets theirs.

1. Login to the FedRAMP Okta instance [HERE](https://irm-us-imgs-prod-admin.okta-gov.com/admin/dashboard).
    1. This requires special access which you may or may not have. Check with your Lead/Manager if you're not sure.
2. CLick on `Directory` and then `People`.
![IMGS-Okta-Add-User-1](../../overrides/assets/images/imgs-okta-add-user-1.png#centered)
3. In the search box, type in the first or last name of the user you're looking to reset, then press `Enter`. When you find them, click on their name.
![IMGS-Okta-Password-Reset-1](../../overrides/assets/images/imgs-okta-password-reset-1.png#centered)
4. Click on the `Reset or Remove password` button.
![IMGS-Okta-Password-Reset-2](../../overrides/assets/images/imgs-okta-password-reset-2.png#centered)
5. You have two options at this point (I've only really had luck with the e-mail method):
    1. Leave the default option for `Send a reset password email` selected:
![IMGS-Okta-Password-Reset-3](../../overrides/assets/images/imgs-okta-password-reset-3.png#centered)
        1. This sends an e-mail with a link to reset their password.
    2. Select the option to `Create a temporary password`:
        1. This will provide you with a temporary password that the user can login with and they will then be prompted to change their password.
![IMGS-Okta-Password-Reset-4](../../overrides/assets/images/imgs-okta-password-reset-4.png#centered)
    3. Click the red `Reset password` button.


### Deactivating An Account



#### Removing A YubiKey