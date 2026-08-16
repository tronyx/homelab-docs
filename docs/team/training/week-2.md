# Week Two

## Kofax Overview

Kofax Capture scans paper-based documents, creating a series of scanned image files. Or, Kofax Capture uses Import Connector - Email to retrieve emails, including attachments, from a server. Kofax Capture then routes the files through Kofax Transformation Modules, which separates pages into documents, classifies documents and extracts information. Within Kofax Transformation Modules these classification, separation and extraction results are presented for review by users. After all documents are validated in the attended modules, the batch is analyzed by Kofax Transformation Modules to increase the recognition of documents with the same layout by an online learning algorithm. Finally, the accurate, validated data and images are exported to a back-end system using Kofax Capture. 


## Batch Classes

Kofax Capture uses batch classes that are custom-designed for customer projects. A batch class describes how the documents in a batch are processed by Kofax Capture. During production, each new batch is based on a batch class definition that determines:

1. Which modules the images are processed by, and in which order
2. How images are separated into documents
3. How forms are identified
4. How images are cleaned up

A batch class contains one or more document classes, which in turn contain one or more form types. This gives you the ability to have different kinds of documents and forms within one batch. Kofax Capture can automatically separate the pages into documents and identify different types of forms.

All batches in Kofax Capture are defined by their batch class. Therefore, you must define a batch class before you scan or import documents.

Kofax Capture provides an object-oriented approach to setting up your batch classes. While some steps must be done before others, most can be done in any order.