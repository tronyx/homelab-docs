---
title: Network
description: The internet link, switches, VLANs, cables, VPNs, Wi-Fi, client devices and addresses of my Primary Lab.
---

# Network

This page is part of my [Primary Lab](index.md).

The internet connection gives about 2,300 Mb/s down and 350 Mb/s up. These numbers are the average that Netronome measures. A Hitron CODA56 cable modem (DOCSIS 3.1) connects to the Unifi Gateway Fiber (UXG-Fiber). The gateway routes all VLANs. A VLAN is a separate virtual network that shares the same cables and switches.

The gateway connects to the Unifi Switch Aggregation, an 8-port 10 Gb switch. The aggregation switch is the core of the network:

- The UXG-Fiber gateway connects over one 10 Gb SFP+ link.
- The Unifi 48 Switch (USW-48) connects over two 10 Gb SFP+ links in a link aggregation group (LAG). A LAG joins several links into one logical link.
- [Morgoth](servers.md#morgoth), [Bolg](servers.md#bolg) and [Sauron](servers.md#sauron) connect over 10 Gb fiber.
- The Unifi NVR connects over 10 Gb SFP+.

Bolg and Sauron also have a direct 10 Gb SFP+ link between them for vMotion and provisioning. vMotion moves running VMs from one ESXi server to the other. Each of the two servers also has a 1 Gb NIC as a management standby.

The USW-48 connects the ReadyNAS, Gothmog and the Unifi 8-Port 150W PoE Switch over CAT6. Gothmog uses two 1 Gb ports bonded with 802.3ad. PoE (Power over Ethernet) sends power and data on the same cable. The PoE switch powers the Cloud Key Gen 2+ and the PiHole. It also connects two smaller switches and one access point:

- A Unifi Switch Flex in an outdoor utility box connects the Front, Side and Backyard cameras. The planned Front (second) camera will connect to it too.
- A Unifi Switch Flex Mini in the Shed connects the Driveway camera and the AC-Pro access point.
- A Unifi AP-U6-LR access point connects to it directly.

The Cloud Key Gen 2+ runs the Unifi Network Controller. The PiHole is a Raspberry Pi 4B (4 GB) with Ubuntu 22.04.1, and it gives DNS to the network.

## VLANs

| Name | VLAN tag | Subnet |
| --- | --- | --- |
| LAN | None (default network) | 192.168.1.0/24 |
| Cameras | 5 | 172.27.1.0/28 |
| Management | 10 | 172.27.1.96/27 |
| SLAN (Servers) | 15 | 172.27.1.224/27 |
| IoT | 20 | 172.27.2.0/26 |

SLAN is not in use yet. The servers will move to it later.

## Cables and the VLANs they carry

The diagram draws each cable as one striped ribbon, with one colored stripe per VLAN and a stripe width that shows the speed. A grey line is a cable with no VLAN, such as the internet uplink or a direct link. A dotted line is a logical link over the internet.

| From | To | Cable | Speed | VLANs |
| --- | --- | --- | --- | --- |
| Hitron CODA56 | UXG-Fiber | Not recorded | Not recorded | None |
| UXG-Fiber | Aggregation switch | SFP+ | 10 Gb | LAN, Cameras, IoT, Management |
| USW-48 | Aggregation switch | 2x SFP+ (LAG) | 2x 10 Gb | LAN, Cameras, IoT, Management |
| Unifi NVR | Aggregation switch | SFP+ | 10 Gb | Management |
| Morgoth | Aggregation switch | Fiber | 10 Gb | LAN |
| Bolg | Aggregation switch | Fiber | 10 Gb | LAN |
| Sauron | Aggregation switch | Fiber | 10 Gb | LAN |
| Bolg | Sauron | SFP+ (direct) | 10 Gb | None |
| 8-Port PoE Switch | USW-48 | CAT6 | Not recorded | LAN, Cameras, IoT, Management |
| ReadyNAS 3138 | USW-48 | CAT6 | Not recorded | LAN |
| Gothmog | USW-48 | 2x CAT6 (bonded) | 2x 1 Gb | LAN |
| Cloud Key Gen 2+ | 8-Port PoE Switch | PoE | Not recorded | Management |
| PiHole | 8-Port PoE Switch | PoE | Not recorded | LAN |
| Switch Flex | 8-Port PoE Switch | Not recorded | Not recorded | Cameras, Management |
| Switch Flex Mini | 8-Port PoE Switch | Not recorded | Not recorded | LAN, Cameras, IoT, Management |
| U6-LR access point | 8-Port PoE Switch | Not recorded | Not recorded | LAN, Cameras, IoT, Management |
| AC-Pro access point | Switch Flex Mini | Not recorded | Not recorded | LAN, Cameras, IoT, Management |

## VPNs

- WireGuard connects my phone to the home network.
- TorGuard is the VPN that the `qbit` container on Morgoth uses.

## Wi-Fi and client devices

Two access points are in use: the U6-LR and the AC-Pro in the Shed. A second U6-LR for the Garage is planned. Two [cameras](cameras.md) use Wi-Fi: Shed and Kitchen.

The diagram shows the client devices by type and count only. The LAN has 1 PC, 2 laptops, 2 work devices, 3 phones, 1 tablet, 2 watches, 1 printer, 2 TVs, 3 streaming players and 2 game consoles. The IoT VLAN has 4 thermostats, 5 smoke alarms, 4 air conditioners, a washer and a dryer, 1 smart lock, 4 Echo speakers and 7 other smart home devices. A Lutron Caseta Smart Hub Pro and a YoLink Smart Hub are on the IoT VLAN too.

## Addresses

The table holds only private addresses inside the lab. The Cloud Server is outside the lab and is not in it. Select the bar to open the table.

??? info "Show the address table"

    | Device | Host name | Address |
    | --- | --- | --- |
    | UXG-Fiber gateway | `yocum-uxg-01` | 192.168.1.1 |
    | Morgoth | `morgoth` | 192.168.1.3 |
    | Zog (VM on Bolg) | `zog` | 192.168.1.4 |
    | Morgoth IPMI | `morgoth-ipmi` | 192.168.1.6 |
    | PiHole | `pihole` | 192.168.1.7 |
    | APC SmartConnect | `apc-sc` | 192.168.1.8 |
    | Bolg | `bolg` | 192.168.1.9 |
    | Bolg IPMI | `bolg-ipmi` | 192.168.1.10 |
    | Sauron | `sauron` | 192.168.1.11 |
    | Sauron IPMI | `sauron-ipmi` | 192.168.1.13 |
    | ReadyNAS 3138 | `readynas3138` | 192.168.1.38 |
    | vCenter (VM on Bolg) | `vcenter` | 192.168.1.71 |
    | APC PowerChute Network Shutdown (VM on Bolg) | `apc-pc-va` | 192.168.1.72 |
    | Eaton Network-M2 card | `eaton-m2` | 192.168.1.73 |
    | APC Network Management Card | `apc-nmc` | 192.168.1.81 |
    | Suladan (VM on Bolg) | `suladan` | 192.168.1.103 |
    | Gothmog | `gothmog` | 192.168.1.104 |
    | GitOps Lab VMs on Sauron | See [GitOps Lab](../gitops.md) | 192.168.1.34, 192.168.1.200 to 192.168.1.206, 192.168.1.208 |
    | Front camera | `yocum-uvc-01` | 172.27.1.2 |
    | Side camera | `yocum-uvc-02` | 172.27.1.3 |
    | Backyard camera | `yocum-uvc-03` | 172.27.1.4 |
    | Driveway camera | `yocum-uvc-04` | 172.27.1.5 |
    | Shed camera | `yocum-uvc-05` | 172.27.1.6 |
    | Kitchen camera | `yocum-uvc-06` | 172.27.1.7 |
    | Front (second) camera, planned | `yocum-uvc-07` | 172.27.1.8 |
    | Shed (backyard) camera, planned | `yocum-uvc-08` | 172.27.1.9 |
    | Switches | `yocum-sw-01` to `yocum-sw-05` | 172.27.1.101 to 172.27.1.105 |
    | Wi-Fi access points | `yocum-ap-01` to `yocum-ap-03` | 172.27.1.111 to 172.27.1.113 |
    | Cloud Key Gen 2+ | `yocum-ck-01` | 172.27.1.125 |
    | Unifi NVR | `yocum-nvr-01` | 172.27.1.126 |
    | Lutron hub | `lutron-hub` | 172.27.2.16 |
    | YoLink hub | `yolink-hub` | 172.27.2.17 |

The records do not say which switch or access point has which management address. IPMI is a management controller on the server board. It gives remote access to the console and the power of the server.
