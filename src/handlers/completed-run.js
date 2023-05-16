const { dbConnect } = require('../db/cosmo-client');
const Run = require('../models/run');

const { 
  updateChecksForCompletedSCAScan 
} = require('../services/completed-run-services/completed-sca-scan');
const { updateChecksForCompletedPipelineScan } = 
  require('../services/completed-run-services/completed-pipeline-scan');
const { handleCompletedCompilation } = 
  require('../services/completed-run-services/completed-local-compilation');
const { 
  updateChecksForCompletedPolicyScan, 
} = require('../services/completed-run-services/completed-policy-scan');

async function handleCompletedRun(app, context) {
  await dbConnect();

  if (!context.payload.workflow_run.id) return;

  const workflow_repo_run_id = context.payload.workflow_run.id;

  let run;
  try {
    run = await Run.findOne({ run_id: workflow_repo_run_id });
  } catch (error) {
    app.log.error(error)
    return;
  }
  // try {
  //   const database = await db.connect();
  //   const collection = database.collection('runs');
  //   run = await collection.findOne({ run_id: workflow_repo_run_id });
  // } catch (error) {
  //   app.log.error(error)
  //   return;
  // }
  if (!run) return
  console.log(run);

  if (run.check_run_type.substring(0, 26) === 'veracode-local-compilation') 
    handleCompletedCompilation(run, context);
  else if (run.check_run_type === 'veracode-sca-scan' || run.check_run_type === 'veracode-container-security-scan')
    updateChecksForCompletedSCAScan(run, context);
  else if (run.check_run_type === 'veracode-sast-policy-scan')
    updateChecksForCompletedPolicyScan(run, context);
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