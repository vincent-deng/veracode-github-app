const { default_organization_repository, ngrok } = require('../utils/constants');
const { shouldRunForRepository } = require('../services/dispatch-event-services/should-run');
const { addDispatchEvents } = require('../services/dispatch-event-services/add-dispatch-events');
const { getVeracodeConfig } = require('../services/dispatch-event-services/get-veracode-config');

async function handlePush(app, context) {
  // handle branch deletion - will not trigger the process
  if(context.payload.deleted) return; 
  app.log.debug('Push event received');
  
  const branch = context.payload.ref.substring(11);
  const sha = context.payload.after;

  const veracodeConfig = await getVeracodeConfig(context, sha);
  const dispatchEvents = await addDispatchEvents(branch, veracodeConfig, context, 'push');

  // TODO: add a configuration file in the default organization repository
  // to specify which repositories should not trigger the process
  const excludedRepositories = [default_organization_repository];
  if(!shouldRunForRepository(context.payload.repository.name, excludedRepositories)) {
    return;
  }

  const token = await context.octokit.apps.createInstallationAccessToken({
    installation_id: context?.payload?.installation?.id || 0,
    repository_ids: [context.payload.repository.id]
  })

  const dispatchEventData = {
    context,
    token,
    default_organization_repository,
    payload: {
      sha,
      branch,
      callback_url: `${ngrok}/register`,
      repository: {
        owner: context.payload.repository.owner.login,
        name: context.payload.repository.name,
        full_name: context.payload.repository.full_name,
      }
    }
  }
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
      token: dispatchEventData.token.data.token,
      ...dispatchEventData.payload,
      event: context.payload,
      event_type: event.event_type
    }
  });
}

module.exports = {
  handlePush,
}