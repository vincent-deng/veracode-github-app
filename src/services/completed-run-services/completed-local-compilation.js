const { ngrok, default_organization_repository } = require('../../utils/constants');
const { createDispatchEvent } = require('../dispatch-event-services/dispatch');

async function handleCompletedCompilation (run, context) {
  const data = {
    owner: run.repository_owner,
    repo: run.repository_name,
    check_run_id: run.check_run_id,
    status: context.payload.workflow_run?.status,
    conclusion: context.payload.workflow_run?.conclusion,
  }

  await context.octokit.checks.update(data);

  if (data.conclusion === 'failure') return;

  const dispatchEventData = {
    context,
    payload: {
      sha: run.sha,
      branch: run.branch,
      callback_url: `${ngrok}/register`,
      // TODO: read veracode.yml to get profile name
      profile_name: context.payload.repository.full_name, 
      run_id: run.run_id,
      repository: {
        owner: context.payload.repository.owner.login,
        name: context.payload.repository.name,
        full_name: context.payload.repository.full_name,
      }
    }
  }

  const subsequentScanType = run.check_run_type.substring(27);
  const dispatchEvents = [{
    event_type: subsequentScanType,
    repository: default_organization_repository,
    event_trigger: `binary-ready-${subsequentScanType}`
  }]

  let requests = dispatchEvents.map(event => createDispatchEvent(event, dispatchEventData));
  await Promise.all(requests);
}

module.exports = {
  handleCompletedCompilation,
}