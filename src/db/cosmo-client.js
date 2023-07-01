const mongoose = require('mongoose');
const appConfig = require('../app-config');

async function dbConnect() {
  try {
    await mongoose.connect(`${appConfig().cosmodbUri}`, {
      dbName: `${appConfig().dbName}`,
    })

    connection = 'up'
    console.log("DB connection established");
  } catch (e) {
    connection = 'down';
    throw e;
  }
}

module.exports = { dbConnect }