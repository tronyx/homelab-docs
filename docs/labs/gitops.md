---
title: GitOps Production-like Lab
description: A Kubernetes cluster, GitLab and FreeIPA on VMs on Sauron, built to work like a production setup.
---

# GitOps Production-like Lab

The GitOps Lab is a set of VMs that I use to build a setup that works like a production environment. GitOps means that a Git repository describes what runs, and every change goes through a reviewed commit. The lab has a Kubernetes cluster, a GitLab server, a FreeIPA server and a playground VM.

## Where it runs

All VMs run on [Sauron](primary/servers.md#sauron), the backup ESXi server of my [Primary Lab](primary/index.md). They are on the LAN. The VMs run only while I work on this lab. At other times, they are powered off.

## The VMs

The Kubernetes cluster has three control plane nodes and three worker nodes. A control plane node runs the Kubernetes management components. A worker node runs the application workloads.

| VM | Role | Address |
| --- | --- | --- |
| `k8s-cp-01` | Kubernetes control plane node | 192.168.1.200 |
| `k8s-cp-02` | Kubernetes control plane node | 192.168.1.201 |
| `k8s-cp-03` | Kubernetes control plane node | 192.168.1.202 |
| `k8s-wrk-01` | Kubernetes worker node | 192.168.1.203 |
| `k8s-wrk-02` | Kubernetes worker node | 192.168.1.204 |
| `k8s-wrk-03` | Kubernetes worker node | 192.168.1.205 |
| `gitlab-01` | GitLab | 192.168.1.206 |
| `ipa-01` | FreeIPA | 192.168.1.208 |
| `playground` | Playground | 192.168.1.34 |

I plan to convert Sauron to Proxmox and retire Bolg. The [Primary Lab overview](primary/index.md#planned) lists all planned work.
