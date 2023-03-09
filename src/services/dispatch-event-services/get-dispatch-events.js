const fs = require('fs');
const yaml = require('js-yaml');
const { default_organization_repository } = require('../../utils/constants');
const { getAutoBuildEvent } = require('./get-auto-build-event');
const { getVeracodeConfigFromRepo } = require('../config-services/get-veracode-config');
const { shouldRunScanType } = require('../config-services/should-run');

async function getDispatchEvents(app, context, branch) {
  const octokit = context.octokit;
  const owner = context.payload.repository.owner.login;
  const originalRepo = context.payload.repository.name;
  const eventName = context.name;
  const defaultBranch = context.payload.repository.default_branch;
  const action = context.payload.action ?? 'null';
  const targetBranch = context.payload.pull_request?.base?.ref ?? null;

  let veracodeScanConfigs;
  // 1. get veracode.yml from original repository
  let veracodeConfigFromRepo = await getVeracodeConfigFromRepo(
    octokit, owner, originalRepo);
  // 2. if veracode.yml does not exist in original repository, get veracode.yml from default organization repository
  if (veracodeConfigFromRepo === null) 
    veracodeConfigFromRepo = await getVeracodeConfigFromRepo(
      octokit, owner, default_organization_repository);

  if (veracodeConfigFromRepo === null) {
    try {
      const veracodeConfigFile = 'src/utils/veracode-scan-config.yml';
      const fileContents = fs.readFileSync(veracodeConfigFile, 'utf8');
      veracodeScanConfigs = yaml.load(fileContents);
    } catch (e) {
      app.log.error(e);
      return;
    }
  } else {
    try {
      const fileContents = Buffer.from(veracodeConfigFromRepo.data.content, 'base64').toString();
      veracodeScanConfigs = yaml.load(fileContents);
    } catch (e) {
      app.log.error(e);
      return;
    }
  }

  let dispatchEvents = [];
  const veracodeConfigKeys = Object.keys(veracodeScanConfigs);
  
  for (const scanType of veracodeConfigKeys) {
    app.log.info(scanType);
    if (!await shouldRunScanType(eventName, branch, defaultBranch, veracodeScanConfigs[scanType], action, targetBranch))
      continue;
    const scanEventType = scanType.replaceAll(/_/g, '-');
    
    // for sast scan, if compile_locally is true, dispatch to local compilation workflow
    // otherwise, dispatch to default organization repository with auto build
    // for non sast scan, simply dispatch to default organization repository
    if (scanType.includes('sast')) {
      if (veracodeScanConfigs[scanType].compile_locally) {
        dispatchEvents.push({
          event_type: `veracode-local-compilation-${scanEventType}`,
          repository: originalRepo,
          event_trigger: veracodeScanConfigs[scanType].local_compilation_workflow
        });
      } else {
        dispatchEvents.push({
          event_type: scanEventType,
          repository: default_organization_repository,
          event_trigger: await getAutoBuildEvent(app, context, scanType)
        });
      }
    } else {
      dispatchEvents.push({
        event_type: scanEventType,
        repository: default_organization_repository,
        event_trigger: scanEventType
      });
    }
  }
  app.log.info(dispatchEvents);
  return dispatchEvents;
}

module.exports = {
  getDispatchEvents,
}