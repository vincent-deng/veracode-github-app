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

module.exports = {
  getVeracodeConfig,
}