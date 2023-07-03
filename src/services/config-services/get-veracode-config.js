const appConfig = require('../../app-config');

async function getVeracodeConfig(context, sha) {
  let veracodeConfig; 
  try {
    veracodeConfig = await context.octokit.repos.getContent({
      owner: context.payload.repository.owner.login,
      repo: context.payload.repository.name,
      path: appConfig().veracodeConfigFile,
      ref: sha
    });
  } catch (error) {
    console.log('veracode.yml not found');
    return null;
  }

  return veracodeConfig;
}

async function getVeracodeConfigFromRepo(app, octokit, owner, repository) {
  let veracodeConfig; 
  try {
    veracodeConfig = await octokit.repos.getContent({
      owner,
      repo: repository,
      path: appConfig().veracodeConfigFile,
    });
  } catch (error) {
    app.log.info(`${appConfig().veracodeConfigFile} not found`);
    return null;
  }

  return veracodeConfig;
}

module.exports = {
  getVeracodeConfig,
  getVeracodeConfigFromRepo,
}