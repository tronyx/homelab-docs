# Globalscape Configuration

## Common File Deployments

Common files that we are asked to deploy to Globalscape:

- **Advanced Workflow** - Usually an `.aml` file.
- **Event Rules** - Usually a `.json` file.

You can read more about how these files/jobs are deployed in the [Globalscape Deployment Guide](../../../responsibilities/deployments/globalscape.md).


## Common Firewall Rules

- **Allow access to Google Storage Buckets:** In order for jobs running on the Globalscape Server to access/work with Google Storage Buckets you will need to submit a Firewall Request, specifically stating that the Server's access needs to first be opened up to the Internet, and then the access needs to be limited to port 443 to the pre-determined list of Google Cloud Platform Domains. Here is the current pre-determined list of GCP Domains and their corresponding IP addresses:

!!! tip

    You can get a current list by simply running this command from a CLI: nslookup storage.googleapis.com

| Domain | IP Address |
| ------ | ---------- |
| storage.googleapis.com | 142.250.190.251 |
| storage.googleapis.com | 142.250.191.27 |
| storage.googleapis.com | 142.250.217.27 |
| storage.googleapis.com | 142.251.35.187 |
| storage.googleapis.com | 142.251.40.155 |
| storage.googleapis.com | 142.251.40.187 |
| storage.googleapis.com | 142.251.41.187 |
| storage.googleapis.com | 142.251.45.187 |
| storage.googleapis.com | 142.250.64.91 |
| storage.googleapis.com | 142.250.64.123 |
| storage.googleapis.com | 142.250.72.123 |
| storage.googleapis.com | 142.250.80.27 |
| storage.googleapis.com | 142.250.80.59 |
| storage.googleapis.com | 142.250.81.251 |
| storage.googleapis.com | 142.250.176.219 |
| storage.googleapis.com | 142.250.188.27 |