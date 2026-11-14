---
title: Servers
description: The physical servers, VMs and the Cloud Server of my Primary Lab, with their roles, operating systems and hardware.
---

# Servers

This page is part of my [Primary Lab](index.md).

## Bolg

Bolg is the primary ESXi server. It runs ESXi 8.0.3.

- Chassis: Supermicro CSE-216 24-bay SFF chassis with 2x 900 W power supplies
- Board: Supermicro H12SSL-I
- CPU: AMD EPYC Milan 7443P at 2.85 GHz, 24 cores and 48 threads
- Memory: 128 GB DDR4-2933 ECC
- RAID: PERC H730 RAID controller with a 1 GB flash module
- Disks: 10x 960 GB Samsung SM863 enterprise SSDs in RAID 10
- Network: dual SFP+ 10 Gb NIC (10Gtek X520-10G-2S), and a 1 Gb NIC as management standby

Bolg runs four VMs:

- Suladan runs Oracle Linux 10.2 and Docker. Komodo manages its stacks. Its containers are in [Applications](applications.md#suladan).
- Zog runs Windows Server 2025 and Veeam Backup & Replication Community Edition. Veeam makes the automated backups of the Plex data, the VMs and the PCs.
- vCenter is the vCenter 8.0.3 appliance.
- APC PowerChute Network Shutdown (`apc-pc-va`) is the shutdown agent for the APC SMT3000 UPS.

## Sauron

Sauron is the backup ESXi server. It runs ESXi 8.0.0.

- Chassis: Supermicro CSE-216 24-bay SFF chassis with 2x 900 W power supplies
- Board: Supermicro H11SSL-C
- CPU: AMD EPYC Rome 7302 at 3.0 GHz, 16 cores and 32 threads
- Memory: 128 GB DDR4-2133 ECC
- RAID: PERC H730 RAID controller with a 1 GB flash module
- Disks: 10x 960 GB Samsung SM863 enterprise SSDs in RAID 10
- Network: dual SFP+ 10 Gb NIC (10Gtek X520-10G-2S), and a 1 Gb NIC as management standby

Sauron runs the VMs of the [GitOps Lab](../gitops.md). These VMs run only while I work on that lab. Sauron also runs a `playground` VM that is not part of that lab.

## Morgoth

Morgoth is the primary Unraid server. It runs Unraid OS and Docker, and it holds the media library.

- Chassis: Supermicro CSE-846 24-bay chassis with 2x 900 W power supplies
- Board: Supermicro X11SCH-F-O
- CPU: Intel Xeon E-2246G at 3.6 GHz, 6 cores and 12 threads
- Memory: 64 GB DDR4-2666 ECC
- Network: 10 Gb NIC (fiber)
- HBA: LSI 9300-8i 12 Gbps controller in IT mode

The drives of Morgoth are in [Unraid arrays](storage-and-backups.md#unraid-arrays). Morgoth also runs the metrics database and Grafana. See [Monitoring](monitoring.md).

## Gothmog

Gothmog is the backup Unraid server. It runs Unraid OS and Docker, and it keeps a copy of the media library from Morgoth. Its drives are in two chassis. The second chassis is a DAS (direct-attached storage), a drive enclosure without its own computer.

- Chassis: 2x Rosewill RSV-L4412 12-bay chassis, the second one is the DAS
- Board: Gigabyte Z97X-UD5H
- CPU: Intel i7-4770K at 3.5 GHz, 4 cores and 8 threads
- Memory: 32 GB DDR3
- Network: 2x 1 Gbps NICs bonded with 802.3ad
- HBA: LSI 9210-8i 6 Gbps controller in IT mode
- HBA: LSI 9201-16e 6 Gbps controller in IT mode, for the drives in the DAS
- Expander: Intel RES2SV240 24-port RAID expander

The drives of Gothmog are in [Unraid arrays](storage-and-backups.md#unraid-arrays).

## ReadyNAS 3138

The ReadyNAS 3138 is the backup target for Veeam and restic. It has 4x 8 TB WD Red drives. Its shares are in [Storage and backups](storage-and-backups.md#shares). Telegraf runs on the NAS and reports its drives, arrays and fans.

## Unifi NVR

The Unifi NVR runs Unifi Protect and records the [cameras](cameras.md). It has 4x 6 TB WD Purple drives.

## Cloud Server

The Cloud Server is an EZScale VPS outside the lab. It runs the containers that must keep running if something happens to the lab. It runs Ubuntu 22.04.5 LTS.

- CPU: 8 vCores at 2.4 GHz
- Memory: 32 GB
- Disk: 620 GB SSD

The rack positions and power supplies of the servers are in [Rack and power](rack-and-power.md).
