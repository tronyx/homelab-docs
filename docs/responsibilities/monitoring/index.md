# Monitoring

Monitoring and being reactive to significant changes, alerts, etc. is one of our biggest responsibilities.

We utilize multiple 3rd party tools to monitor our multiple environments and vast infrastructure.

As we are responsible for a large environment, it can seem overwhelming to keep track of everything. The team has developed a few tools to assist with watching our environment through Windows PowerShell. A few scripts allow us to check server uptime/availability, available drive space, Kofax services, IBML services, etc. We use the scripts to also do our on-call server checks on the weekend.

We also monitor batches in Kofax throughout the day by keeping Kofax Capture Batch Manager, IBML Administration Console, and OPEX CertainScan open on a site server to observe batches as they are scanned.

Servers are logged into via a remote connection (either through mRemoteNG or Windows RDP) using a secondary account (adm_username) which will be set up for you by the Active Directory (AD) team.


## Checking Environments

We use the following servers specifically to do health checks [^1] for each environment:

- **GDIT (BOPA):** `USNUSPGMKX11P17`
- **GDIT (SLMO):** `USSTLGMKX11AP02`
- **GDIT (HAMO):** `USOBMKX11AP02`
- **SCDOR:** `USCOLMKX11AP02` [^2]
- **IRS (ROPA):** `USROYMKX11AP11` [^3]
- **Boeing (KEWA):** `USKEWAX11P13`
- **Boeing (KEBO):** `USKENMKX11AP01`

[^1]: We have created powershell scripts to complete health checks on each environment, these can be found on the public desktop.
[^2]: MFA required.
[^3]: Accessed via the Jump Server: `USNUSMJHP01`