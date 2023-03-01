const default_organization_repository = process.env.DEFAULT_ORGANIZATION_REPOSITORY ?? 'veracode'
const app_route = process.env.APP_ROUTE ?? '/org-workflows'
// const ngrok = 'https://veracode.vincentdeng.net'
const ngrok = 'https://5044-202-179-135-199.au.ngrok.io'
const github_host = process.env.GITHUB_HOST ?? 'https://github.com'
const artifact_folder = process.env.ARTIFACT_FOLDER ?? '/tmp/veracode'
const dynamodb_table = process.env.DYNAMODB_TABLE ?? 'veracode-github-app-sky'

module.exports = {
  default_organization_repository,
  app_route,
  ngrok,
  github_host,
  artifact_folder,
  dynamodb_table
}