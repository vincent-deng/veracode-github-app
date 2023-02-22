const fs = require('fs').promises;

async function getRepositoryDispatchTypeByLanguage(languages, context, scanType) {
  const buildInstructionPath = 'src/utils/build-instructions.json';
  const buildInstructions = JSON.parse(await fs.readFile(buildInstructionPath));

  for (idx in languages) {
    if (languages[idx] in buildInstructions)
      return await getJavaCompilationWorkflow(buildInstructions[languages[idx]], context, scanType);
  }
  throw new Error('Language and Framework not Enabled for Auto Compilation.');
}

async function getJavaCompilationWorkflow(buildInstructions, context, scanType) {
  let countOfBuildInstructionsFound = 0;
  let buildInstructionFound;

  for (let item in buildInstructions) {
    const buildInstruction = buildInstructions[item];
    try {
      if (buildInstruction.build_tool !== 'NA')
        await context.octokit.repos.getContent({
          owner: context.payload.repository.owner.login,
          repo: context.payload.repository.name,
          path: buildInstruction.build_tool
        });
      buildInstructionFound = buildInstruction;
      countOfBuildInstructionsFound++;
    } catch (error) {
      context.log.info(`build tool ${buildInstruction.build_tool} not found in the repository`)
    }
  }  
  if (countOfBuildInstructionsFound !== 1)
    throw new Error('Found More than one Compilation in the Repository'); 
  return buildInstructionFound.repository_dispatch_type[scanType];
} 

module.exports = {
  getRepositoryDispatchTypeByLanguage,
}