const fs = require("fs-extra");
const AdmZip = require("adm-zip");
const { artifact_folder } = require('../../utils/constants');

async function updateChecksForCompletedPipelineScan (run, context) {

  const workflow_reopo_owner = context.payload.repository.owner.login;
  const workflow_repo_name = context.payload.repository.name;
  const workflow_repo_run_id = context.payload.workflow_run.id;

  const { data: artifacts }  = await context.octokit.actions.listWorkflowRunArtifacts({
    owner: workflow_reopo_owner,
    repo: workflow_repo_name,
    run_id: workflow_repo_run_id
  });

  let annotations = []

  for (const artifact of artifacts.artifacts) {
    if (artifact.name !== 'Veracode Pipeline-Scan Results') {
      continue;
    }
    const timestamp = new Date().toISOString();
    const artifactName = `${run.repository_owner}-${run.repository_name}-${timestamp}`;
    const artifactFilename = `${artifact_folder}/${artifactName}.zip`;
    const destination = `${artifact_folder}/${artifactName}`;

    if (!fs.existsSync(destination)) {
      fs.mkdirSync(destination, { recursive: true });
    }

    const artifactData = await context.octokit.request(`GET /repos/${workflow_reopo_owner}/${workflow_repo_name}/actions/artifacts/${artifact.id}/zip`);
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
        // TODO: get rid of src/main/java
        path: `src/main/java/${element.files.source_file.file}`,
        start_line: element.files.source_file.line,
        end_line: element.files.source_file.line,
        annotation_level: "warning",
        title: element.issue_type,
        message: message,
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
        owner: run.repository_owner,
        repo: run.repository_name,
        check_run_id: run.check_run_id,
        // name: `${check.name}`,
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
}

module.exports = {
  updateChecksForCompletedPipelineScan,
}