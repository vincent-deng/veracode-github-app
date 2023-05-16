const mongoose = require('mongoose');
const appConfig = require('../app-config');

// const mongoUri = process.env.COSMOSDB_URI ?? 'mongodb://veracode-github-app:zMuA8obs9rrArC5cDqrtaTHCZrY8fhDI17fva1IW6i6C4aZUOd4zLk27Pdu6EWSejOQBC13WFLwzACDb1NqMSA==@veracode-github-app.mongo.cosmos.azure.com:10255/?ssl=true&retrywrites=false&maxIdleTimeMS=120000';
// const dbName = process.env.COSMOSDB_DBNAME ?? 'veracode-github-app';

// // const client = new MongoClient(mongoUri);

// // module.exports = {
// //   connect: async function () {
// //     try {
// //       await client.connect();
// //       console.log('Successfully connected to Cosmos DB MongoDB');
// //       const db = client.db(dbName);
// //       return db;
// //     } catch (err) {
// //       console.log('Error connecting to Cosmos DB MongoDB', err);
// //     }
// //   },
// //   close: function () {
// //     client.close();
// //     console.log('Connection to Cosmos DB MongoDB closed');
// //   },
// // };


// async function connect() {
//   const client = await MongoClient.connect(mongoUri);
//   const database = client.db(dbName);
//   return database;
// }

// module.exports = { connect };

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