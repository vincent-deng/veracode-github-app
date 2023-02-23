const { ngrok } = require('../../utils/constants');
const { addDispatchEvents } = require('../dispatch-event-services/add-dispatch-events');
const { getVeracodeConfig } = require('../dispatch-event-services/get-veracode-config');

async function handleCompletedCompilation (run, context) {
  const data = {
    owner: run.repository_owner,
    repo: run.repository_name,
    check_run_id: run.check_run_id,
    status: context.payload.workflow_run?.status,
    conclusion: context.payload.workflow_run?.conclusion,
  }

  await context.octokit.checks.update(data);

  const dispatchEventData = {
    context,
    payload: {
      sha: run.sha,
      branch: run.branch,
      callback_url: `${ngrok}/register`,
      run_id: run.run_id,
      repository: {
        owner: context.payload.repository.owner.login,
        name: context.payload.repository.name,
        full_name: context.payload.repository.full_name,
      }
    }
  }

  const veracodeConfig = await getVeracodeConfig(context, run.sha);
  const dispatchEvents = await addDispatchEvents(run.branch, veracodeConfig, context, 'workflow_run');

  console.log(dispatchEvents);

  let requests = dispatchEvents.map(event => createDispatchEvent(event, dispatchEventData));
  await Promise.all(requests);
}

const createDispatchEvent = async function (event, dispatchEventData) {
  context = dispatchEventData.context;
  await context.octokit.repos.createDispatchEvent({
    owner: context.payload.repository.owner.login,
    repo: event.repository,
    event_type: event.event_trigger,
    client_payload: {
      ...dispatchEventData.payload,
      event: context.payload,
      event_type: event.event_type
    }
  });
}

module.exports = {
  handleCompletedCompilation,
}