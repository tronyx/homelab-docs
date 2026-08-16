# Kofax

Kofax Capture 11 is a document capture software that helps organizations automate the process of capturing, converting, and extracting data from paper and electronic documents. It is a powerful and versatile platform that can be used to capture a wide variety of documents, including invoices, contracts, receipts, and forms. Kofax Capture 11 offers a number of features that make it a valuable tool for organizations of all sizes. These features include:

- **Automatic document classification:** Kofax Capture 11 can automatically classify documents based on their content, which can help organizations to quickly and easily find the information they need.
- **Data extraction:** Kofax Capture 11 can extract data from documents and transform it into a format that can be easily imported into other applications. This can help organizations to save time and money by automating manual data entry processes.
- **Document workflow automation:** Kofax Capture 11 can automate the routing of documents through a predefined workflow, which can help organizations to improve efficiency and compliance.
- **Compliance support:** Kofax Capture 11 is compliant with a wide range of industry regulations, including HIPAA, PCI DSS, and SOX. This can help organizations to protect sensitive data and avoid costly fines.

Kofax Capture 11 is a powerful and versatile document capture software that can help organizations to improve efficiency, compliance, and productivity. If you are looking for a solution to automate the process of capturing, converting, and extracting data from paper and electronic documents, then Kofax Capture 11 is a great option. Here are some of the key benefits of using Kofax Capture 11:

- **Increased efficiency:** Kofax Capture 11 can automate many of the manual tasks involved in document capture, such as sorting, classifying, and extracting data. This can free up employees to focus on more strategic tasks, improving overall efficiency.
- **Improved accuracy:** Kofax Capture 11 uses advanced optical character recognition (OCR) and machine learning technologies to extract data from documents with high accuracy. This can help to reduce errors and improve the quality of data.
- **Enhanced compliance:** Kofax Capture 11 is compliant with a wide range of industry regulations, including HIPAA, PCI DSS, and SOX. This can help organizations to protect sensitive data and avoid costly fines.
- **Reduced costs:** Kofax Capture 11 can help organizations to reduce costs by automating manual tasks, improving accuracy, and reducing errors.


## IM Modules

Iron Mountain builds and maintains custom Kofax 11 modules that sort, organize, and manipulate scanned images for customer projects. Each batch class can use one or many of these modules depending on customer need.


## Examples of IM Modules

### GDIT

- **IM1** - Import Special Media
- **IM2** - Thumbnail creation.
- **IM3 (Release)** - PDF (Portable Document Format) files are moved from CaptureSV to Release Folder, ready for customer delivery.
- **IM4** - Match and merge scanned images from multiple sources.
- **IM5** - Remove blank pages
- **IM6** - CTERA Image sync validation script / barcode reading
- **IM7 (PDF Gen)** - PDF (Portable Document Format) Creation. Kofax uses this module to convert raw image data and present it in PDF (Portable Document Format).


### IRS

- **IM2** - Thumbnail creation.
- **IM3 (Release)** - PDF (Portable Document Format) files are moved from CaptureSV to Release Folder, ready for customer delivery.
- **IM30** - Sends the batch to the Cloud or on-prem IDP Cluster for processing.


## Kofax Specifics

### Webstatus/Reports

Our Configuration/Implementation teams have develops web-based reporting based on SQL to assist Operations personnel in both tracking and observing how many scanned images they have processed over a period of time. These reports update in real-time to provide a better understanding of successful transmissions to the customer and also to better understand any issues that we may be experiencing.

Links to specific reporting sites can be found [HERE](https://sites.google.com/ironmountain.com/na-dms-itar/knowledge-base/tools/imreports).

Reporting sites are hosted on `USNUSGMKX11WP02`.


### TRK Files

TRK (Track) is a methodology/process that is used by the ITAR team to follow files as they move through the Kofax workflow and are delivered to the customer. TRK allows us to determine if there were any issues delivering files to a customer, often before, the customer is able to notice. This allows us to stay ahead of the game and catch any errors/issues. TRK files are processed by the IMShort application which runs on our Reports server (USNUSGMKX11WP02).


### SQL

We use SQL (Structured Query Language) often in our daily duties. Data from Kofax, manifests, etc is gathered in databases and can be queried via Microsoft SQL Server Management Studio.

Tracking physical media is one part of SQL database management. Manifests for physical media are loaded into SQL via a CSV (Comma-separated Values) file. The data is then sorted into columns and rows based on header info within the CSV file.

The FISMA Central SQL server is USNUSGMALSQLP01. Commonly used queries can be found on the public desktop.

It is crucial that proper syntax is followed within the SQL environment as any changes made can impact an entire database if statements are not entered thoroughly.