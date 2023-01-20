const { 
  github_host, 
  default_organization_repository 
} = require('../utils/constants')
// const { enforceProtection } = require('../utils/enforce-protection');

async function handleRegister (req, res, { app }) {
  const { 
    run_id, 
    name, 
    sha, 
    enforce, 
    enforce_admin,
    repositroy_owner,
    repositroy_name
  } = req.query

  const data = {
    owner: repositroy_owner,
    repo: repositroy_name,
    head_sha: sha,
    name: name,
    details_url: `${github_host}/${repositroy_owner}/${default_organization_repository}/actions/runs/${run_id}`,
    status: 'in_progress'
  }

  let octokit = await app.auth();
  const installation = await octokit.apps.getRepoInstallation({
    owner: repositroy_owner, 
    repo: repositroy_name
  })
  octokit = await app.auth(installation.data.id)

  const checks_run = await octokit.checks.create(data);

  console.log(checks_run);

  // enforceProtection(
  //   octokit,
  //   { owner: run.repository.owner, repo: run.repository.name },
  //   data.name,
  //   enforce === "true",
  //   run.repository.name !== run.config.workflows_repository &&
  //     enforce_admin === "true" // Exclude the repository that contains the workflow.
  // );

  // const checkInfo = {
  //   name: data.name,
  //   run_id: Number(run_id),
  //   checks_run_id: checks_run.data.id,
  // };

  // await Run.findByIdAndUpdate(id, { $push: { checks: checkInfo } });

  return res.sendStatus(200);
}

module.exports = {
  handleRegister,
}

// vincent
// qq39geSB6DDyAqRy