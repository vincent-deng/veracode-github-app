const { default_organization_repository, ngrok } = require('../utils/constants');
const { shouldRunForRepository } = require('../services/dispatch-event-services/should-run');
const { dispatchEvents } = require('../services/dispatch-event-services/dispatch');

async function handlePush(app, context) {
  // handle branch deletion - will not trigger the process
  if(context.payload.deleted) return;
  // handle repository archiving - will not trigger the process
  // although we should not expect to see push event from an archived repository
  if(context.payload.repository.archived) return;
  app.log.info('Push event received');
  
  const branch = context.payload.ref.substring(11);
  const sha = context.payload.after;

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
    eventType: 'push',
    payload: {
      sha,
      branch,
      token: token.data.token,
      callback_url: `${ngrok}/register`,
      profile_name: context.payload.repository.name,
      repository: {
        owner: context.payload.repository.owner.login,
        name: context.payload.repository.name,
        full_name: context.payload.repository.full_name,
      }
    }
  }

  await dispatchEvents(dispatchEventData);
}

module.exports = {
  handlePush,
}