# CTERA

CTERA is a provider of enterprise file services software. The company's flagship product, the CTERA Enterprise File Services Platform, enables organizations to connect remote users and sites to their cloud storage without compromising security or performance.

The CTERA Global File System is the foundation of the CTERA Enterprise File Services Platform. It is a software-defined global file system that provides a single namespace for all files, regardless of where they are stored. This allows users to easily access their files from anywhere, on any device.


## Design Breakdown

A quick breakdown of FISMA CTERA sync - We have 4 Tomcat Servers and 2 Database Servers. The Tomcat Servers are the basis for the entire cloud sync. Our CTERA gateways are the equivalent of our Kofax Application Servers that handle the work of keeping everything synced.

The 2 DBs are the brains. They are the SQL Databases of CTERA that house, hold, and organizes all the information CTERA uses to cloud sync.


## Global File System

The CTERA Global File System is powered by a number of innovative technologies, including:

- **Global deduplication:** This technology ensures that only unique data is stored in the cloud, which significantly reduces storage costs.
- **Global compression:** This technology further reduces storage requirements by compressing data before it is transferred to the cloud.
- **Global caching:** This technology caches frequently accessed files on local devices, which improves performance for users.
- **Global replication:** This technology ensures that files are always available, even if a remote site or user is offline.


## Additional Features

In addition to the CTERA Global File System, the CTERA Enterprise File Services Platform also includes a number of other features, such as:

- **File sync and share:** This feature allows users to easily share files with others, both inside and outside of the organization.
- **Data protection:** The CTERA Enterprise File Services Platform includes a number of features to protect data, such as encryption, auditing, and replication.
- **Compliance:** The CTERA Enterprise File Services Platform is designed to meet the compliance requirements of a wide range of industries, including healthcare, financial services, and government.

The CTERA Enterprise File Services Platform is a comprehensive solution for organizations that need to connect remote users and sites to their cloud storage. The platform's innovative technologies and features provide a secure, reliable, and easy-to-use way to access files from anywhere.


## Benefits

Here are some of the benefits of using CTERA:

- **Increased productivity:** Users can easily access their files from anywhere, on any device, which can improve productivity.
- **Reduced costs:** CTERA can help organizations reduce storage costs by using global deduplication and compression.
- **Improved security:** CTERA's security features can help organizations protect their data from unauthorized access.
- **Enhanced compliance:** CTERA can help organizations meet the compliance requirements of a wide range of industries.


## Standard Directory Structure

Our standard CTERA folders:

| Directory | Description |
| --------- | ----------- |
| `C:\CTERA\CaptureSV` | Captures folder. |
| `C:\CTERA\Databases` | Lookup DB folder. |
| `C:\CTERA\Scripts` | Folder to place all script files. |
| `C:\CTERA\Release` | Central Release folder. [^1] |
| `C:\CTERA\{SITE}\Images` | Temp Image folder. |
| `C:\CTERA\IMImages` | For standard batch classes. [^2] |
| `C:\CTERA\SharedImages` | Multi-site Batch classes. |
| `C:\CTERA\RemoteSite\{SITE}` | Remote Release folder. |
| `C:\CTERA\TRK` | For releasing track files. |

[^1]: Discontinued as we are using non-ctera fileshare for central release in NA.
[^2]: We encourage to use the above site specific folder with site specific batch class.