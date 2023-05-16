module.exports = appConfig;

function appConfig() {
  return {
    // the app name appears in the list of pull request checks. We make it
    // configurable so we can deploy multiple versions that can be used side-by-side
    name: process.env.APP_NAME || "Veracode GitHub App",
    configFileName: ".veracode.yml",
    defaultOrganisationRepository: process.env.DEFAULT_ORGANISATION_REPOSITORY ?? 'veracode',
    prBranch : process.env.PR_BRANCH ?? 'add-veracode-config',
    appUrl: process.env.APP_URL ?? 'https://veracode.vincentdeng.net',
  };
}