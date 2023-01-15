const default_organization_repository = process.env.DEFAULT_ORGANIZATION_REPOSITORY ?? '.github'
const app_route = process.env.APP_ROUTE ?? '/org-workflows'
const ngrok = 'https://c3f5-13-238-167-251.ngrok.io'
const config_keys = ['workflows_repository']
const github_host = process.env.GITHUB_HOST ?? 'https://github.com'
const artifact_folder = process.env.Artifact_Folder ?? '/tmp/veracode'

module.exports = {
  default_organization_repository,
  app_route,
  ngrok,
  config_keys,
  github_host,
  artifact_folder,
}