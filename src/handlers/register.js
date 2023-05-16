const { Run } = require('../models/run.model');
const { github_host } = require('../utils/constants')
const { enforceProtection } = require('../utils/enforce-protection');

async function handleRegister (req, res, { app }) {
  const { id, run_id, name, sha, enforce, enforce_admin, documentation } = req.query
  const run = await Run.findById(id);
  if (!run) return res.sendStatus(404);
  if (run.sha !== sha) return res.sendStatus(404); // Although unlikely, make sure that people can't create checks by submitting random IDs (mongoose IDs are not-so-random)

  const data = {
    owner: run.repository.owner,
    repo: run.repository.name,
    head_sha: run.sha,
    name: name,
    details_url: `${github_host}/${run.repository.owner}/${run.config.workflows_repository}/actions/runs/${run_id}`,
    status: 'in_progress'
  }

  let octokit = await app.auth();
  const installation = await octokit.apps.getRepoInstallation({
    owner: run.repository.owner, 
    repo: run.repository.name 
  })
  octokit = await app.auth(installation.data.id)

  const checks_run = await octokit.checks.create(data);

  enforceProtection(
    octokit,
    { owner: run.repository.owner, repo: run.repository.name },
    data.name,
    enforce === "true",
    run.repository.name !== run.config.workflows_repository &&
      enforce_admin === "true" // Exclude the repository that contains the workflow.
  );

  const checkInfo = {
    name: data.name,
    run_id: Number(run_id),
    checks_run_id: checks_run.data.id,
  };

  await Run.findByIdAndUpdate(id, { $push: { checks: checkInfo } });

  return res.sendStatus(200);
}

module.exports = {
  handleRegister,
}