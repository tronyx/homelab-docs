# US Fed Okta // HITL

This setup is mostly for the Operations Teams that utilize their YubiKeys as a form of authentication for the HITL (Human In The Loop) application that is part of the DXP project. We do not manage any aspect of this setup and it should be completed as part of the User's onboarding process.


## HITL New User Request

New users will need an account created and setup for them within HITL and you will need to submit an IMGS/GovCerntral SNOW ticket to do so.

1. Log into IMGS SNOW. All requests need to go through IMGS SNOW, not Commercial SNOW.
2. In the service Catalog, select `"Access User Request - New"`.
![HITL-1](../../../overrides/assets/images/hitl-1.png#centered)
3. Complete template:
    1. If only one user needs to be requested, answer all the questions on the template and submit.
    2. If multiple users need set up, use this template:
        1. [FedRAMP Tickets Template](https://docs.google.com/spreadsheets/d/1cmrna1MW-HzPfJ_ld3qNvxN4ZBvJZT8TuBcCvHOZP44/edit?gid=1559560358#gid=1559560358)
    3. Always put the environment in the subject line, IE: `"FedRAMP Moderate"` or `"FedRAMP Prod"`.
    4. Always specify if the user(s) need `STAGE`, `PROD`, or `Both`.
    5. Specify exactly what they need. New users will need Okta Activated, HITL, and possibly Google Looker. If they need Google Looker dashboards, requests to add that need `DXP ANALYZER` and `DXP STATUS CHECKER` profiles.
    6. The template has all options in columns and you can put `“yes”` to any option that applies	
    7. Click `“Order Now”`.
![HITL-2](../../../overrides/assets/images/hitl-2.png#centered)


## Initial YubiKey Setup

This guide provides comprehensive instructions for setting up Okta with YubiKey authentication to enable Human-in-the-Loop (HITL) connectivity. It covers initial setup, daily usage, troubleshooting, and best practices to ensure secure and efficient operations. The process consists of two parts; the first part is activating the user's Okta account and configuring it to work with their YubiKey and the second part is for establishing HITL connectivity using the YubiKey.

!!! info

    The YubiKey is a hardware authentication device that provides strong, multi-factor authentication, including biometric recognition. Combined with Okta for identity management and HITL connectivity, it ensures secure and controlled access to critical systems and data, requiring human verification at key stages.


### Okta

Before using your YubiKey for Okta authentication, you need to perform an initial setup.

1. First, login to your corporate computer device (laptop or desktop) as you usually do.  This is an important step to complete as the account activation expires after 7 days of you receiving the email.
    1. Open your Iron Mountain e-mail and search your inbox or spam folder for an `"Okta Activation Email"`. It will look like this:
![Okta-Setup-1](../../../overrides/assets/images/okta-setup-1.png#centered)
    2. If you don’t find this activation email, please reach out to `Denise Aker`, `Kaitlin Olivieri`, `Joseph Bruno`, or `Mohan Chandra Kambara` and don’t proceed to further steps. If you have found this activation email, proceed to the next step.
    3. Your username is listed in the email, IE: `FirstName.LastName@usfed.ironmountain.com`. This email is not the same as your regular Iron Mountain email. Remember there is usfed in the email address for this activation.
    4. Click on the Activate Okta Account button in the email.
    5. You will be redirected to `https://imgs-okta.ironmountain.com/` for Okta activation. The screen looks like this:
![Okta-Setup-2](../../../overrides/assets/images/okta-setup-2.png#centered)
    6. Type in your email address or username in the activation email that ends with usfed.ironmountain.com
    7. You will be prompted to set up a password of at least 16 characters and proceed to set up the password and remember to enter it later.
![Okta-Setup-3](../../../overrides/assets/images/okta-setup-3.png#centered)
2. Insert your YubiKey into an available USB port on your computer.
3. When prompted, select `"YubiKey"` or `"External Security Key"` as your authentication method.
![Okta-Setup-4](../../../overrides/assets/images/okta-setup-4.png#centered)
4. Okta will guide you through the registration process. You may be asked to touch your YubiKey's sensor for verification.
![Okta-Setup-5](../../../overrides/assets/images/okta-setup-5.png#centered)
![Okta-Setup-6](../../../overrides/assets/images/okta-setup-6.png#centered)
![Okta-Setup-7](../../../overrides/assets/images/okta-setup-7.png#centered)
5. Once successfully enrolled, your YubiKey will appear as a registered security key in your Okta security settings. Once logged in, it should look like the screen below:
![Okta-Setup-8](../../../overrides/assets/images/okta-setup-8.png#centered)
6. Click on the top right corner down arrow where your name is listed. Select Settings -> Security Methods, you should see that the YubiKey is registered in Security Key or Biometric Authenticator:
![Okta-Setup-9](../../../overrides/assets/images/okta-setup-9.png#centered)


### HITL

YubiKey biometric authentication plays a crucial role in securing HITL connectivity by providing a robust second factor for authentication, ensuring that only authorized personnel can initiate or approve critical operations.

When connecting to systems requiring HITL verification, your YubiKey will be prompted for biometric authentication.

1. Attempt to access the HITL-protected system or initiate an action that requires HITL verification.
2. Go to the IRS workstation where you usually work, take your YubiKey with you, and don’t insert it into the USB port until you're ready to authenticate.
3. Open Chrome web browser and go to `https://insight10114-21.ironmountain-dxp.com/`. The screen should look like below. There is a pre-production server, and later you will have to repeat the same steps to access production.
![HITL-Setup-1](../../../overrides/assets/images/hitl-setup-1.png#centered)
4. Click on Acknowledge, enter your username (email address in your activation email that ends in `usfed.ironmountain.com`), and select the company as `IRM`.
5. Type in your password, which you set up previously while activating your username/email in Okta.
6. Okta will prompt you for authentication. If your YubiKey is configured as a primary or secondary factor, you will be prompted to use it.
7. Insert your YubiKey into an available USB port and wait for a few seconds. Gently touch the brass sensor on your YubiKey when prompted. This action verifies you are a person as the little brass sensor is capacitive like your phone screen. It simply recognizes that you are a human and does not do anything with your fingerprint.
8. Upon successful verification through Okta, your access will be granted, or the action will proceed. After logging into HITL, the screen will display like this:
![HITL-Setup-2](../../../overrides/assets/images/hitl-setup-2.png#centered)
9. You are now successfully authenticated and logged into DXP and HITL. Now, navigate to the HITL screen by clicking on the settings like this.
![HITL-Setup-3](../../../overrides/assets/images/hitl-setup-3.png#centered)
10. Click on the dropdown arrow next to InSight logo and select All Companies (0), and the screen will look like this below.
![HITL-Setup-4](../../../overrides/assets/images/hitl-setup-4.png#centered)
11. Click on the HITL button; you will not see the IDP button. The screen will look like this:
![HITL-Setup-5](../../../overrides/assets/images/hitl-setup-5.png#centered)
12. Repeat the same steps above for Production HITL connectivity.
    1. The URL for Production HITL is: `https://insight10115.ironmountain-dxp.com/`


## Common Issues

| Issue | Possible Cause | Solution |
| ===== | ============== | ======== |
| YubiKey not recognized | Loose connection, driver issue | Re-insert the YubiKey, try another USB port, restart the computer, and update USB drivers. |
| Touch not recognized | Incorrect finger placement, dirty sensor | Ensure your finger is clean and dry. Place your entire finger pad on the sensor. |
| Okta authentication failure | Incorrect configuration, expired credentials | Verify YubiKey enrollment in Okta. Ensure your Okta account is active. Contact IT support if the issue persists. |
| Slow response | System overload, network latency | Check system resources, verify network connection stability. |


### Okta Password Reset

If a member of the Operations Team forgets their U.S. Fed Okta password, their Supervisor will need to open a ticket within IMGS\\GovCentral SNOW to have it reset.

1. Browse to [IMGS ServiceNow](https://ironmountainfed.servicenowservices.com/now/sow/home).
2. Sign in with your IMGS\\GovCentral Snow Credentials.
3. You should get a Duo Push notification on your phone to confirm sign in, but you may have to just enter the provide code from Duo.
4. In the `“All”` drop-down menu in the top left of the screen, select `“Service Catalog”`.
5. Select the option `“Insight DXP/Access Request - Update”`.
    1. This is currently the only spot where both the Okta Support Team and the Security Team can see the tickets.
![Okta-Password-Reset-2](../../../overrides/assets/images/okta-2.png#centered)
6. Enter the necessary information for the user and include this template in the description.
    1. `“User needs Okta password reset for HITL Access - Please reset”`
        1. Then, also provide the User’s ironmountain.com email address, IE: john.doe@ironmountain.com.
    2. Password resets are only active for one hour, if the user doesn’t come in until later, either specify in the ticket or communicate with whoever is assigned the ticket to inform them of the timeframe.
![Okta-Password-Reset-1](../../../overrides/assets/images/okta-1.png#centered)
7. Once ticket is checked for accuracy and all of the provided information is correct, select `“Order Now”` on the right side of the screen.
8. You will be brought to a screen that provides a `“REQ”` number. Click the REQ# link to take you to the ticket.
    1. You should see the following screen after viewing the REQ.
![Okta-Password-Reset-3](../../../overrides/assets/images/okta-3.png#centered)
9. Locate the `“RITM”` number and send it to someone from the Okta Team for visibility. Typically these folks are available to help:
    1. Wilson Li
    2. Joe Chow
    3. Bob Syzmanski


## Best Practices

- **Keep YubiKey Secure:** Treat your YubiKey like a physical key to sensitive systems. Do not leave it unattended or lend it to others.
- **Backup Authentication:** Ensure you have alternative authentication methods configured in Okta (e.g., Okta Verify, SMS) in case your YubiKey is lost or damaged.
- **Regular Updates:** Keep your YubiKey firmware and associated software (e.g., YubiKey Manager) updated to benefit from the latest security features and bug fixes. [^1]

[^1]: This is for EIT only.