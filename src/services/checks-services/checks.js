async function updateChecks(run, context) {
  const data = {
    owner: run.repository_owner,
    repo: run.repository_name,
    check_run_id: run.check_run_id,
    status: context.payload.workflow_run?.status,
    conclusion: context.payload.workflow_run?.conclusion,
  }
  await context.octokit.checks.update(data);
  return data;
}

module.exports = {
  updateChecks,
}