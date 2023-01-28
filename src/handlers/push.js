const { 
  default_organization_repository, 
  ngrok
} = require('../utils/constants');
const { shouldRun } = require('../utils/should-run');
const { getRepositoryDispatchType } = require('../services/get-repository-dispatch-type');

let repository_dispatch_type = 'veracode-policy-scan'
const config_path = 'organization-workflows-settings.yml'

async function handlePush(context) {
  if(context.payload.deleted) return; // handle branch deletion - will not trigger the process

  const { config } = await context.octokit.config.get({
    owner: context.payload.repository.owner.login,
    repo: default_organization_repository,
    path: config_path,
    defaults: {
      workflows_repository: default_organization_repository,
      include_workflows_repository: false,
      exclude: {
        repositories: []
      }
    }
  });

  const excludedRepositories = config.exclude.repositories;

  if (!config.include_workflows_repository) {
    excludedRepositories.push(config.workflows_repository)
  }

  if(!shouldRun(context.payload.repository.name, excludedRepositories)) {
    return;
  }

  repository_dispatch_type = await getRepositoryDispatchType(context);

  const sha = context.payload.after
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
      callback_url: `${ngrok}/register`,
      repository: {
        owner: context.payload.repository.owner.login,
        name: context.payload.repository.name,
        full_name: context.payload.repository.full_name,
      }
    }
  }

  const dispatchEvents = [repository_dispatch_type, 'veracode-sca-scan', 'veracode-container-security'];
  let requests = dispatchEvents.map(event_type => createDispatchEvent(event_type, dispatchEventData));
  await Promise.all(requests);
}

const createDispatchEvent = async function (event_type, dispatchEventData) {
  context = dispatchEventData.context;
  await context.octokit.repos.createDispatchEvent({
    owner: context.payload.repository.owner.login,
    repo: dispatchEventData.default_organization_repository,
    event_type: event_type,
    client_payload: {
      token: dispatchEventData.token.data.token,
      ...dispatchEventData.payload,
      event: context.payload
    }
  });
}

module.exports = {
  handlePush,
}