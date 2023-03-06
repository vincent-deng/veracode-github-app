const fs = require("fs-extra");
const AdmZip = require("adm-zip");
const { artifact_folder } = require('../../utils/constants');
const { updateChecks } = require('../checks-services/checks');
const { dispatchEvents } = require('../dispatch-event-services/dispatch');

async function updateChecksForCompletedPolicyScan (run, context) {
  const data = await updateChecks(run, context);
  if (data.conclusion !== 'failure')
    return;
  await dispatchEvents(run, context, 'policy_fail');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function processResultsForFailedCompletedPolicyScan (run, context) {
  const workflow_reopo_owner = context.payload.repository.owner.login;
  const workflow_repo_name = context.payload.repository.name;
  const workflow_repo_run_id = context.payload.workflow_run.id;

  const url = `GET /repos/${workflow_reopo_owner}/${workflow_repo_name}/actions/runs/${workflow_repo_run_id}/artifacts`
  let artifactRequest = await context.octokit.request(url);
  let retry = 20;
  while (artifactRequest.data.total_count === 0 && retry > 0) {
    retry--;
    await sleep(5000);
    console.log(`Artifact not found, retrying. remaining retries: ${retry}`);
    artifactRequest = await context.octokit.request(url);
  }

  let annotations = [];
  let resultsUrl = '';
  const artifacts = artifactRequest.data;

  for (const artifact of artifacts.artifacts) {
    if (artifact.name !== 'policy-flaws') {
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

    resultsUrl = fs.readFileSync(`${destination}/results_url.txt`, 'utf8');
    const data = fs.readFileSync(`${destination}/policy_flaws.json`)
    const json = JSON.parse(data);
    json._embedded.findings.forEach(finding => {
      const displayMessage = finding.description.replace(/\<span\>/g, '').replace(/\<\/span\> /g, '\n').replace(/\<\/span\>/g, '');
      const message = `Filename: ${finding.finding_details.file_path}\nLine: ${finding.finding_details.file_line_number}\nCWE: ${finding.finding_details.cwe.id} (${finding.finding_details.cwe.name})\n\n${displayMessage}`;
      annotations.push({
        path: `src/main/java/${finding.finding_details.file_path}`,
        start_line: finding.finding_details.file_line_number,
        end_line: finding.finding_details.file_line_number,
        annotation_level: "warning",
        title: finding.finding_details.cwe.name, 
        'message': message
      });
    });
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
          summary: `Here\'s the summary of the check result, the full report can be found [here](${resultsUrl}).`
        }
      }

      await context.octokit.checks.update(data);
    }
  }
}

module.exports = {
  updateChecksForCompletedPolicyScan,
  processResultsForFailedCompletedPolicyScan,
}