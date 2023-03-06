const { ngrok } = require('../../utils/constants');
const { addDispatchEvents } = 
  require('../dispatch-event-services/add-dispatch-events');
const { getVeracodeConfig } = 
  require('../dispatch-event-services/get-veracode-config');

async function dispatchEvents(run, context, eventType) {
  const dispatchEventData = {
    context,
    payload: {
      sha: run.sha,
      branch: run.branch,
      callback_url: `${ngrok}/register`,
      run_id: run.run_id,
      profile_name: run.repository_name,
      repository: {
        owner: context.payload.repository.owner.login,
        name: run.repository_name, //???
        full_name: context.payload.repository.full_name,
      }
    }
  }

  const veracodeConfig = await getVeracodeConfig(context, run.sha);
  const dispatchEvents = await addDispatchEvents(run.branch, veracodeConfig, context, eventType);

  let requests = dispatchEvents.map(event => createDispatchEvent(event, dispatchEventData));
  await Promise.all(requests);
}

const createDispatchEvent = async function (event, dispatchEventData) {
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