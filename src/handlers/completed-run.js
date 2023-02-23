const mapper = require('../db/dynamo-client');
const Run = require('../models/run.model');
const { updateChecksForCompletedSCAScan } = 
  require('../services/completed-run-services/completed-sca-scan');
const { updateChecksForCompletedPipelineScan } = 
  require('../services/completed-run-services/completed-pipeline-scan');
const { default_organization_repository, ngrok } = require('../utils/constants');

async function handleCompletedRun(app, context) {
  if (!context.payload.workflow_run.id) return;

  const workflow_repo_run_id = context.payload.workflow_run.id;

  let run;
  try {
    run = await mapper.get(Object.assign(new Run(), { run_id: workflow_repo_run_id }))
  } catch (error) {
    app.log.error(error)
    return;
  }

  if (!run) return

  if (run.check_run_type === 'veracode-build') {
    const data = {
      owner: run.repository_owner,
      repo: run.repository_name,
      check_run_id: run.check_run_id,
      status: context.payload.workflow_run?.status,
      conclusion: context.payload.workflow_run?.conclusion,
    }
  
    await context.octokit.checks.update(data);

    const dispatchEventData = {
      payload: {
        sha: run.sha,
        callback_url: `${ngrok}/register`,
        run_id: run.run_id,
        repository: {
          owner: context.payload.repository.owner.login,
          name: context.payload.repository.name,
          full_name: context.payload.repository.full_name,
        }
      }
    }

    await context.octokit.repos.createDispatchEvent({
      owner: context.payload.repository.owner.login,
      repo: default_organization_repository,
      event_type: 'binary-ready-pipeline-scan',
      client_payload: {
        ...dispatchEventData.payload,
        event: context.payload
      }
    });
  }
  else if (run.check_run_type === 'veracode-sca-scan' || run.check_run_type === 'veracode-container-security-scan')
    updateChecksForCompletedSCAScan(run, context);
  else
    updateChecksForCompletedPipelineScan(run, context);

//   const sha = run.sha;
//   const pullRequests = await context.octokit.search.issuesAndPullRequests({
//     q: `repo:${owner}/${run.repository.name} is:pr ${sha}`,
//   });
//   console.log(pullRequests.data);
}

module.exports = {
  handleCompletedRun,
}