const default_organization_repository = process.env.DEFAULT_ORGANIZATION_REPOSITORY ?? '.github'
const app_route = process.env.APP_ROUTE ?? '/org-workflows'
const ngrok = 'https://22dd-114-77-60-74.au.ngrok.io'
const config_keys = ['workflows_repository']
const github_host = process.env.GITHUB_HOST ?? 'https://github.com'

module.exports = {
  default_organization_repository,
  app_route,
  ngrok,
  config_keys,
  github_host,
}