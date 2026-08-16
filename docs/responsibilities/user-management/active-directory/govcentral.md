# Government Central

On the GovCentral side of things, we have an application that acts as a wrapper for Active Directory called [AD Manager Plus from ManageEngine](https://www.manageengine.com/products/ad-manager/active-directory-management.html). We haven't been given access or training for this yet, so we still have to do things the old fashioned way directly through AD for now.

!!! info

    You will need to use your GovCentral laptop for all work outlined here.


## Group Assignment


### Important Groups

| Purpose | Corresponding AD Group |
| ------- | ---------------------- |
| App Team Prod Jump Server access | `Appgrp_AppJumpServer_RemoteOnlyAccess` |
| App Team Non-Prod Jump Server access | `Appgrp_AppJumpServer_RemoteOnlyAccess_DEV` |
| Ops/Infra Team Remote Access | `Appgrp_OppJumpServer_RemoteOnlyAccess` |
| Ops Team Kofax Access | `AppGrp_Kofax_IRS_ROPA_User` |

### Adding a User to a Group

TBD


### Removing a User From a Group

TBD


## Unlocking an Account

1. Login to your GovCentral laptop and connect to the VPN.
2. Connect to the GovCentral Production Jump Server via Remote Desktop:
    1. `USNUSJMPAPPGP01`
3. Click the `Start Menu` and type `active`.
4. You should see an item called `Active Directory Users and Computers`. Click on it.
![GC-AD-Unlock-1](../../../overrides/assets/images/gc-ad-unlock-1.png#centered)
5. Expand `imtn.gov`.
6. Expand `Shared-Services`.
7. Expand `Users`.
8. Click on `Standard Users`.
![GC-AD-Unlock-2](../../../overrides/assets/images/gc-ad-unlock-2.png#centered)
9. Find the User in the right-hand pane and click on `Properties`.
![GC-AD-Unlock-3](../../../overrides/assets/images/gc-ad-unlock-3.png#centered)
10. The User Properties window will open. Click on the `Account` tab.
![GC-AD-Unlock-4](../../../overrides/assets/images/gc-ad-unlock-4.png#centered)
11. Check the box for `Unlock account`.
12. Click the `Ok` button.
![GC-AD-Unlock-5](../../../overrides/assets/images/gc-ad-unlock-5.png#centered)


## Resetting a Password

1. Login to your GovCentral laptop and connect to the VPN.
2. Connect to the GovCentral Production Jump Server via Remote Desktop:
    1. `USNUSJMPAPPGP01`
3. Click the `Start Menu` and type `active`.
4. You should see an item called `Active Directory Users and Computers`. Click on it.
![GC-AD-Unlock-1](../../../overrides/assets/images/gc-ad-unlock-1.png#centered)
5. Expand `imtn.gov`.
6. Expand `Shared-Services`.
7. Expand `Users`.
8. Click on `Standard Users`.
![GC-AD-Unlock-2](../../../overrides/assets/images/gc-ad-unlock-2.png#centered)
9. Find the User in the right-hand pane and click on `Reset password...`.
![GC-AD-Reset-1](../../../overrides/assets/images/gc-ad-reset-1.png#centered)
10. The `Reset Password` window will open. Enter in the new password for the User and confirm it.
11. Uncheck the box for `User must change password at next logon`.
12. Click the `Ok` button.
![GC-AD-Reset-2](../../../overrides/assets/images/gc-ad-reset-2.png#centered)


### User's Next Steps

!!! tip

    It may take up to 30 minutes for the new password to sync with Cisco Duo so make sure you have the User wait at least 30 minutes before trying to use the new password.

After a User's GovCentral AD password is changed, they must perform the following steps to ensure the new password has synced properly since it is the password for both their GovCentral Windows account and the GovCentral VPN.

1. If the User was initially unable to login to Windows:
    1. Chances are that their account is locked as well so make sure to check that.
    2. Have the User login with the new password.
    3. Have the User connect to the VPN with the new password.
2. If the User was able to login to Windows, but received a message that their password was incorrect when trying to connect to the VPN:
    1. Login to the VPN with the new password.
    2. Once the VPN has connected, lock the computer.
    3. Login to the computer with the new password.
3. They may receive a few prompts that Windows needs the new credentials, to lock the computer, and then login with the new password. They should follow the directions from the prompts.


## Verifying Users in Kofax Groups Compared to Threatswitch OKTA Report

As part of the audits that we have to go through, the IRS will ask us to validate Users that are part of the Kofax Active Directory Groups compared to the report of cleared Users from OKTA that Threatswitch sends us every day. It is very inportant for Operations to make sure that they are submitting User Decommission tickets in a timely manner and that we, in turn, are processing them as quickly as possible.

To assist with this, I have worked with AI to write a Powershell script that exports the users that are members of the ROPA and DATX Kofax IRS AD Groups and compares that to the report that Threatswitch provides. Due to the fact that so many users are submitted with shortened names or nicknames, it isn't possible for the script to handle the whole task, but I was able to incorporate some helpful logic to provide possible matches, and even potential typos, to help sort through the list a little faster.

```powershell title="Compare_Kofax_AD_To_Threatswitch_Report.ps1"

# =============================================================================
# CONFIGURATION
# =============================================================================
$Group1Name = "AppGrp_Kofax_IRS_ROPA_User"          # First Active Directory Group
$Group2Name = "AppGrp_Kofax_IRS_DATX_User"          # Second Active Directory Group
$CsvPath    = "C:\Reports\OKTAReport.csv"           # Path to your clearance CSV
$OutputPath = "C:\Reports\MissingFromClearance.csv" # Output path

# Column headers in your CSV Clearance Report
$CsvLastNameHeader  = "Last Name"
$CsvFirstNameHeader = "First Name"

# To catch typos like "Elliott" vs. "Elliot" or "Smyth" vs. "Smith", the script below incorporates fuzzy string
# matching using the Levenshtein Distance algorithm.
#
# This algorithm calculates the "edit distance" (how many character insertions, deletions, or substitutions are
# required to turn one string into another).
#
# In Stage 2, if an exact last name match fails, the script calculates the edit distance against all last names
# in the clearance report. Any name within your set typo threshold (default is 1 or 2 character differences)
# will be flagged as a potential typo match.
#
# Typo Tolerance: Maximum allowed character edits (e.g., 1 = "Elliott" vs "Elliot")
$MaxTypoDistance = 1 
# =============================================================================

# Compile inline C# class for ultra-fast Levenshtein Distance calculation
Add-Type -TypeDefinition @"
using System;

public class StringMatcher {
    public static int LevenshteinDistance(string s, string t) {
        if (string.IsNullOrEmpty(s)) return string.IsNullOrEmpty(t) ? 0 : t.Length;
        if (string.IsNullOrEmpty(t)) return s.Length;

        s = s.ToLowerInvariant().Trim();
        t = t.ToLowerInvariant().Trim();

        int n = s.Length;
        int m = t.Length;
        int[,] d = new int[n + 1, m + 1];

        for (int i = 0; i <= n; i++) d[i, 0] = i;
        for (int j = 0; j <= m; j++) d[0, j] = j;

        for (int i = 1; i <= n; i++) {
            for (int j = 1; j <= m; j++) {
                int cost = (t[j - 1] == s[i - 1]) ? 0 : 1;
                d[i, j] = Math.Min(
                    Math.Min(d[i - 1, j] + 1, d[i, j - 1] + 1),
                    d[i - 1, j - 1] + cost);
            }
        }
        return d[n, m];
    }
}
"@ -ErrorAction SilentlyContinue

# Ensure ActiveDirectory module is available
Import-Module ActiveDirectory -ErrorAction Stop

Write-Host "Fetching user members from AD groups..." -ForegroundColor Cyan

# 1. Fetch group members independently (includes nested sub-groups)
$group1Members = Get-ADGroupMember -Identity $Group1Name -Recursive | Where-Object { $_.objectClass -eq 'user' }
$group2Members = Get-ADGroupMember -Identity $Group2Name -Recursive | Where-Object { $_.objectClass -eq 'user' }

# 2. Logical OR / Union: Combine members of Group 1 or Group 2 and remove duplicates
$uniqueUserDns = @($group1Members) + @($group2Members) | Select-Object -ExpandProperty DistinguishedName -Unique

if (-not $uniqueUserDns) {
    Write-Warning "No users found in either of the specified AD groups."
    return
}

# 3. Retrieve full AD user properties required
$adUsers = $uniqueUserDns | Get-ADUser -Properties GivenName, Surname, SamAccountName, DisplayName, UserPrincipalName, EmailAddress

Write-Host "Importing clearance report..." -ForegroundColor Cyan
# Suppress blank header warnings via -WarningAction SilentlyContinue
$clearanceData = Import-Csv -Path $CsvPath -WarningAction SilentlyContinue

# 4. Build fast lookup sets for exact full name and last name matching
$fullNameSet = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
$lastNameSet = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)

foreach ($row in $clearanceData) {
    $lName = $row.$CsvLastNameHeader
    $fName = $row.$CsvFirstNameHeader

    if (-not [string]::IsNullOrWhiteSpace($lName)) {
        [void]$lastNameSet.Add($lName.Trim())

        if (-not [string]::IsNullOrWhiteSpace($fName)) {
            $key = "$($lName.Trim())|$($fName.Trim())"
            [void]$fullNameSet.Add($key)
        }
    }
}

# =============================================================================
# STAGE 1: Exact First + Last Name Matching
# =============================================================================
Write-Host "Stage 1: Comparing exact First + Last Names..." -ForegroundColor Cyan

$initialMissing = $adUsers | Where-Object {
    $adLastName  = $_.Surname
    $adFirstName = $_.GivenName

    if (-not [string]::IsNullOrWhiteSpace($adLastName) -and -not [string]::IsNullOrWhiteSpace($adFirstName)) {
        $adKey = "$($adLastName.Trim())|$($adFirstName.Trim())"
        -not $fullNameSet.Contains($adKey)
    } else {
        $true # Pass incomplete profiles forward for review
    }
}

# =============================================================================
# STAGE 2: Last Name Checks (Exact + Fuzzy/Typo Matching)
# =============================================================================
Write-Host "Stage 2: Evaluating Last Names for exact matches and potential typos..." -ForegroundColor Cyan

$processedResults = foreach ($user in $initialMissing) {
    $adLastName = $user.Surname
    $status = ""
    $closestMatchName = ""

    if ([string]::IsNullOrWhiteSpace($adLastName)) {
        $status = "Review Required (No Last Name in AD)"
    } 
    # Check 2a: Exact Last Name Match (Handles short names like 'Ben' vs 'Benjamin')
    elseif ($lastNameSet.Contains($adLastName.Trim())) {
        $status = "Potential Match (Last Name Exact - Check Nickname/First Name)"
    } 
    # Check 2b: Fuzzy/Typo Last Name Match (Handles typos like 'Elliott' vs 'Elliot')
    else {
        foreach ($csvLastName in $lastNameSet) {
            $distance = [StringMatcher]::LevenshteinDistance($adLastName, $csvLastName)
            if ($distance -gt 0 -and $distance -le $MaxTypoDistance) {
                $status = "Potential Typo (AD: '$adLastName' vs CSV: '$csvLastName')"
                $closestMatchName = $csvLastName
                break # Stop at first close match
            }
        }

        # Check 2c: If no exact match and no typo match were found
        if ([string]::IsNullOrWhiteSpace($status)) {
            $status = "Truly Missing (Last Name Not Found)"
        }
    }

    [PSCustomObject]@{
        FirstName          = $user.GivenName
        LastName           = $user.Surname
        MatchStatus        = $status
    }
}

# =============================================================================
# OUTPUT RESULTS
# =============================================================================
$totalMissing = ($processedResults | Measure-Object).Count
Write-Host "Processed $totalMissing user(s) missing exact match." -ForegroundColor Green

if ($totalMissing -gt 0) {
    $processedResults | Export-Csv -Path $OutputPath -NoTypeInformation -Encoding UTF8
    Write-Host "Exported categorized results to: $OutputPath" -ForegroundColor Green
}
```

1. Login to your GovCentral laptop and connect to the VPN.
2. Connect to the GovCentral Production Jump Server via Remote Desktop:
    1. `USNUSJMPAPPGP01`
3. Open File Explorer and navigate to the following directory:
    1. `C:\Reports`
4. You should see three files:
    1. `Compare_Kofax_AD_To_Threatswitch_Report.ps1` - The script.
    2. `MissingFromClearance.csv` - The output file.
    3. `OKTAReport.csv` - The OKTA report from Threatswitch.
5. Overwrite the `OKTAReport.csv` file with the contents of the new report from today. The filename MUST NOT CHANGE as it is hardcoded into the script.
6. Right-click on the `Compare_Kofax_AD_To_Threatswitch_Report.ps1` script and select `Edit` to open it in the Powershell ISE.
7. Click the run button. You should see output like the following:
![GC-AD-OKTA-Report-1](../../../overrides/assets/images/gc-ad-okta-report-1.png#centered)
8. Open up the `MissingFromClearance` Google Sheet [HERE](https://docs.google.com/spreadsheets/d/1q9QRM52YLJPGjUxVad5bqb04R_T2afy3j7-S0zfiqhE/edit?gid=304752925#gid=304752925).
9. Remove/delete any/all data from the sheet.
10. Now you need to import the generated CSV file. Click on `File` and then `Import`.
![GC-AD-OKTA-Report-2](../../../overrides/assets/images/gc-ad-okta-report-2.png#centered)
11. Select the `Upload` tab and then click `Browse`.
![GC-AD-OKTA-Report-3](../../../overrides/assets/images/gc-ad-okta-report-3.png#centered)
12. Browse to where you saved the `MissingFromClearance.csv` file and upload it.
![GC-AD-OKTA-Report-4](../../../overrides/assets/images/gc-ad-okta-report-4.png#centered)
13. For the `Import Location` option select `Replace spreadsheet` from the drop-down menu. For the `Separator type` option select `Comma` from the drop-down menu.
![GC-AD-OKTA-Report-5](../../../overrides/assets/images/gc-ad-okta-report-5.png#centered)
14. Click the `Import Data` button.
15. Resize the columns to make it easier to read. You will see three different possibilities for the `MatchStatus` column. This is designed to help you move through the list more quickly.
    1. `Potential Match (Last Name Exact - Check Nickname/First Name)` - This happens with foks who were added into AD with a shortened version of their name or a nickname, IE: Ben versus Benjamin, Chris versus Christopher, etc. You will need to check the raw OKTA report from Threatswitch to confirm their clearance.
    2. `Potential Typo (AD: 'Birch' vs CSV: 'Burch')` - Someone made a typo either with AD or Threatswitch for the clearance. You will need to check the raw OKTA report from Threatswitch to confirm their clearance.
    3. `Truly Missing (Last Name Not Found)` - They most likely have been terminated or resigned and have not been properly decommed as their account is still a member of one, or both, of the Kofax IRS AD Groups.