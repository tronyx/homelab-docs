---
title: Storage and backups
description: The Unraid arrays, the ReadyNAS shares and the backup flows of my Primary Lab.
---

# Storage and backups

This page is part of my [Primary Lab](index.md).

## Unraid arrays

Each Unraid array uses two parity drives. With parity, the array can rebuild a failed data drive.

| | Morgoth | Gothmog |
| --- | --- | --- |
| Parity | 2x 20 TB WD Red | 2x 20 TB WD Red |
| Data | 2x 20 TB, 7x 14 TB, 3x 12 TB, 9x 10 TB (WD Red) | 2x 20 TB (WD Red), 4x 14 TB, 4x 12 TB, 9x 10 TB (WD) |
| Data total | 264 TB | 234 TB |
| Cache pool | 2x 4 TB Crucial SSDs in RAID 1 | 2x 1 TB Micron SSDs in RAID 1 |
| Docker appdata pool | 2x Samsung 850 500 GB SSDs in RAID 1 | 1x 1 TB Micron SSD |
| Plex data pool | 2x Samsung 970 1 TB M.2 NVMe drives in RAID 1 | None |

## Shares

| Share | Location | Contents | Written by |
| --- | --- | --- | --- |
| Docker_Backup | ReadyNAS 3138 | restic repository of the weekly backup of Suladan | restic on Suladan, over NFS |
| Users | ReadyNAS 3138 | Veeam backups of my PC | Veeam on Zog |
| Server_Backup | ReadyNAS 3138 | The other Veeam jobs: VMs and Plex Docker appdata | Veeam on Zog |
| Veeam | ReadyNAS 3138 | Veeam configuration backup | Veeam on Zog |
| vCenter | ReadyNAS 3138 | Automatic vCenter configuration backups | vCenter (broken at the moment) |
| Storage | ReadyNAS 3138 | Miscellaneous files | Not a backup target |
| PiHole_Backup | ReadyNAS 3138 | Not used any more | Nothing |
| Media Backup | Gothmog | Copy of all Plex media from Morgoth | rsync on Gothmog, over NFS |

## Backup flows

- Veeam on [Zog](servers.md#bolg) backs up my PC to Users, the VMs and the Plex Docker appdata to Server_Backup, and its own configuration to Veeam.
- restic on Suladan makes a weekly backup of Suladan to Docker_Backup. Suladan mounts the share over NFS at `/mnt/docker_backup`.
- Scripts in the Unraid User Scripts plugin on Gothmog copy all Plex media from Morgoth with rsync. Gothmog shares Media Backup over NFS, and Morgoth mounts it.
- restic on the Cloud Server backs up the Cloud Server to Backblaze B2. B2 holds only this repository. The ReadyNAS no longer backs up to B2.
- vCenter makes automatic configuration backups to the vCenter share. These backups are broken at the moment, and I plan to fix them.
