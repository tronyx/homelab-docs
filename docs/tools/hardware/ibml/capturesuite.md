# SoftTrac CaptureSuite

You can find the "Getting Started Guide" for CaptureSuite [HERE](https://drive.google.com/file/d/1fSdSypNBePS53I53LlvsuDfczQNBWGHn/view).


## Adding A User

1. Log into `“Softrac Capture Suite”` under `“Admin”` or someone with Administrator level access. Click on `“Administration Console”`.
![IBML-CaptureSuite-1](../../../overrides/assets/images/ibml-capturesuite-1.png#centered)
2. Click on `“User Admin”` at the top of the window.
![IBML-CaptureSuite-2](../../../overrides/assets/images/ibml-capturesuite-2.png#centered)
3. Click on `“Add”` in the upper, left-hand corner.
![IBML-CaptureSuite-3](../../../overrides/assets/images/ibml-capturesuite-3.png#centered)
4. Change the `“User Login”` and `“Operator Name”` to the user’s Windows login ID you wish to add, then choose which `“Group”` they are to be added to. Standard users should be under `“Operators”`.
![IBML-CaptureSuite-4](../../../overrides/assets/images/ibml-capturesuite-4.png#centered)
5. If using `“One Click Login”` or `“Windows Authentication”` for `“Softtrac Capture Suite”` then nothing else needs changed or added. Click `“OK”` at the bottom. Exit out of the program and the new user will be added.
    1. If you are using `“ibml Database Authentication”` then you will need to click on the password menu and create a default password to be used before hitting `“OK”` and exiting out.

!!! info

    It is important that you use the correct “User Login” and “Operator Name” or scan information will not pull into E2E correctly. Also, these instructions are for new users ONLY. Not for creating groups or linking which jobs are available for which set of groups.


## Migrate Service Account to a Window's Service

