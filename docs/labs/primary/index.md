---
title: Primary Lab
description: My home lab on one diagram, with pages for the network, servers, applications, cameras, storage, backups, rack and power.
---

# Primary Lab

The Primary Lab is my home lab. It runs the media server, home automation, monitoring and backups for my house. A rented VPS outside the house runs the services that must stay up when the lab is down. These pages explain the lab around one diagram, which shows the lab on November 7, 2026.

## The diagram

[![Diagram of the Primary Lab. At the top are the internet, the cable modem, the UXG-Fiber gateway, the aggregation switch and the Cloud Server. In the middle are the servers Morgoth, Bolg and Sauron with their VMs and containers, and the Unifi NVR with the cameras. At the bottom are the USW-48 switch, Gothmog, the ReadyNAS, the PoE and Flex switches, the Wi-Fi access points, the backups, the 45U rack with its power map, and the client devices by type.](../../overrides/assets/images/lab/lab.png)](../../overrides/assets/images/lab/lab.svg){ .glightbox data-type="image" }

Select the diagram to open it full screen. The full-screen version is an SVG file, so the text stays sharp when you zoom in. Dashed outlines on the diagram show planned items.

## The pages

- [Network](network.md): the internet link, switches, VLANs, cables, VPNs, Wi-Fi, client devices and addresses.
- [Servers](servers.md): the physical servers, the VMs and the Cloud Server, with roles and hardware.
- [Applications](applications.md): the Docker containers on each host, and how they get their updates.
- [Cameras](cameras.md): the Unifi Protect cameras, with models and states.
- [Storage and backups](storage-and-backups.md): the Unraid arrays, the ReadyNAS shares and the backup flows.
- [Rack and power](rack-and-power.md): the 45U rack and the map from each UPS to its devices.

The [GitOps Production-like Lab](../gitops.md) runs on VMs on Sauron.

## Planned

- Add a second Unifi AP-U6-LR in the Garage. It needs conduit buried in the yard.
- Install the Unifi UVC G6 Bullet for the Front (second) camera.
- Add a Unifi UVC G6 Bullet on the backyard side of the Shed.
- Replace the dead Unifi UVC G4 Instant in the Shed.
- Convert Sauron to Proxmox and retire Bolg.
- Move the servers to the SLAN VLAN 15 (172.27.1.224/27).
- Remove the old USG-4P from U45 and fit a blank panel.
- Fix the automatic vCenter configuration backups to the ReadyNAS.
