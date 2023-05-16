const mongoose = require("mongoose");

let RunSchema = new mongoose.Schema(
  {
    sha: {
      type: String
    },
    callback_url: {
      type: String
    },
    checks: [
      {
        run_id: {
          type: Number
        },
        name: {
          type: String
        },
        checks_run_id: {
          type: Number
        }
      }
    ],
    repository: {
      owner: {
        type: String
      },
      name: {
        type: String
      },
      full_name: {
        type: String
      },
      pull_request: {
        type: Number
      }
    },
    config: {
      workflows_repository: {
        type: String
      }
    }
  },
  { collection: "runs" }
);

const Run = mongoose.model("Run", RunSchema);
module.exports = {
  Run,
}