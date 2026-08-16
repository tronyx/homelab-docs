# Cisco Duo

This portion of Cisco Duo is specific to enrolling a User's mobile phone so that they can receive the required approval prompts (push notifications) to connect to the GovCentral VPN on their laptop.

1. Log into the [Duo Security Admin Panel](https://admin-4ffea624.duofederal.com/).
    1. You need special permissions in order to have access to this System.
2. Navigate to `Users` and then `Users` in the left sidebar.
![Duo-Assign-1](../../overrides/assets/images/duo-assign-1.png#center)
2. Search for and then select a user by clicking their username.
![Duo-Assign-2](../../overrides/assets/images/duo-assign-2.png#center)
3. Scroll down to the `Phones` section and click the `Add Phone` button.
![Duo-Phone-Add-1](../../overrides/assets/images/duo-phone-add-1.png#center)
4. Type in the phone number of the device they wish to enroll and click the `Add Phone` button.
![Duo-Phone-Add-2](../../overrides/assets/images/duo-phone-add-2.png#center)
5. You should see a success message. Click the link to `Activate Duo Mobile`.
![Duo-Phone-Add-3](../../overrides/assets/images/duo-phone-add-3.png#center)
6. Set the length of time the activation code will be good for. You need to consider how long, from now, it may take the User to be able to activate Duo and setup their phone. Usually 24 hours is good, but there is no real harm in setting to to 48 or even 72 hours. Once you have the expiration set, click the `Generate Duo Mobile Activation Code` button.
![Duo-Phone-Add-4](../../overrides/assets/images/duo-phone-add-4.png#center)
7. Tghe next step is to send the User an e-mail. All of the defaults here are just fine and there is no need to change anything. Just scroll down and click the `Send instructions by email` button at the bottom of the page.
![Duo-Phone-Add-5](../../overrides/assets/images/duo-phone-add-5.png#center)
8. You should see a success message. Now the User just needs to follow the instructions sent to them in the email and they should be good to go.
    <!-- markdownlint-disable MD033 -->
    <div class="admonition info">
    <p class="admonition-title">Heads up!</p>
        The next steps are for users with a STND (Standard) or ADM (Admin) account.
    </div>
    <!-- markdownlint-enable MD033 -->
9. Once the user has enrolled their phone in Duo you will need to attach their `STND_` or `ADM_` account to it so they can use it to authenticate that account.
10. Hover over `Devices` and select `Phones`.
![Duo-Phone-Add-6](../../overrides/assets/images/duo-phone-add-6.png#center)
11. In the search box, type in the phone number for the user's phone. It should automatically search for it. Click on the link for the number.
![Duo-Phone-Add-7](../../overrides/assets/images/duo-phone-add-7.png#center)
12. Click on the link to `Attach a user`.
![Duo-Phone-Add-8](../../overrides/assets/images/duo-phone-add-8.png#center)
13. Start typing in the user's `STND_` or `ADM_` account until you see the correct one. Click it, and then click the `Attach` button.
![Duo-Phone-Add-9](../../overrides/assets/images/duo-phone-add-9.png#center)
14. You should see a success message and that both accounts are now shown as attached to the phone.
![Duo-Phone-Add-10](../../overrides/assets/images/duo-phone-add-10.png#center)