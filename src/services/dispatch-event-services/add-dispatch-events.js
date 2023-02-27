const jsyaml = require('js-yaml');
const { default_organization_repository } = require('../../utils/constants');
const { shouldRunForBranch } = require('./should-run');
const { getRepositoryDispatchType } = require('../dispatch-event-services/get-repository-dispatch-type');

async function addDispatchEvents(branch, veracodeConfig, context, event_type) {
  let dispatchEvents = [];
  // if veracode.yml does not exist, then we will trigger the sast scanning process
  // as well as the sca and container security scanning process.
  if (veracodeConfig === null) {
    if (branch === context.payload.repository.default_branch) {
      dispatchEvents.push({
        'event_type': 'veracode-sast-policy-scan',
        'event_trigger': await getRepositoryDispatchType(context, 'veracode_sast_policy_scan'),
        'repository': default_organization_repository
      });
    } else {
      dispatchEvents.push({
        'event_type': 'veracode-sast-pipeline-scan',
        'event_trigger':await getRepositoryDispatchType(context, 'veracode_sast_pipeline_scan'),
        'repository': default_organization_repository
      });
    }
    dispatchEvents.push({
      'event_type': 'veracode-sca-scan',
      'event_trigger': 'veracode-sca-scan',
      'repository': default_organization_repository
    });
    dispatchEvents.push({
      'event_type': 'veracode-container-security-scan',
      'event_trigger': 'veracode-container-security-scan',
      'repository': default_organization_repository
    });
  }
  // if veracode.yml exists and compile_locally is set to true, then the sast
  // steps in the push event will be skipped. Instead, we will wait for the 
  // workflow_run.completed event to trigger the sast scanning process.
  else {
    const veracodeConfigData = Buffer.from(veracodeConfig.data.content, 'base64').toString();
    const veracodeConfigJSON = jsyaml.load(veracodeConfigData);
    dispatchEvents = await addDispatchEventsByVeracodeConfig(branch, veracodeConfigJSON, context, event_type);
  }
  return dispatchEvents;
}

async function addDispatchEventsByVeracodeConfig(branch, veracodeConfigJson, context, event_type) {
  let dispatchEvents = [];
  let veracodeScanTypes = [
    'veracode_sast_pipeline_scan',
    'veracode_sast_policy_scan'
  ]
  if (event_type === 'push') {
    veracodeScanTypes.push('veracode_sca_scan');
    veracodeScanTypes.push('veracode_container_security_scan');
  }

  for (const veracodeScanType of veracodeScanTypes) {
    const runForBranch = shouldRunForBranch(branch, veracodeConfigJson[veracodeScanType]);
    if (!runForBranch) continue;

    const scanType = veracodeScanType.replaceAll(/_/g, '-');

    if (event_type === 'push') {
      if (veracodeScanType.includes('sast')) {
        if (!veracodeConfigJson[veracodeScanType].compile_locally) {
          const autoCompileDispatchType = await getRepositoryDispatchType(context, veracodeScanType);
          dispatchEvents.push({
            'event_type': scanType, 
            'event_trigger': autoCompileDispatchType, 
            'repository': default_organization_repository
          });
        } else if (veracodeConfigJson[veracodeScanType].compile_locally) {
          dispatchEvents.push({
            'event_type': 'veracode-local-compilation',
            'event_trigger': veracodeConfigJson[veracodeScanType].local_compilation_workflow,
            'repository': context.payload.repository.name
          });
        }
      } else {
        dispatchEvents.push({
          'event_type': scanType,
          'event_trigger': scanType,
          'repository': default_organization_repository
        });
      }
    } else if (event_type === 'workflow_run') {
      dispatchEvents.push({
        'event_type': scanType,
        'event_trigger': `binary-ready-${scanType}`,
        'repository': default_organization_repository
      });
    }
  }

  return dispatchEvents;
}

module.exports = {
  addDispatchEvents,
}