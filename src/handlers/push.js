const pick = require('lodash.pick');
const { default_organization_repository, app_route, ngrok, config_keys } = require('../utils/constants');
const { shouldRun } = require('../utils/should-run');
const { Run } = require('../models/run.model');

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
  const webhook = await context.octokit.apps.getWebhookConfigForApp()
  const token = await context.octokit.apps.createInstallationAccessToken({
    installation_id: context?.payload?.installation?.id || 0,
    repository_ids: [context.payload.repository.id]
  })

  const data = {
    sha,
    callback_url: `${ngrok}${app_route}/register`,
    repository: {
      owner: context.payload.repository.owner.login,
      name: context.payload.repository.name,
      full_name: context.payload.repository.full_name,
      pull_request: -1
    },
    checks: [],
    config: pick(config, config_keys)
  }

  const runDoc = new Run(data);
  const { _id } = await runDoc.save();

  await context.octokit.repos.createDispatchEvent({
    owner: context.payload.repository.owner.login,
    repo: default_organization_repository,
    event_type: repository_dispatch_type,
    client_payload: {
      id: _id.toString(),
      token: token.data.token,
      ...data,
      event: context.payload
    }
  });
}

module.exports = {
  handlePush,
}