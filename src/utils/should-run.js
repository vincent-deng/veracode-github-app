function shouldRun(repositoryName, exclude) {
  const excludeMatch = exclude.some((repository) => {
    return new RegExp('^' + repository.replace(/\*/g, '.*') + '$').test(repositoryName)
  });    

  if (excludeMatch) return false;
  return true;
}

module.exports = {
  shouldRun,
}