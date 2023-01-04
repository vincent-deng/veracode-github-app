const default_organization_repository = process.env.DEFAULT_ORGANIZATION_REPOSITORY ?? '.github'
const app_route = process.env.APP_ROUTE ?? '/org-workflows'

module.exports = {
  default_organization_repository,
  app_route,
}