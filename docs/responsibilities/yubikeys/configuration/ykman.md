# Chris' YubiKey Configurator Bash Script

Chris took it upon himself to write a Bash script wrapper for the official [YubiKey Manager CLI](https://docs.yubico.com/software/yubikey/tools/ykman/intro.html) utility to generate and write the required configuration to YubiKeys. Rather than using an old Windows laptop that each User had to have the YubiKey Personalization Tool installed for, the script can be ran right from a Macbook from within the Terminal.

It works in a similar fashion to the YubiKey Personalization Tool and lets you configure multiple YubiKeys one after another, saving all of the configuration data to a CSV file so that it can be easily imorted into the Cisco Duo Administration Console.

!!! info

    This script requires the YubiKey Manager CLI to be installed. If you do not have it installed, the script will fail. You can find the installation instructions here: https://github.com/Yubico/yubikey-manager?tab=readme-ov-file#pre-built-packages

    Just download the PKG file and run it to install the utility.


```shell title="YubiKey-Configurator.sh"

#!/usr/bin/env bash

# YubiKey OTP Configurator for Cisco Duo
# Chris Yocum
# NA DMS ITAR

# NOTE: This script requires the YubiKey Manager CLI to be installed. If you do not have it installed, the script will fail.
# You can find the installation instructions here: https://github.com/Yubico/yubikey-manager?tab=readme-ov-file#pre-built-packages

# Define some variables.
# Define the output CSV file and write the Duo header.
outputFile='duo_yubikeys.csv'
echo 'Serial_Number,Private_Identity,AES_Key' > "${outputFile}"
# Get the serial # of the inserted YubiKey.
yubikeySerial=$(ykman list --serials)
# Define the Slot you want to program (1 or 2). We always use 1.
otpSlot='1'
# Set loop counter to 0.
loopCounter='0'

# Check whether or not a YubiKey is inserted into the system. If no, print message and exit. If yes, move on.
if [[ -z ${yubikeySerial} ]]; then
    echo 'There is no YubiKey currently inserted into this system!'
    echo 'Please insert a YubiKey and run the script again.'
    exit 1
else
    :
fi

# Trap for when Ctrl+C is pressed.
trap ctrl_c INT

# Function of what trap command calls.
function ctrl_c() {
    if [[ ${loopCounter} == '0' ]]; then
        exit 0
    elif [[ ${loopCounter} -gt '0' ]]; then
        echo ''
        echo ''
        echo ''
        echo '--- Script Complete ---'
        echo ''
        echo "YubuiKeys configured for use with Cisco Duo: ${loopCounter}"
        echo ''
        echo "Displaying the contents of the output file, ${outputFile}:"
        echo ''
        cat "${outputFile}"
        echo ''
        echo ''
        exit 0
    else
        :
    fi
}

# Inform the user that this script will erase the existing configuration on an inserted YubiKey, what this script does and prompt them to confirm or exit.
echo 'This will erase any and all configuration that is currently saved to the inserted YubiKey!'
echo ''
echo "This script is going to program the inserted YubiKey's Slot ${otpSlot} for use with Cisco Duo, log the credentials to a CSV file, and then prompt you to remove the current key and insert the next one for programming. This will NOT stop until you press [Ctrl+C] to exit the script."
echo ''
read -p "Press [Enter] once you've inserted a new YubiKey you wish to program or press [Ctrl+C] to exit the script."
echo ''

# Set the loop counter to 1.
loopCounter='1'

# Loop to configure keys until user exits the script with Ctrl+C.
while true; do
    yubikeySerial=$(ykman list --serials)
    echo "--- Erasing YubiKey: ${yubikeySerial} ---"
    ykman fido reset
    echo ''
    echo "--- Programming YubiKey: ${yubikeySerial} ---"

    # The command generates a new Yubico OTP credential (random Public/Private/Key) and outputs the configuration to the console.
    output=$(ykman -l ERROR otp yubiotp -f -S -g -G "${otpSlot}")

    # Check if the command was successful.
    if [[ $? == 0 ]]; then
        # Extract the values from the output. Example output lines:
        # Public ID: ffffffeeeeddddcccc (Not needed or used in this case)
        # Private ID: 01 02 03 04 05 06
        # Secret Key: a1 b2 c3 d4 e5 f6 78 90 12 34 56 78 90 12 34 56
        
        # Capture the Private ID and Secret Key, then remove spaces and colons from the hex values.
        privateIDSpaced=$(echo "${output}" | grep "private ID" | sed 's/.*: *//')
        secretKeySpaced=$(echo "${output}" | grep "secret key" | sed 's/.*: *//')
        
        privateIDClean=$(echo "${privateIDSpaced}" | tr -d '[:space:]')
        secretKeyClean=$(echo "${secretKeySpaced}" | tr -d '[:space:]')

        # Duo requires: Serial_Number,Private_Identity,Secret_Key.
        # Duo *ignores* the Public ID (which is why we don't include it).
        csvLine="${yubikeySerial},${privateIDClean},${secretKeyClean}"
        
        # Append the data to the CSV file.
        echo "${csvLine}" >> "${outputFile}"
        echo "SUCCESS: Logged credentials for ${yubikeySerial} to ${outputFile}."
        echo ''
    else
        echo "ERROR: Failed to program YubiKey ${yubikeySerial}. Check if the key is inserted correctly and that Slot ${otpSlot} is available."
        exit 1
    fi

    # Prompt the user to remove the current key and insert another one, then press "Enter" or top press "Ctrl+C" if they are done and wish to exit.
    read -p "Press [Enter] once you've inserted a new YubiKey that you wish to program or press [Ctrl+C] if you are done and want to exit the script."

    # Increment the loop counter by 1.
    loopCounter=$((loopCounter + 1))
    
    # Clear the screen for a cleaner next cycle.
    clear

done

```

1. Install the `ykman` package from Yubico as outlined in the note above.
2. Once you have the `ykman` package installed, save the script to your Macbook somewhere you'll remember, like your `Documents` folder.
3. Next, you will need to make the script executable so that you can actually run it. The following command will `cd` into your `Documents` folder and make the script executable:
    1. `cd Documents; chmod a+x YubiKey-Configurator.sh`
4. At this point, make sure you have the first YubiKey inserted into your machine.
5. Now you can start using the script. Execute it with one of the following commands:
    1. `./YubiKey-Configurator.sh`
    2. `bash YubiKey-Configurator.sh`
6. You should see the following output:
```shell
cyocum@USMG3N4077995 Documents % ./YubiKey-Configurator.sh
This will erase any and all configuration that is currently saved to the inserted YubiKey!

This script is going to program the inserted YubiKey's Slot 1 for use with Cisco Duo, log the credentials to a CSV file, and then prompt you to remove the current key and insert the next one for programming. This will NOT stop until you press [Ctrl+C] to exit the script.

Press [Enter] once you've inserted a new YubiKey you wish to program or press [Ctrl+C] to exit the script.
```
7. Press `Enter` when you're ready to factory reset and reconfigure the inserted YubiKey.
8. You should now see the following output:
```shell
--- Erasing YubiKey: 30939205 ---
WARNING! This will delete all FIDO credentials, including FIDO U2F credentials, and restore factory settings. Proceed? [y/N]: y
Remove your YubiKey from the USB port.
Re-insert your YubiKey now...
Touch the YubiKey to confirm.
Reset in progress, DO NOT REMOVE YOUR YUBIKEY!
FIDO application data reset.

--- Programming YubiKey: 30939205 ---
SUCCESS: Logged credentials for 30939205 to duo_yubikeys.csv.

Press [Enter] once you've inserted a new YubiKey that you wish to program or press [Ctrl+C] if you are done and want to exit the script.
```
9. You now have two options:
    1. If you only had to configure one YubiKey press `Ctrl+C` to exit the script.
    2. If you need to configure more than one YubiKey, remove the first YubiKey you inserted, insert the next one that you need to configure, and press `Enter`.
10. The output of each run gets appended to the output file, called `duo_yubikeys.csv`, the contents of which are then displayed once you exit the script.
11. When you're finished configuring the YubiKeys, press `Ctrl+C` to exit the script.
12. The CSV file will then be displayed in the terminal for you to easily copy and paste into the corresponding spreadsheet or right into the Cisco Duo Administration Console.

```shell title="Programming a single key"
--- Script Complete ---

YubuiKeys configured for use with Cisco Duo: 1

Displaying the contents of the output file, duo_yubikeys.csv:

Serial_Number,Private_Identity,AES_Key
30939205,91450cb93ede,a23253899b065f9c067f70ffe34dbf86
```

```shell title="Programming multiple keys"
--- Script Complete ---

YubuiKeys configured for use with Cisco Duo: 6

Displaying the contents of the output file, duo_yubikeys.csv:

Serial_Number,Private_Identity,AES_Key
30939657,a83d316633f4,d53d65cc645a114ebdd2ac410eb03cd3
30934068,b318978c0277,b1342d783d288dcb19241877afe97e1f
30934056,21b16097844d,6ab26db8b3d02acff690faf71abd80a8
30934079,c7259a14925a,f771ee7c59ac785cc892534834dafb72
30934072,4982f6ea6649,2b730988d4e32b3393d76d1d052bf714
30934083,a8281b8a201f,2d1f3be56aace469f477cf8dfaf9670d
```