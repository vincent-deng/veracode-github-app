const DynamoDbSchema = require('@aws/dynamodb-data-mapper').DynamoDbSchema
const DynamoDbTable = require("@aws/dynamodb-data-mapper").DynamoDbTable
const { dynamodb_table } = require('../utils/constants')

class Run {}

Object.defineProperties(Run.prototype, {
  [DynamoDbTable]: { value: dynamodb_table },
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