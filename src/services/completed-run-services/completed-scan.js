const { updateChecksForCompletedSastScan } = 
  require('../check-services/update-checks-with-artifact');

async function updateChecksForCompletedScan (run, context) {
  let scaScanConfig;
  if (run.check_run_type === 'veracode-sca-scan') {
    scaScanConfig = {
      artifactName: 'Veracode Agent Based SCA Results',
      findingFileName: null,
      resultsUrlFileName: 'scaResults.txt',
      title: 'Veracode Software Composition Analysis',
      getAnnotations: function(json) {
        return [];
      }
    }
  } else if (run.check_run_type === 'veracode-iac-secrets-scan') {
    scaScanConfig = {
      artifactName: 'Veracode Container IaC Secrets Scanning Results',
      findingFileName: null,
      resultsUrlFileName: 'results.txt',
      title: 'Veracode Software Composition Analysis',
      getAnnotations: function(json) {
        return [];
      }
    }
  }
  await updateChecksForCompletedSastScan(run, context, scaScanConfig);
}

module.exports = {
  updateChecksForCompletedScan,
}