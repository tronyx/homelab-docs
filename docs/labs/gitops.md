---
title: GitOps Lab
description: A production-like Kubernetes platform on eight VMs on Sauron, built from code with Terraform, Ansible, GitLab and ArgoCD.
---

# GitOps Lab

The GitOps Lab is my second lab. I built it to run a Kubernetes platform the way a production team runs one. GitOps means that a Git repository describes what runs, and every change goes through a commit.

Everything in this lab is declarative. A declarative setup describes the end state, and a tool makes the systems match it. Terraform creates the VMs and Ansible prepares them. After that, ArgoCD applies what is in Git to the cluster. This page explains the lab around one diagram, which shows the lab on November 8, 2026.

## The diagram

[![Diagram of the GitOps Lab. On the left are the vSphere cluster with Sauron, Bolg and vCenter, the eight lab VMs on Sauron with their CPU, memory, disk and addresses, the kube-vip address, the MetalLB pool and the pod network. Below them is the GitOps flow from the workstation through GitLab and ArgoCD to the cluster workloads, with Keycloak, GitLab Runner, Vault and External Secrets Operator beside it, and a legend. On the right are the Kubernetes cluster with its control plane, workers and components, the DNS and TLS path from a LAN client through Pi-hole to Cloudflare and FreeIPA, the platform services by group, and the planned items.](../overrides/assets/images/lab/gitops.png)](../overrides/assets/images/lab/gitops.svg){ .glightbox data-type="image" }

Select the diagram to open it full screen. The full-screen version is an SVG file, so the text stays sharp when you zoom in. Dashed outlines on the diagram show planned items.

## Where it runs

The lab runs on the two-host vSphere cluster of my [Primary Lab](primary/index.md). The two hosts are [Sauron](primary/servers.md#sauron) and [Bolg](primary/servers.md#bolg), and vCenter 8.0.3 manages them. Each host has only a local datastore, so the cluster has no shared storage.

All eight lab VMs run on Sauron. Bolg runs none of them. Sauron and the lab VMs usually run only while I work on the lab. At other times, they are powered off.

All eight VMs run Oracle Linux 9. Terraform builds them from a template. Each VM has a fixed MAC address and a DHCP reservation, so it always gets the same address. Ansible then prepares the VMs. I run Terraform and Ansible from WSL2 on my workstation.

## The nodes

| Host name | Role | vCPU | Memory | Disk | Address |
| --- | --- | --- | --- | --- | --- |
| `k8s-cp-01` | Kubernetes control plane | 4 | 8 GB | 80 GB | 192.168.1.200 |
| `k8s-cp-02` | Kubernetes control plane | 4 | 8 GB | 80 GB | 192.168.1.201 |
| `k8s-cp-03` | Kubernetes control plane | 4 | 8 GB | 80 GB | 192.168.1.202 |
| `k8s-wrk-01` | Kubernetes worker | 8 | 16 GB | 150 GB | 192.168.1.203 |
| `k8s-wrk-02` | Kubernetes worker | 8 | 16 GB | 150 GB | 192.168.1.204 |
| `k8s-wrk-03` | Kubernetes worker | 8 | 16 GB | 150 GB | 192.168.1.205 |
| `gitlab-01` | GitLab CE in Docker | 4 | 8 GB | 150 GB | 192.168.1.206 |
| `ipa-01` | FreeIPA | 4 | 8 GB | 150 GB | 192.168.1.208 |

A control plane node runs the Kubernetes management parts. A worker node runs the application workloads. The cluster also uses these addresses:

- The Kubernetes API is at the kube-vip address 192.168.1.207, port 6443. This is a virtual IP address that moves to a healthy control plane node.
- MetalLB gives out service addresses from the pool 192.168.1.230 to 192.168.1.250.
- The pods get addresses from the pod network 10.244.0.0/16. This network exists only inside the cluster.

## The cluster

I built the cluster with kubeadm as a high-availability (HA) cluster. It has three control plane nodes, so it keeps running when one of them fails. Each control plane node runs etcd, the database of the cluster, next to the API server. This layout is called stacked etcd. kube-vip runs as a static pod on each control plane node and holds the API address.

These components run in the cluster:

- Cilium is the CNI, the network plugin that connects the pods. Hubble, which is part of Cilium, shows the network traffic between the pods. I kept kube-proxy next to Cilium.
- MetalLB gives each load balancer service an address from its pool. It works in L2 mode, in which one node answers for each address on the LAN.
- The vSphere CSI driver creates the persistent volumes as virtual disks on the datastore.
- ingress-nginx is the single entry point for web traffic. It has a MetalLB address and sends each request to a service by its host name.
- cert-manager gets the TLS certificates from Let's Encrypt.

The vSphere CSI driver uses a storage policy and the WaitForFirstConsumer mode. In this mode, the driver creates a volume only when a pod that uses it starts. The datastores are local, so a volume stays on the host that created it. It cannot move to the other host with its pod.

## The GitOps flow

The numbers match the steps of the GitOps flow on the diagram:

1. On my workstation, I use Terraform, Ansible, kubectl and Helm in WSL2. I write each change as a commit and push it to GitLab.
2. GitLab on `gitlab-01` holds the `gitops/manifests` repository. This repository describes what runs in the cluster. GitLab accepts Git over SSH on port 2222.
3. ArgoCD watches the repository and applies each change to the cluster. It uses the app-of-apps pattern. One root Application watches the `applications/` folder, and each file in that folder defines one more Application.
4. The workloads run on the worker nodes.

An ArgoCD Application connects a folder in Git to a place in the cluster. GitLab Runner runs the CI jobs of GitLab as pods in the cluster.

GitLab and FreeIPA run on their own VMs, outside the cluster. The cluster gets its configuration from GitLab, and the VMs get their accounts and DNS from FreeIPA. The cluster needs both of them to start, so I start them first.

I installed the first platform parts by hand, because ArgoCD was not there yet to apply them. Now that ArgoCD runs, every other change goes through Git.

## Identity and secrets

Keycloak gives single sign-on (SSO) with OIDC to ArgoCD, GitLab, Grafana and the Kubernetes API. For the Kubernetes API, I sign in to kubectl with the `oidc-login` plugin. Keycloak has the realm `homelab` with the group `platform-admins`. A realm is a separate set of users and settings in Keycloak. Keycloak keeps its data in its own Postgres StatefulSet, not in the Postgres that comes with its Helm chart.

FreeIPA on `ipa-01` manages these for the VMs:

- The user accounts and Kerberos sign-in on the VMs
- The sudo rules for each host
- The SSH keys of the users
- The DNS zone `lab.internal`

Vault keeps the secrets. External Secrets Operator (ESO) reads them from Vault and makes Kubernetes Secrets from them. No secret is in Git. Vault keeps its data in files on a persistent volume. When Vault restarts, it seals itself and cannot read its data. I then unseal it with three of its five key shares.

If Keycloak or FreeIPA fails, I still have break-glass access to the cluster, the VMs and Keycloak. Break-glass access is an emergency sign-in that does not need the failed system.

## DNS and TLS

Pi-hole is the DNS resolver of my LAN. When a computer on the LAN looks up a lab name, Pi-hole sends the question to one of two places:

- For a name under `chrisyocum.com`, Pi-hole asks Cloudflare DNS. These records point at private addresses and are DNS-only, so Cloudflare does not proxy the traffic.
- For a name under `lab.internal`, Pi-hole forwards the question to FreeIPA on `ipa-01`. This is called conditional forwarding.

The Cloudflare records point at ingress-nginx or at `gitlab-01`. cert-manager gets the certificates for ingress-nginx from Let's Encrypt with the DNS-01 challenge. In this challenge, cert-manager proves that I own the domain with a DNS record. It writes the record through a Cloudflare API token with a limited scope. `gitlab-01` gets its own certificate with certbot, which a systemd timer renews.

No port is forwarded from the internet to the lab. The certificates need no inbound access, because the DNS-01 challenge works through DNS only.

## Observability and CI

These parts watch the lab and run its CI jobs:

- VictoriaMetrics handles the metrics. VMAgent collects them, VMSingle stores them and VMAlert checks the alert rules.
- Loki stores the logs. It runs as a single binary.
- Grafana Alloy is the collector agent. It runs as a DaemonSet, which puts one copy on each node. On `gitlab-01` and `ipa-01`, it runs as a systemd service.
- Grafana shows the dashboards. I sign in to it through Keycloak.
- GitLab Runner uses the Kubernetes executor, which runs each CI job as a pod. Its token comes from Vault through ESO.

## Planned

- Add NetBox for DCIM and IPAM. It will record the hardware, the cables and the addresses of the lab.
- Add Velero to back up the cluster to MinIO on a NAS.
- Expand the monitoring (phase 14 of my build plan) with alert rules, an Alertmanager receiver, and metrics from etcd and kube-vip.
- Do a hardening pass on the lab.
- Deploy mock apps to test high availability and failover.

The [Primary Lab overview](primary/index.md#planned) lists the planned work for the servers, such as the move of Sauron to Proxmox.
