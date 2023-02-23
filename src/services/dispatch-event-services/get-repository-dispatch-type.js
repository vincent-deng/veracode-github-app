const { getRepositoryDispatchTypeByLanguage } = require('./detect-languages-frameworks');
const { default_organization_repository} = require('../../utils/constants');

async function getRepositoryDispatchType(context, scanType) {
  // TODO: still need central control?
  // const veracodeJsonContent = await context.octokit.repos.getContent({
  //   owner: context.payload.repository.owner.login,
  //   repo: default_organization_repository,
  //   path: "veracode.json"
  // });

  // const base64String = veracodeJsonContent.data.content;
  // const decodedString = Buffer.from(base64String, 'base64').toString();
  // const veracode = JSON.parse(decodedString);

  // if (context.payload.repository.name in veracode) {
  //   return veracode[context.payload.repository.name].build_workflow;
  // }

  let foundByPrimary = false;
  let repositoryDispatchType;

  try {
    repositoryDispatchType = await getRepositoryDispatchTypeByLanguage(
      [context.payload.repository.language], context, scanType);
    foundByPrimary = true;
  } catch (error) {
    context.log.error(error.message);
  }

  // THE BELOW SECTION RETRIEVES ALL LANGUAGES DETECTED IN THE REPOSITORY
  // NOT TOO SURE IF WE NEED TO PACKAGE THE APPLICATION FOR ALL LANGUAGES DETECTED
  // OR JUST PACKAGE THE PRIMARY LANGUAGE
  if (!foundByPrimary) {
    try {
      const languages = await context.octokit.request(`GET /repos/${context.payload.repository.owner.login}/${context.payload.repository.name}/languages`);
      let sortedLanguages = [];
      for (const [key, value] of Object.entries(languages.data)) {
        sortedLanguages.push(key);
      }
      repositoryDispatchType = await getRepositoryDispatchTypeByLanguage(sortedLanguages, context, scanType);
    } catch (error) {
      context.log.error(error.message);
      return;
    }
  }

  return repositoryDispatchType;

}

module.exports = {
  getRepositoryDispatchType
}