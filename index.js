/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Probot} app
 */
const { default_organization_repository, app_route } = require('./constants');

const repository_dispatch_type = 'veracode-policy-scan'
const config_path = 'organization-workflows-settings.yml'

module.exports = (app, { getRouter }) => {
  // Your code here
  app.log.info("Yay, the app was loaded!");

  // Get an express router to expose new HTTP endpoints
  const router = getRouter("/my-app");

  app.on('push', async(context) => {
    // const { config } = await context.octokit.config.get({
    //   owner: context.payload.repository.owner.login,
    //   repo: default_organization_repository,
    //   path: config_path,
    //   defaults: {
    //     workflows_repository: default_organization_repository,
    //     include_workflows_repository: false,
    //     exclude: {
    //       repositories: []
    //     }
    //   }
    // });
    // app.log.info("Push Event Triggered!");
    
    const sha = context.payload.after

    const webhook = await context.octokit.apps.getWebhookConfigForApp()

    const token = await context.octokit.apps.createInstallationAccessToken({
      installation_id: context?.payload?.installation?.id || 0,
      repository_ids: [context.payload.repository.id]
    })

    const data = {
      sha,
      callback_url: `${webhook.data.url}${app_route}/register`,
      repository: {
        owner: context.payload.repository.owner.login,
        name: context.payload.repository.name,
        full_name: context.payload.repository.full_name
      }
    }

    await context.octokit.repos.createDispatchEvent({
      owner: context.payload.repository.owner.login,
      repo: default_organization_repository,
      event_type: repository_dispatch_type,
      client_payload: {
        // id: _id.toString(),
        id: 12345678,
        token: token.data.token,
        ...data,
        event: context.payload
      }
    })
  });

  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
};
