const { 
  github_host, 
  default_organization_repository 
} = require('../utils/constants');
const { dbConnect } = require('../db/cosmo-client');
const Run = require('../models/run');

async function handleRegister (req, res, { app }) {
  await dbConnect();
  const { 
    run_id, 
    name, 
    sha, 
    branch,
    enforce, 
    enforce_admin,
    repository_owner,
    repository_name,
    event_type
  } = req.query

  const data = {
    owner: repository_owner,
    repo: repository_name,
    head_sha: sha,
    name: name,
    details_url: `${github_host}/${repository_owner}/${default_organization_repository}/actions/runs/${run_id}`,
    status: 'in_progress'
  }

  let octokit = await app.auth();
  const installation = await octokit.apps.getRepoInstallation({
    owner: repository_owner, 
    repo: repository_name
  })
  octokit = await app.auth(installation.data.id)

  const checks_run = await octokit.checks.create(data);

  //save run to CosmosDB
  // const runData = {
  //   run_id: run_id,
  //   sha: sha,
  //   repository_owner: repository_owner,
  //   repository_name: repository_name,
  //   check_run_id: checks_run.data.id,
  //   check_run_type: event_type,
  //   branch: branch
  // }

  // const Run = database.model('Run', runSchema);
  // try {
  //   const database = await db.connect();
  //   const collection = database.collection('runs');
  //   const result = await collection.insertOne(runData);
  //   console.log(
  //     `documents were inserted with the _id: ${result.insertedId}`,
  //   );
  // } catch (error) {
  //   console.error(error);
  //   return response.status(500).json({err: 'MongoError'})
  // }

  // const database = await connect();

  // Insert a new document into the database
  const run = new Run({
    run_id: run_id,
    sha: sha,
    repository_owner: repository_owner,
    repository_name: repository_name,
    check_run_id: checks_run.data.id,
    check_run_type: event_type,
    branch: branch
  });
  await run.save();

  return res.sendStatus(200);
}

module.exports = {
  handleRegister,
}
