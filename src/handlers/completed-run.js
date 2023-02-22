const mapper = require('../db/dynamo-client');
const Run = require('../models/run.model');
const { updateChecksForCompletedSCAScan } = require('../services/completed-sca-scan');
const { updateChecksForCompletedPipelineScan } = require('../services/completed-pipeline-scan');

const { 
  default_organization_repository, 
  ngrok
} = require('../utils/constants');
const jsyaml = require('js-yaml');

async function handleCompletedRun(app, context) {
  // check if context.payload.workflow_run.name is in the list of workflows
  // if not, return
  // if yes, check if context.payload.workflow_run.conclusion is success
  // if not, return

  

  // if (!context.payload.workflow_run.name || 
  //   context.payload.workflow_run.name !== '.github/workflows/build.yml') return;
  // if (!context.payload.workflow_run.conclusion) return;
  // if (context.payload.workflow_run.conclusion !== 'success') return;

  // app.log.info('workflow_run.completed event received');

  // await context.octokit.repos.createDispatchEvent({
  //   owner: context.payload.repository.owner.login,
  //   repo: default_organization_repository,
  //   event_type: 'binary-ready-pipeline-scan',
  //   client_payload: {
  //     // token: dispatchEventData.token.data.token,
  //     // ...dispatchEventData.payload,
  //     event: context.payload
  //   }
  // });






  if (!context.payload.workflow_run.id) return;
  const workflow_repo_run_id = context.payload.workflow_run.id;

  let run;
  try {
    run = await mapper.get(Object.assign(new Run(), { run_id: workflow_repo_run_id }))
  } catch (error) {
    context.log.error(error)
    return;
  }

  if (!run) return

  if (run.check_run_type === 'veracode-sca-scan' || run.check_run_type === 'veracode-container-security-scan')
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