const { 
  default_organization_repository, 
  ngrok
} = require('../utils/constants');
const { shouldRun } = require('../utils/should-run');

const repository_dispatch_type = 'veracode-policy-scan'
const config_path = 'organization-workflows-settings.yml'

async function handlePush(context) {
  // handle branch deletion - will not trigger the process
  if(context.payload.deleted) return;

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

  const sha = context.payload.after
  const token = await context.octokit.apps.createInstallationAccessToken({
    installation_id: context?.payload?.installation?.id || 0,
    repository_ids: [context.payload.repository.id]
  })

  const data = {
    sha,
    callback_url: `${ngrok}/register`,
    repository: {
      owner: context.payload.repository.owner.login,
      name: context.payload.repository.name,
      full_name: context.payload.repository.full_name,
    }
  }

  await context.octokit.repos.createDispatchEvent({
    owner: context.payload.repository.owner.login,
    repo: default_organization_repository,
    event_type: repository_dispatch_type,
    client_payload: {
      token: token.data.token,
      ...data,
      event: context.payload
    }
  });
}

module.exports = {
  handlePush,
}