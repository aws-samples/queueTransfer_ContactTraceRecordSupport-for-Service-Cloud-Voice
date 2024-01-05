const SCVLoggingUtil = require("./SCVLoggingUtil");

const ERROR_DISCONNECT_REASON = [
  "TELECOM_PROBLEM",
  "CONTACT_FLOW_DISCONNECT",
  "OTHER",
];

/**
 * Filter call attributes to be included in API payload based on prefix and strip prefix
 *
 * @param {object} rawCallAttributes - Contact flow attributes
 *
 * @return {string} - Stringified contact flow attributes with prefix removed
 */
function getCallAttributes(rawCallAttributes) {
  const prefix = "sfdc-";
  const prefixLen = prefix.length;
  const callAttributes = {};

  Object.keys(rawCallAttributes).forEach((key) => {
    if (key.startsWith(prefix)) {
      callAttributes[key.substring(prefixLen)] = rawCallAttributes[key];
    }
    // Set SCV Limits Error if the specific contact attribute is set
    if (rawCallAttributes.sf_realtime_transcription_status) {
      callAttributes.sf_realtime_transcription_status =
        rawCallAttributes.sf_realtime_transcription_status;
    }
  });
  return callAttributes;
}

function transformCTR(ctr) {
  const voiceCall = {};

  voiceCall.startTime = ctr.InitiationTimestamp;
  voiceCall.endTime = ctr.DisconnectTimestamp;
  voiceCall.parentCallIdentifier = ctr.PreviousContactId;
  voiceCall.disconnectReason = {
    value: ctr.DisconnectReason,
    isError: ERROR_DISCONNECT_REASON.includes(ctr.DisconnectReason),
  };

  if (ctr.Agent) {
    voiceCall.acceptTime = ctr.Agent.ConnectedToAgentTimestamp;
    voiceCall.totalHoldDuration = ctr.Agent.CustomerHoldDuration;
    voiceCall.longestHoldDuration = ctr.Agent.LongestHoldDuration;
    voiceCall.agentInteractionDuration = ctr.Agent.AgentInteractionDuration;
    voiceCall.numberOfHolds = ctr.Agent.NumberOfHolds;
  }

  if (ctr.Queue) {
    voiceCall.enqueueTime = ctr.Queue.EnqueueTimestamp;
    voiceCall.queue = ctr.Queue.Name;
  }

  if (ctr.InitiationMethod) {
    // Convert API initiationMethod CTR to INBOUND
    voiceCall.initiationMethod =
      ctr.InitiationMethod === "API" ? "INBOUND" : ctr.InitiationMethod;
    if (
      ctr.InitiationMethod === "OUTBOUND" ||
      ctr.InitiationMethod === "CALLBACK"
    ) {
      if (ctr.SystemEndpoint) {
        voiceCall.fromNumber = ctr.SystemEndpoint.Address;
      }
      if (ctr.CustomerEndpoint) {
        voiceCall.toNumber = ctr.CustomerEndpoint.Address;
      }
    } else {
      if (ctr.SystemEndpoint) {
        voiceCall.toNumber = ctr.SystemEndpoint.Address;
      }
      if (ctr.CustomerEndpoint) {
        voiceCall.fromNumber = ctr.CustomerEndpoint.Address;
      }
    }
    //Convert QUEUE_TRANSFER method to a TRANSFER for SCV support
    //Optional- Add condition to check ARN of source queue if only certain queue transfers should have records updated in SCV
    // if (ctr.InitiationMethod === "QUEUE_TRANSFER" && ctr.Queue.ARN.includes(<QueueID GUID as string>))
    if (ctr.InitiationMethod === "QUEUE_TRANSFER"){
        //Convert QUEUE_TRANSFER initiationMethod CTR to TRANSFER
        voiceCall.initiationMethod = "TRANSFER";
    }
  }

  if (ctr.Recording) {
    voiceCall.recordingLocation = ctr.Recording.Location;
  }

  // Check if there are custom contact attributes
  if (ctr.Attributes) {
    let callAttributes = {};

    // Get contact attributes data into call attributes
    callAttributes = getCallAttributes(ctr.Attributes);
    // Add custom fields here
    voiceCall.callAttributes = JSON.stringify(callAttributes);
  }

  Object.keys(voiceCall).forEach((key) => {
    if (voiceCall[key] === null || voiceCall[key] === undefined) {
      delete voiceCall[key];
    }
  });

  SCVLoggingUtil.info({
    message: "transform CTR data",
    context: { contactId: ctr.ContactId },
  });
  return { contactId: ctr.ContactId, fields: voiceCall };
}

function parseData(data) {
  const payload = Buffer.from(data, "base64").toString("utf8");
  return JSON.parse(payload);
}
module.exports = {
  transformCTR,
  getCallAttributes,
  parseData,
};