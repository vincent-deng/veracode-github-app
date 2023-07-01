const DynamoDbSchema = require('@aws/dynamodb-data-mapper').DynamoDbSchema
const DynamoDbTable = require("@aws/dynamodb-data-mapper").DynamoDbTable
const appConfig = require('../app-config');

class Run {}

Object.defineProperties(Run.prototype, {
  [DynamoDbTable]: { value: appConfig().dbName },
  [DynamoDbSchema]: {
    value: {
      run_id: {
        type: 'Number',
        keyType: 'HASH'
      },
      sha: { type: 'String' },
      repository_owner: { type: 'String' },
      repository_name: { type: 'String' }, 
      check_run_id: { type: 'Number' },
      check_run_type: { type: 'String' },
      branch: { type: 'String' }
    }
  }
})

module.exports = Run