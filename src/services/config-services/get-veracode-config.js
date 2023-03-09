const { veracode_config_file } = require('../../utils/constants');

async function getVeracodeConfig(context, sha) {
  let veracodeConfig; 
  try {
    veracodeConfig = await context.octokit.repos.getContent({
      owner: context.payload.repository.owner.login,
      repo: context.payload.repository.name,
      path: "veracode.yml",
      ref: sha
    });
  } catch (error) {
    console.log('veracode.yml not found');
    return null;
  }

  return veracodeConfig;
}

async function getVeracodeConfigFromRepo(octokit, owner, repository) {
  let veracodeConfig; 
  try {
    veracodeConfig = await octokit.repos.getContent({
      owner,
      repo: repository,
      path: veracode_config_file,
    });
  } catch (error) {
    console.log(`${veracode_config_file} not found`);
    return null;
  }

  return veracodeConfig;
}

module.exports = {
  getVeracodeConfig,
  getVeracodeConfigFromRepo,
}