function shouldRunForRepository(repositoryName, exclude) {
  const excludeMatch = exclude.some((repository) => {
    const regex = new RegExp('^' + repository.replace(/\*/g, '.*') + '$');
    return regex.test(repositoryName);
  });    

  return !excludeMatch;
}

// Ask user to only specify either branches_to_run or branches_to_exclude
// Entering both will only execute branches_to_run
// Leaving them both blank means this will never run
function shouldRunForBranch(branch, veracodeScanType) {
  let runForBranch = false;
  if (veracodeScanType.branches_to_run !== null) {
    runForBranch = false;
    for (const branchToRun of veracodeScanType.branches_to_run) {
      const regex = new RegExp('^' + branchToRun.replace(/\*/g, '.*') + '$');
      if (regex.test(branch)) {
        runForBranch = true;
        break;
      }
    }
  }
  else if (veracodeScanType.branches_to_exclude !== null) {
    runForBranch = true;
    for (const branchToExclude of veracodeScanType.branches_to_exclude) {
      const regex = new RegExp('^' + branchToExclude.replace(/\*/g, '.*') + '$');
      if (regex.test(branch)) {
        runForBranch = false;
        break;
      }
    }
  }
  return runForBranch;
}

function shouldRunForTargetBranch(targetBranch, pullRequestTargetBranches) {
  let shouldRunForTargetBranch = false;
  if (pullRequestTargetBranches !== null) {
    shouldRunForTargetBranch = false;
    for (const branchToRun of pullRequestTargetBranches) {
      const regex = new RegExp('^' + branchToRun.replace(/\*/g, '.*') + '$');
      if (regex.test(targetBranch)) {
        shouldRunForTargetBranch = true;
        break;
      }
    }
  }
  return shouldRunForTargetBranch;
}

function shouldRunScanType(eventName, branch, defaultBranch, veracodeScanConfig, action, targetBranch) {
  const trigger = veracodeScanConfig.push.trigger ? 
    'push' : veracodeScanConfig.pull_request.trigger ? 
    'pull_request' : '';
  if (eventName !== trigger) return false;

  // replace the default_branch keyword with the actual default branch name from the config yml
  for (const eventTrigger of ['push', 'pull_request']) {
    for (const attribute of ['branches_to_run', 'branches_to_exclude', 'target_branch']) {
      const attributeValue = veracodeScanConfig?.[eventTrigger]?.[attribute];
      if (Array.isArray(attributeValue)) 
        for (let i = 0; i < attributeValue.length; i++) 
          if (attributeValue[i] === 'default_branch') 
            attributeValue[i] = defaultBranch;
    }
  }

  if (trigger === 'push') 
    return shouldRunForBranch(branch, veracodeScanConfig.push);
  
  if (trigger === 'pull_request' && veracodeScanConfig.pull_request?.action?.includes(action)) {
    return shouldRunForTargetBranch(targetBranch, veracodeScanConfig.pull_request.target_branch);
  }
  
  return false;
}

module.exports = {
  shouldRunForRepository,
  shouldRunForBranch,
  shouldRunScanType,
}