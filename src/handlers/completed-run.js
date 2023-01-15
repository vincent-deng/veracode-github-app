const { Run } = require('../models/run.model');
const fs = require("fs-extra");
const AdmZip = require("adm-zip");
const { artifact_folder } = require('../utils/constants');

async function handleCompletedRun(context, { app }) {

  if (!context.payload.workflow_run.id) return;

  const run = await Run.findOne({ 'checks.run_id': { $in: context.payload.workflow_run.id }})

  if (!run) return
  if (context.payload.repository.name !== run.config.workflows_repository) return

  const check = run.checks.find((check) => check.run_id === context.payload.workflow_run.id )
  if (!check) return;

  const owner = context.payload.repository.owner.login;
  const repo = context.payload.repository.name;
  const run_id = context.payload.workflow_run.id;

  const { data: artifacts }  = await context.octokit.actions.listWorkflowRunArtifacts({
    owner: owner,
    repo: repo,
    run_id: run_id
  });

  let annotations = []

  for (const artifact of artifacts.artifacts) {
    if (artifact.name !== 'Veracode Pipeline-Scan Results') {
      continue;
    }
    const timestamp = new Date().toISOString();
    const artifactName = `${run.repository.owner}-${run.repository.name}-${timestamp}`;
    const artifactFilename = `${artifact_folder}/${artifactName}.zip`;
    const destination = `${artifact_folder}/${artifactName}`;

    if (!fs.existsSync(destination)) {
      fs.mkdirSync(destination, { recursive: true });
    }

    const artifactData = await context.octokit.request(`GET /repos/${owner}/${repo}/actions/artifacts/${artifact.id}/zip`);
    await fs.writeFileSync(artifactFilename, Buffer.from(artifactData.data));
    const zip = new AdmZip(artifactFilename);
    zip.extractAllTo(`${destination}`, /*overwrite*/true);

    const data = fs.readFileSync(`${destination}/filtered_results.json`)
    const json = JSON.parse(data);
    json.findings.forEach(function(element) {
      const displayMessage = element.display_text.replace(/\<span\>/g, '').replace(/\<\/span\> /g, '\n').replace(/\<\/span\>/g, '');
      const message = `Filename: ${element.files.source_file.file}\nLine: ${element.files.source_file.line}\nCWE: ${element.cwe_id} (${element.issue_type})\n\n${displayMessage}
      `;
      annotations.push({
        path: `src/main/java/${element.files.source_file.file}`,
        start_line: element.files.source_file.line,
        end_line: element.files.source_file.line,
        annotation_level: "warning",
        title: element.issue_type,
        message: message,
        // raw_details: 'test',
      });
    })
    fs.rm(destination, { recursive: true });
    fs.rm(artifactFilename);
  }

  const maxNumberOfAnnotations = 50;

  for (let index = 0; index < annotations.length / maxNumberOfAnnotations; index++) {
    const annotationBatch = annotations.slice(index * maxNumberOfAnnotations, (index + 1) * maxNumberOfAnnotations);
    if (annotationBatch !== []) {
      const data = {
        owner: run.repository.owner,
        repo: run.repository.name,
        check_run_id: check.checks_run_id,
        name: `${check.name}`,
        status: context.payload.workflow_run?.status,
        conclusion: context.payload.workflow_run?.conclusion,
        output: {
          annotations: annotationBatch,
          title: 'Veracode Static Analysis',
          summary: 'Here\'s the summary of the check result'
        }
      }

      await context.octokit.checks.update(data);
    }
  }

  const sha = run.sha;
  const pullRequests = await context.octokit.search.issuesAndPullRequests({
    q: `repo:${owner}/${run.repository.name} is:pr ${sha}`,
  });
  console.log(pullRequests.data);
}

module.exports = {
  handleCompletedRun,
}