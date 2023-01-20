const { 
  github_host, 
  default_organization_repository 
} = require('../utils/constants');
const mapper = require('../db/dynamo-client');
const Run = require('../models/run.model');

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

  const run = new Run();
  run.run_id = run_id;
  run.sha = sha;
  run.repository_owner = repositroy_owner;
  run.repository_name = repositroy_name;
  run.check_run = [checks_run.data.id]

  try {
    await mapper.put({ item: run });
  } catch (error) {
    console.error(error);
    return response.status(500).json({err: 'DynamoError'})
  }

  return res.sendStatus(200);
}

module.exports = {
  handleRegister,
}

// vincent
// qq39geSB6DDyAqRy