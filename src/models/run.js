const mongoose = require('mongoose');

const runSchema = new mongoose.Schema({
  run_id: { type: Number, required: true },
  sha: { type: String, required: true },
  repository_owner: { type: String, required: true },
  repository_name: { type: String, required: true },
  check_run_id: { type: Number, required: true },
  check_run_type: { type: String, required: true },
  branch: { type: String, required: true }
});

const Run = mongoose.model('runs', runSchema);

module.exports = Run;