module.exports = appConfig;

function appConfig() {
  return {
    // the app name appears in the list of pull request checks. We make it
    // configurable so we can deploy multiple versions that can be used side-by-side
    name: process.env.APP_NAME || "Veracode GitHub App",
    configFileName: ".veracode.yml",
    defaultOrganisationRepository: process.env.DEFAULT_ORGANISATION_REPOSITORY ?? 'veracode',
    prBranch : process.env.PR_BRANCH ?? 'add-veracode-config',
    appUrl: process.env.APP_URL ?? 'https://375f-4-197-2-66.ngrok-free.app',
    veracodeConfigFile: process.env.VERACODE_CONFIG_FILE ?? 'veracode.yml',
    cosmodbUri: process.env.COSMOSDB_URI ?? 'mongodb://veracode-github-app:zMuA8obs9rrArC5cDqrtaTHCZrY8fhDI17fva1IW6i6C4aZUOd4zLk27Pdu6EWSejOQBC13WFLwzACDb1NqMSA==@veracode-github-app.mongo.cosmos.azure.com:10255/?ssl=true&retrywrites=false&maxIdleTimeMS=120000',
    dbName: process.env.COSMOSDB_DBNAME ?? 'veracode-github-app',
  };
}