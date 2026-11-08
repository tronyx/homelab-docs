---
title: Rack and power
description: The 45U rack of my Primary Lab and the map from each UPS to its PDU and devices.
---

# Rack and power

This page is part of my [Primary Lab](index.md).

## Rack

The rack has 45 units (45U). U1 is at the bottom. The table lists the front from top to bottom.

| Units | Equipment |
| --- | --- |
| U45 | Old Unifi USG-4P, powered off. It will be removed and replaced by a blank panel. |
| U44 | 24-port CAT6 patch panel |
| U43 | Cable hide |
| U42 | USW-48 |
| U41 | Cable hide |
| U40 | 24-port CAT6 patch panel |
| U39 | Aggregation switch |
| U38 | Cloud Key Gen 2+ |
| U37 | UXG-Fiber gateway |
| U36 | ReadyNAS 3138 |
| U35 | Blank panel |
| U34 | Unifi NVR |
| U31 to U33 | Empty |
| U29 to U30 | Bolg |
| U27 to U28 | Sauron |
| U26 | Empty |
| U25 | MT-VIKI 19" LCD KVM switch |
| U24 | Empty |
| U20 to U23 | Morgoth |
| U12 to U19 | Gothmog and its DAS (4U each) |
| U10 to U11 | CyberPower CP1500 UPS |
| U8 to U9 | TrippLite SMART1500LCD UPS |
| U6 to U7 | APC SMT3000 UPS |
| U4 to U5 | Eaton 5PX 3000 UPS |
| U2 to U3 | Eaton 5PX extended battery module |
| U1 | Empty |

The rear of the rack holds three Tripp-Lite 30A PDUs and a shelf. The shelf holds the 8-Port PoE Switch, the PiHole, the cable modem, the Lutron hub and the YoLink hub.

## Power

Four UPS units power the lab. Three of them feed a PDU each. Morgoth and Bolg have two power supplies each, and each supply is on a different UPS.

| UPS | Feeds | Devices |
| --- | --- | --- |
| Eaton 5PX 3000, with an extended battery module and a Network-M2 card | PDU 1 | Morgoth (PSU 1), Bolg (PSU 1), USW-48, 8-Port PoE Switch, aggregation switch. Through PoE: Cloud Key Gen 2+ and PiHole. |
| APC SMT3000, with a Network Management Card | PDU 2 | Morgoth (PSU 2), Bolg (PSU 2), YoLink hub, Lutron hub, Sauron (PSU 1 and PSU 2), Gothmog, Gothmog DAS |
| TrippLite SMART1500LCD | PDU 3 | UXG-Fiber gateway, cable modem, KVM, Unifi NVR |
| CyberPower CP1500 | No PDU | ReadyNAS 3138 only |

The ReadyNAS monitors the CyberPower UPS over USB and shuts itself down. The APC PowerChute Network Shutdown VM on [Bolg](servers.md#bolg) is the shutdown agent for the APC UPS.
