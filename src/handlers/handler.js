const { shouldRunForRepository } = require('../services/config-services/should-run');
const { default_organization_repository, ngrok } = require('../utils/constants');
const { getDispatchEvents } = require('../services/dispatch-event-services/get-dispatch-events');
const { createDispatchEvent } = require('../services/dispatch-event-services/dispatch');

async function handleEvents(app, context) {
  // handle branch deletion - will not trigger the process
  if(context.payload.deleted) return;

  // handle repository archiving - will not trigger the process
  // although we should not expect to see push event from an archived repository
  if(context.payload.repository.archived) return;

  // handle excluded repositories
  // TODO: add a configuration file in the default organization repository
  // to specify which repositories should not trigger the process
  const excludedRepositories = [default_organization_repository];
  if(!shouldRunForRepository(context.payload.repository.name, excludedRepositories))
    return;

  const branch = context.name === 'push' ? 
    context.payload.ref.replace('refs/heads/', '') : context.payload.pull_request.head.ref;
  const sha = context.payload.after; 

  const dispatchEvents = await getDispatchEvents(app, context, branch);

  const token = await context.octokit.apps.createInstallationAccessToken({
    installation_id: context?.payload?.installation?.id || 0,
    repository_ids: [context.payload.repository.id]
  })

  const dispatchEventData = {
    context,
    payload: {
      sha,
      branch,
      token: token.data.token,
      callback_url: `${ngrok}/register`,
      // TODO: read veracode.yml to get profile name
      profile_name: context.payload.repository.full_name, 
      repository: {
        owner: context.payload.repository.owner.login,
        name: context.payload.repository.name,
        full_name: context.payload.repository.full_name,
      }
    }
  }

  const requests = dispatchEvents.map(event => createDispatchEvent(event, dispatchEventData));
  await Promise.all(requests);
}

module.exports = {
  handleEvents,
}