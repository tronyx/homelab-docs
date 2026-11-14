---
title: Applications
description: The Docker containers on each host of my Primary Lab, and how they get their updates.
---

# Applications

This page is part of my [Primary Lab](index.md).

All applications run in Docker containers on the hosts in [Servers](servers.md). The tables give the application name and the container names. Database and cache containers are on the same line as their application.

Updates reach the containers through one flow. Renovate runs on the Forgejo Runner on the Cloud Server and opens pull requests in Forgejo. For most stacks, Komodo Core on Suladan then deploys the merged change. For the critical stacks, such as the proxy and Forgejo, I click Deploy in Komodo ([Critical stacks and recovery](../docker-updates/critical-stacks.md)). Komodo Periphery runs the containers on Suladan and on the Cloud Server. The [Automated Docker updates](../docker-updates/index.md) guide explains the full setup.

## Suladan

Komodo manages the stacks on Suladan.

| Application | Containers |
| --- | --- |
| Cloudflare DDNS | `cfddns` |
| Dashbrr | `dashbrr`, `dashbrr-postgres`, `dashbrr-redis` |
| Dozzle | `dozzle` |
| Home Assistant | `homeassistant` |
| Homebridge | `homebridge` |
| Komodo Core | `komodo-core`, `komodo-mongo` |
| Komodo Periphery | `komodo-periphery` |
| Nagios | `nagios` |
| Nebula Sync | `nebula-sync` |
| Netdata | `netdata` |
| Netronome | `netronome`, `netronome-postgres` |
| Organizr | `organizr` |
| Pi-hole Backup | `pihole-backup` |
| qui | `qui` |
| Reality Curber | `reality-curber` |
| Reaper | `reaper` |
| SMTP Relay | `smtp_relay` |
| Sonarr Checker | `sonarr-checker` |
| Sonarr Checker Anime | `sonarr-checker-anime` |
| SWAG | `swag` |
| Tautulli | `tautulli` |
| Tdarr Server | `tdarr-server` |
| Tracearr | `tracearr`, `tracearr-redis`, `tracearr-timescaledb` |
| UnPoller | `unpoller` |

## Morgoth

| Application | Containers |
| --- | --- |
| Autoscan | `autoscan` |
| Bazarr | `bazarr` |
| Grafana | `Grafana` |
| ImageMaid | `imagemaid` |
| InfluxDB 3 | `influxdb3` |
| Intel GPU Telegraf | `intel-gpu-telegraf` |
| Kometa | `kometa` |
| Lidarr | `lidarr` |
| Notifiarr | `Notifiarr` |
| Plex | `plex` |
| Plex Auto Languages | `plex-auto-languages` |
| Prowlarr | `prowlarr` |
| qBittorrent | `qbit` |
| Radarr | `radarr` |
| Radarr 4K | `radarr4k` |
| Radarr Anime | `radarr-anime` |
| Romaji Renamer | `romaji-renamer` |
| SABnzbd | `sabnzbd` |
| Scrutiny | `scrutiny` |
| Seerr | `seerr` |
| Sonarr | `sonarr` |
| Sonarr 4K | `sonarr4k` |
| Sonarr Anime | `sonarr-anime` |
| Telegraf | `telegraf` |
| Unpackerr | `unpackerr` |

InfluxDB 3, Grafana and the two Telegraf containers are the metrics stack. See [Monitoring](monitoring.md).

Three of these containers are jobs, not services. A script in the Unraid User Scripts plugin starts Kometa and Romaji Renamer as one stack on a cron schedule. I run ImageMaid by hand when it is necessary.

## Gothmog

| Application | Containers |
| --- | --- |
| Scrutiny | `scrutiny` |
| Telegraf | `telegraf` |

## Cloud Server

| Application | Containers |
| --- | --- |
| Forgejo | `forgejo`, `forgejo-postgres` |
| Forgejo Runner | `forgejo-runner`, `forgejo-dind` |
| Healthchecks | `healthchecks` |
| Immich | `immich`, `immich-ml`, `immich-postgres`, `immich-valkey` |
| Komodo Periphery | `komodo-periphery` |
| Nextcloud | `nextcloud`, `nextcloud-postgres`, `nextcloud-redis` |
| Snipe-IT | `snipe-it`, `snipe-it-mariadb`, `snipe-it-redis` |
| SWAG | `swag-vps` |
| Uptime Kuma | `uptime-kuma` |
| Vaultwarden | `bitwarden` |
| WordPress | `wordpress`, `wordpress-mariadb`, `wordpress-redis` |
| Zipline | `zipline`, `zipline-postgres` |

The Forgejo Runner runs Renovate.
