// const fs = require("fs-extra");
// const AdmZip = require("adm-zip");
// const { artifact_folder } = require('../../utils/constants');
const { updateChecksForCompletedSastScan } = 
  require('../check-services/update-checks-with-artifact');

async function updateChecksForCompletedSCAScan (run, context) {
  const scaScanConfig = {
    artifactName: 'Veracode Agent Based SCA Results',
    findingFileName: null,
    resultsUrlFileName: 'scaResults.txt',
    title: 'Veracode Software Composition Analysis',
    getAnnotations: function(json) {
      return [];
    }
  }
  await updateChecksForCompletedSastScan(run, context, scaScanConfig);
}

module.exports = {
  updateChecksForCompletedSCAScan,
}