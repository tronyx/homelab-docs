---
title: Upgrade plan
description: The planned hardware work of my Primary Lab, in order: new backups for Morgoth, Proxmox on Bolg, board swaps between the servers, a GPU for Plex, and a mirrored appdata pool for Gothmog.
---

# Upgrade plan

This page is part of my [Primary Lab](index.md).

Status on November 16, 2026: Phase 0A is under way. The new nightly backups of Morgoth's containers and flash drive run. The first run of the new Plex backup is still to come. No hardware has changed yet.

This plan puts every planned change in one order. Each phase ends with a gate. A gate is a period of normal use with no problems, and the next phase starts only after it passes. My private runbook holds the exact commands. This page shows the order, the parts and the reasons.

## Rules for every phase

- Do one phase at a time.
- Before a phase changes a server, make sure that its last backup succeeded.
- Keep the old copy of anything you move until the gate after the move passes. That copy is the way back.
- If a step fails and the cause is not clear, stop and roll back. Do not improvise in the middle of a hardware window.
- After each phase, update the records for what changed.

## The end state

| Host | Today | After |
| --- | --- | --- |
| Bolg | ESXi 8.0.3, H12SSL-i, EPYC Milan, 128 GB, H730 RAID 10, runs Suladan, Zog, vCenter and PowerChute | Proxmox VE, 256 GB, H730 in HBA mode, ZFS pool of mirrors, Proxmox on an M.2 boot mirror, runs Suladan, Zog, playground and a Proxmox Backup Server VM |
| Sauron | ESXi 8.0.0, H11SSL-C, EPYC 7302 (Rome), 8 x 16 GB, runs the GitOps lab and playground | Retired. Its board, CPU and RAM go to Morgoth. Its ten SSDs go to Bolg's pool. Its chassis, H730 and X520 are spares |
| Morgoth | Unraid, X11SCH-F, E-2246G, 64 GB | Unraid on Sauron's H11SSL-C, EPYC 7302 and 128 GB, with an Intel Arc B580 for Plex transcoding and a dual M.2 card |
| Gothmog | Unraid, old board, 2 x 1 Gb bond | Unraid on Morgoth's X11SCH-F, E-2246G and 64 GB, 10 Gb to the aggregation switch, a new BTRFS RAID 1 appdata pool on two new 500 GB SSDs |
| vCenter, PowerChute VMs | Running on Bolg | Retired. NUT replaces PowerChute |

| Backup | Before the plan | After |
| --- | --- | --- |
| VMs | Veeam on Zog | Proxmox Backup Server (PBS) VM on Bolg, datastore on the ReadyNAS over NFS |
| My PC | Veeam on Zog | Veeam on Zog (no change) |
| Plex appdata | Veeam on Zog, Plex running | restic on Morgoth from a btrfs snapshot, nightly at 04:00, 30 daily snapshots |
| Morgoth containers | A tar of 19 listed containers, 7 days | restic, every container except Plex, nightly at 01:00, 30 daily snapshots |
| Morgoth flash drive | A tar of `/boot`, 30 days | restic, in the 01:00 run, 30 daily snapshots |
| Suladan, Cloud Server | restic, weekly | restic, weekly (no change) |

## Parts to buy

- Two M.2 2280 NVMe drives with power-loss protection for Bolg's boot mirror: two Kingston DC2000B 240 GB. The H12SSL-i has two M.2 slots.
- A QNAP QM2-2P-384A dual M.2 card (PCIe 3.0 x8) for Morgoth's Plex NVMe drives.
- The cable run from Gothmog to the aggregation switch, and a module for the switch port if it has none.
- SATA cables for the H11SSL-C, if its SATA ports need them.
- An 8-pin PCIe power cable for the B580, if Morgoth's power supply has no free one.
- Two 500 GB SSDs for Gothmog's new appdata pool. The pool also holds the metrics database later (see [Later](#later)). That database writes the files of the current day again many times each day, so the rated write life of the SSDs counts as much as their size.

## Phase 0A: new backups for Morgoth

This phase changes no hardware, and it comes first. The hardware work needs good backups of Morgoth, and the Veeam backup of the Plex data can only retire after this phase.

A Python tool in my Docker automation repository makes the backups with restic. It stops one container or group of containers at a time, backs up the folders that they mount, and starts them again. The Plex job does not stop Plex: it backs up a btrfs snapshot of the Plex drive. Both jobs report to Discord, to Unraid and to Healthchecks.

- Done: the code, the setup on Morgoth, and the first runs of the container job. The old tar scripts for the containers and the flash drive are turned off.
- Done: a restore test of one container, the metrics database, on November 14, 2026.
- Open: the first run of the Plex job, and the restore tests of the flash drive and of Plex. The restored Plex database must pass `PRAGMA integrity_check`.
- After the restore tests: turn off the Veeam Plex job.

**Gate 0A:** a week of good runs of both jobs.

## Phase 0B: prepare for the hardware work

No downtime.

- Record each VM's MAC addresses, IP addresses, disks and hardware version.
- Update Sauron from ESXi 8.0.0 to 8.0.3. A VM at hardware version 21 does not start before 8.0 Update 2, and Bolg's VMs move to Sauron in Phase 2.
- Install the VirtIO drivers on Zog while it still runs on ESXi. Then Zog can boot on VirtIO disks and a VirtIO network card after the import to Proxmox.
- Make sure that Gothmog's appdata fits on the new pool. Done on November 16, 2026: the appdata held 180 MB and the Docker folder 2.2 GB. The metrics database on Morgoth held 410 MB and grew by about 79 MB a day, about 29 GB a year. A RAID 1 of two 500 GB SSDs holds about 465 GiB.
- Buy the parts.

## Phase 1: the GitOps lab

- Save what I want to keep from GitLab, Vault and Keycloak.
- Power off the eight [GitOps Lab](../gitops.md) VMs on Sauron. I rebuild the lab later on Bolg, with an improved design.

## Phase 2: empty Bolg

- Move Suladan, Zog and PowerChute from Bolg to Sauron over the 10 Gb direct link between them. Each VM is powered off for its move. A live move from Bolg's EPYC Milan to Sauron's EPYC Rome needs EVC.
- Retire vCenter after the last move. The Proxmox import connects to Sauron's ESXi directly.

**Gate 2:** a few days with every VM on Sauron.

## Phase 3: Proxmox on Bolg

- Install a second 4 x 32 GB kit for 256 GB. All eight memory channels are in use, and the whole set runs at the speed of the slower kit, 2133.
- Install the two M.2 boot drives, and set the H730 to HBA mode. This deletes the RAID 10, and Bolg is empty at this point.
- Install Proxmox VE on the two M.2 drives as a ZFS mirror.
- Make a ZFS pool of five mirrors from Bolg's ten SM863 SSDs, about 4.2 TiB usable.
- Set up NUT for the APC and the Eaton UPS before anything important runs on Bolg.
- Import the VMs from Sauron's ESXi with the Proxmox import wizard, one at a time: playground, then Zog, then Suladan last, in a planned window. The virtual network card of each VM changes to VirtIO, so the network interface name in Suladan changes. I fix its network configuration from the console before Docker starts.
- Retire PowerChute.
- Make a Proxmox Backup Server VM with its datastore on an NFS share of the ReadyNAS. Back up every VM each night, with a weekly verify job and a prune rule. Restore one VM as a test, then turn off the Veeam VM jobs. Veeam keeps backing up my PC.

**Gate 3:** one to two weeks on Proxmox. Sauron keeps its powered-off copies of the VMs as the way back.

## Phase 4: the Morgoth window

Sauron and Morgoth are down.

- Make sure that the last Morgoth backups succeeded.
- Remove Sauron's ten SSDs. They stay untouched until Gate 4, because they hold the copies of the VMs.
- Move Sauron's H11SSL-C, the EPYC 7302 and the 8 x 16 GB into Morgoth's chassis. Morgoth's old X11SCH-F, E-2246G and 64 GB go to Gothmog later.
- Put one Plex NVMe drive in the board's M.2 slot and one in the QNAP card. With one drive on the board, a failure of the card only degrades the RAID 1. The x16 slots stay free for the B580.
- At the first boot, do not start the array if a drive is missing. Make sure that the 10 Gb card is `eth0` and that the Plex pool lists both NVMe drives before Plex starts.
- Run both backup jobs by hand once.

**Gate 4:** Morgoth runs normally. Then Sauron's SSDs are free.

## Phase 5: the B580

- Install the B580 in a PCIe 3.0 x16 slot, with its 8-pin power.
- Turn on Above 4G Decoding in the BIOS, and Resizable BAR if the board offers it.
- Make sure that Unraid's kernel has the `xe` driver for the B580.
- Turn on hardware transcoding in Plex, and test a transcode.

**Gate 5:** a week of Plex use with hardware transcoding.

## Phase 6: the Gothmog window

- Turn off the media sync scripts. They must not run while Gothmog is down.
- Move in Morgoth's old X11SCH-F, E-2246G and 64 GB, with Gothmog's HBAs and a spare 10 Gb card.
- Install the two new 500 GB SSDs.
- Connect the 10 Gb link to the aggregation switch, and move Gothmog's address from the bond to it.

**Gate 6A:** Gothmog runs on the new board.

- Make a BTRFS RAID 1 pool of the two SSDs.
- Stop Docker, move the appdata and the Docker folder to the new pool, and start Docker. Today the Docker folder is on an array disk, so each container write also works that disk and both parity drives.

**Gate 6B:** turn the media sync back on. It now runs at 10 Gb on both ends.

## Phase 7: clean up

- Add Sauron's ten SSDs to Bolg's pool as five more mirrors, for about 8.5 TiB usable.
- Keep or sell Sauron's chassis, its H730 and its X520.
- E-waste Gothmog's old parts.
- Decide what to do with two 512 GB SSDs in Morgoth that the plan no longer uses.
- Update the records: the inventory, the diagrams, the monitoring checks and the backup map.

## Later

- Rebuild the GitOps Lab from scratch on Bolg, with the improved design.
- Move the metrics database (InfluxDB 3) and Grafana from Morgoth to Gothmog, onto the new pool. Then a stop of Morgoth no longer stops the metrics. The database keeps its data for one year instead of 180 days. Telegraf and Scrutiny stay on Morgoth, because they read Morgoth's own hardware. See [Monitoring](monitoring.md).

## Rollback

| Phase | Way back |
| --- | --- |
| 0A | The Veeam backup of the Plex data stays on until the Plex restore test passes |
| 2 | The VMs stay on Bolg's datastore until Phase 3 wipes it |
| 3 | Sauron's powered-off copies of the VMs, until Gate 3 |
| 4 | Morgoth's old board, CPU and RAM go back in. Sauron's SSDs stay untouched until Gate 4 |
| 5 | Remove the B580 and turn off hardware transcoding |
| 6 | Gothmog's old board goes back in. The old appdata stays until Gate 6B |
