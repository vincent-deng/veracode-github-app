const { addDispatchEvents } = 
  require('../dispatch-event-services/add-dispatch-events');
const { getVeracodeConfig } = 
  require('../dispatch-event-services/get-veracode-config');

async function dispatchEvents(dispatchEventData) {
  const veracodeConfig = await getVeracodeConfig(
    dispatchEventData.context, 
    dispatchEventData.payload.sha
  );
  const dispatchEvents = await addDispatchEvents(
    dispatchEventData.payload.branch, 
    veracodeConfig, 
    dispatchEventData.context, 
    dispatchEventData.eventType
  );

  let requests = dispatchEvents.map(event => 
    createDispatchEvent(event, dispatchEventData));
  await Promise.all(requests);
}

const createDispatchEvent = async function (event, dispatchEventData) {
  console.log(event);
  context = dispatchEventData.context;
  await context.octokit.repos.createDispatchEvent({
    owner: context.payload.repository.owner.login,
    repo: event.repository,
    event_type: event.event_trigger,
    client_payload: {
      ...dispatchEventData.payload,
      event: context.payload,
      event_type: event.event_type
    }
  });
}

module.exports = {
  dispatchEvents,
}