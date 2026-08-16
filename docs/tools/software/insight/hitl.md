# Human-In-The-Loop

## About

Iron Mountain InSight Human-in-the-Loop (HITL) brings humans into the automated machine learning (ML) loop when manual user intervention is required to correct or complete a document. During ingestion, Iron Mountain InSight flags document type classifications or input fields that contain

ML confidence scores below the threshold defined by your organization. These documents are categorized as exceptions, and added to an exception queue for review. Users with the role of labeler then manually review each document in the exception queue, using the scanned document to verify and update document type classifications and field values that have confidence scores below the defined threshold. Depending on the interface and workspace settings, Labelers can also update classifications and field values above the confidence threshold.

InSight’s HITL audit feature and dashboard widgets make it easy for Managers to monitor program analytics and ensure that document type classifications and document exceptions are corrected in a timely manner. HITL’s administrator features let Managers customize project and interface settings per classification and document type. Managers can also monitor and modify resources (users), user groups, exception task queues, and customize task requirements from within the HITL application.


### HITL User Roles

Managers have the following capabilities:
• Add, remove, and modify users
• Create and manage user groups
• Create and manage task queues
• Assign user groups to specific task queues
• Monitor classification and exception queues, batch volume and activity, and other document analytics
• Modify the label interface or labeler workspace, classification settings, document types, and field label order
• Access document audit history and exception statuses

Labelers have the following capabilities:
• Access documents added to the classification and exception queues during ingestion
• Review, update, and submit documents in the classification and exception queues
• Split large documents to support classification and exception processing
• Audit and escalate exceptions to a Manager
• Reject documents that do not meet established criteria

The following are HITL user roles:

Labeler:
HITL Exceptions Labeler: Data Entry and Document type corrections
Reviewer:
HITL Reviewer: This is a specific case when review flow is enabled for a document type
Admin:
HITL Project Admin: Manager who manages HITL application for a tenant
Instance Admin:
HITL Instance Admin: Super user for technical support
Human-in-the-Loop
Supervisor:
HITL Supervisor: Manages HITL app and has the ability to do labeler role
Resource Manager:
HITL Resource Manager: To Manage Resources only

### Deploying HITL to an Environment

1. Access FARM.
2. Click Runtime and select the appropriate project.
3. Select the External Applications tab.
4. Click HITL Environments.
5. Select the appropriate release version.
6. Click Deploy.


## Manager Dashboard & Sidebar