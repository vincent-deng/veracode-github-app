// const myString1 = 'feature/*';
// const myRegExp1 = new RegExp('^' + myString1.replace(/\*/g, '.*') + '$');

// console.log(myRegExp1); // Output: /^feature\/.*/

// console.log(myRegExp1.test('feature/123')); // Output: true


// const myString2 = 'main';
// const myRegExp2 = new RegExp('^' + myString2.replace(/\*/g, '.*') + '$');
// console.log(myRegExp2); // Output: /^feature\/.*/

// console.log(myRegExp2.test('main')); // Output: true


// const myString3 = '*';
// const myRegExp3 = new RegExp('^' + myString3.replace(/\*/g, '.*') + '$');
// console.log(myRegExp3); // Output: /^feature\/.*/

// console.log(myRegExp3.test('vincentdeng')); // Output: true


// const mystr4 = 'veracode_container_security_scan'
// console.log(mystr4.replaceAll(/_/g, '-'));

// const var1 = 'veracode-local-compilation-scan';

// console.log(var1.substring(0,26));

// var mongoClient = require("mongodb").MongoClient;
// mongoClient.connect("mongodb://veracode-github-app:zMuA8obs9rrArC5cDqrtaTHCZrY8fhDI17fva1IW6i6C4aZUOd4zLk27Pdu6EWSejOQBC13WFLwzACDb1NqMSA%3D%3D@veracode-github-app.mongo.cosmos.azure.com:10255/?ssl=true&retrywrites=false&maxIdleTimeMS=120000&appName=@veracode-github-app@", function (err, client) {
//   client.close();
// });

const db = require('../src/db/cosmo-client');

// query the database
// async function run() {
//   try {
//     await client.connect();
//     const database = client.db('veracode-github-app');
//     const collection = database.collection('runs');
//     // Query for a movie that has the title 'Back to the Future'
//     const query = { _id: new ObjectId('60e8d7e1f1c0b2000a5a5d1e') };
//     const options = {
//       // sort matched documents in descending order by rating
//       sort: { run_id: -1 },
//     };
//     const movie = await collection.findOne(query, options);
//     console.log(movie);
//   } finally {
//     // Ensures that the client will close when you finish/error
//     await client.close();
//   }
// }

// run().catch(console.dir);

// add a record into the database
async function run() {
  let database;
  try {
    database = await db.connect();
    const collection = database.collection('runs');
    const doc = { run_id: '11111', check_run_type: 'veracode-sca-scan' };
    const result = await collection.insertOne(doc);
    console.log(
      `${result.insertedCount} documents were inserted with the _id: ${result.insertedId}`,
    );
  } catch (err) {
    console.log('Error connecting to database', err);
  } finally {
    if (db) {
      await db.close();
    }
  }
}

run();