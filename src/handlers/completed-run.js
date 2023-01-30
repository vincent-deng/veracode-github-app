const mapper = require('../db/dynamo-client');
const Run = require('../models/run.model');
const { updateChecksForCompletedSCAScan } = require('../services/completed-sca-scan');
const { updateChecksForCompletedPipelineScan } = require('../services/completed-pipeline-scan');

async function handleCompletedRun(context) {
  if (!context.payload.workflow_run.id) return;
  const workflow_repo_run_id = context.payload.workflow_run.id;

  let run;
  try {
    run = await mapper.get(Object.assign(new Run(), { run_id: workflow_repo_run_id }))
  } catch (error) {
    context.log.error(error)
    return response.status(500).json({ error: error })
  }

  if (!run) return

  if (run.check_run_type === 'veracode-sca-scan' || run.check_run_type === 'veracode-container-security')
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