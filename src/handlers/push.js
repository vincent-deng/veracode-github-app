const { 
  default_organization_repository, 
  ngrok
} = require('../utils/constants');
const { shouldRun } = require('../utils/should-run');
const {  getRepositoryDispatchType } = require('../services/get-repository-dispatch-type');
const jsyaml = require('js-yaml');

const config_path = 'organization-workflows-settings.yml'

async function handlePush(app, context) {
  // handle branch deletion - will not trigger the process
  if(context.payload.deleted) return; 
  
  const branch = context.payload.ref.substring(11);
  const sha = context.payload.after;
  let dispatchEvents = [];

  const veracodeConfig = await getVeracodeConfig(context, sha);
  
  // if veracode.yml exists and compile_locally is set to true, then following 
  // steps in the push event will be skipped. Instead, we will wait for the 
  // workflow_run.completed event to trigger the scanning process.
  if (veracodeConfig) {
    const veracodeConfigData = Buffer.from(veracodeConfig.data.content, 'base64').toString();
    const veracodeConfigJSON = jsyaml.load(veracodeConfigData);
    await addDispatchByVeracodeConfig(branch, dispatchEvents, veracodeConfigJSON, context);
  } else {
    if (branch === context.payload.repository.default_branch) {
      dispatchEvents.push(await getRepositoryDispatchType(context, 'veracode_sast_policy_scan'));
    } else {
      dispatchEvents.push(await getRepositoryDispatchType(context, 'veracode_sast_pipeline_scan'));
    }
    dispatchEvents.push('veracode-sca-scan');
    dispatchEvents.push('veracode-container-security');
  }

  const { config } = await context.octokit.config.get({
    owner: context.payload.repository.owner.login,
    repo: default_organization_repository,
    path: config_path,
    defaults: {
      workflows_repository: default_organization_repository,
      include_workflows_repository: false,
      exclude: {
        repositories: []
      }
    }
  });

  const excludedRepositories = config.exclude.repositories;

  if (!config.include_workflows_repository) {
    excludedRepositories.push(config.workflows_repository)
  }

  if(!shouldRun(context.payload.repository.name, excludedRepositories)) {
    return;
  }

  const token = await context.octokit.apps.createInstallationAccessToken({
    installation_id: context?.payload?.installation?.id || 0,
    repository_ids: [context.payload.repository.id]
  })

  const dispatchEventData = {
    context,
    token,
    default_organization_repository,
    payload: {
      sha,
      callback_url: `${ngrok}/register`,
      repository: {
        owner: context.payload.repository.owner.login,
        name: context.payload.repository.name,
        full_name: context.payload.repository.full_name,
      }
    }
  }
  console.log(dispatchEvents);

  let requests = dispatchEvents.map(event => createDispatchEvent(event, dispatchEventData));
  await Promise.all(requests);
}

const createDispatchEvent = async function (event, dispatchEventData) {
  context = dispatchEventData.context;
  await context.octokit.repos.createDispatchEvent({
    owner: context.payload.repository.owner.login,
    repo: event.repository,
    event_type: event.event_type,
    client_payload: {
      token: dispatchEventData.token.data.token,
      ...dispatchEventData.payload,
      event: context.payload
    }
  });
}

async function addDispatchByVeracodeConfig(branch, dispatchEvents, veracodeConfigJSON, context) {
  const veracodeConfigs = ['veracode_sast_pipeline_scan', 'veracode_sast_policy_scan', 'veracode_sca_scan', 'veracode_container_security_scan'];
  let shouldRunForBranch;

  for (const veracodeConfig of veracodeConfigs) {
    // Ask user to only specify either branches_to_run or branches_to_exclude
    // Entering both will only execute branches_to_run
    // Leaving them both blank means this will never run
    if (veracodeConfigJSON[veracodeConfig].branches_to_run !== null) {
      shouldRunForBranch = false;
      for (const branchToRun of veracodeConfigJSON[veracodeConfig].branches_to_run) {
        const regex = new RegExp('^' + branchToRun.replace(/\*/g, '.*') + '$');
        if (regex.test(branch)) {
          shouldRunForBranch = true;
          break;
        }
      }
    }
    else if (veracodeConfigJSON[veracodeConfig].branches_to_exclude !== null) {
      shouldRunForBranch = true;
      for (const branchToExclude of veracodeConfigJSON[veracodeConfig].branches_to_exclude) {
        const regex = new RegExp('^' + branchToExclude.replace(/\*/g, '.*') + '$');
        if (regex.test(branch)) {
          shouldRunForBranch = false;
          break;
        }
      }
    }
    if (veracodeConfig.includes('sast')) {
      if (!veracodeConfigJSON[veracodeConfig].compile_locally && shouldRunForBranch) {
        const autoCompileDispatchType = await getRepositoryDispatchType(context, veracodeConfig);
        dispatchEvents.push({
          'event_type': autoCompileDispatchType, 
          'repository': default_organization_repository
        });
      } else if (veracodeConfigJSON[veracodeConfig].compile_locally && shouldRunForBranch) {
        dispatchEvents.push({
          'event_type': veracodeConfigJSON[veracodeConfig].local_compilation_workflow,
          'repository': context.payload.repository.name
        });
      }
    } else {
      if (shouldRunForBranch) {
        dispatchEvents.push({
          'event_type': veracodeConfig.replaceAll(/_/g, '-'),
          'repository': default_organization_repository
        });
      }
    }
  }
}

async function getVeracodeConfig(context, sha) {
  let veracodeConfig; 
  try {
    veracodeConfig = await context.octokit.repos.getContent({
      owner: context.payload.repository.owner.login,
      repo: context.payload.repository.name,
      path: "veracode.yml",
      ref: sha
    });
  } catch (error) {
    app.log.info('veracode.yml not found');
  }

  return veracodeConfig;
}

module.exports = {
  handlePush,
}