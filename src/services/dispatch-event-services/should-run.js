function shouldRunForRepository(repositoryName, exclude) {
  const excludeMatch = exclude.some((repository) => {
    return new RegExp('^' + repository.replace(/\*/g, '.*') + '$').test(repositoryName)
  });    

  if (excludeMatch) return false;
  return true;
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

module.exports = {
  shouldRunForRepository,
  shouldRunForBranch
}