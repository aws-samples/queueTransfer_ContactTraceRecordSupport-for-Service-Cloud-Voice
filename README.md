# queueTransfer_ContactTraceRecordSupport-for-Service-Cloud-Voice

Modifications have been made to the default ctrDataSync function code. These changes allow for support of the QUEUE_TRANSFER type initiation method to update Contact Trace Record (CTR) data into Service Cloud Voice (SCV). This method is currently (1/5/2024) unsuppoorted by Salesforce. https://developer.salesforce.com/docs/atlas.en-us.voice_developer_guide.meta/voice_developer_guide/voice_contact_flows.htm#:~:text=Service%20Cloud%20Voice%20doesn%E2%80%99t%20support%20queue%20transfers%20for,are%20available%20in%20Amazon%20Connect%20but%20not%20Salesforce.

## Deploy code
Overwrite the utils.js and handler.js modules of the ctrDataSync CTI Adapter function in your AWS account that contains the Amazon Connect instance for your SCV Implementation.

## Code Changes for default function
Added QUEUE_TRANSFER to array on line 34 of handler.js to support processing of the QUEUE_TRANSFER call initiation method

Added lines 80-86 in utils.js to modify the QUEUE_TRANSFER value of data passed to SCV to a supported type (TRANSFER). Optionally, add conditional for specific queues based on comment in code.
