const mongoose = require('mongoose');
const mongoUri = process.env.DB_HOST || '127.0.0.1'

let connection = 'down';

async function dbConnect() {
  const mongoDB = `mongodb://${mongoUri}/veracode_github_app`;
  mongoose.set("strictQuery", false);
  try {
    await mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });
    connection = 'up'
    console.log("MongoDB database connection established successfully");
  } catch (error) {
    onnection = 'down';
    throw e;
  }

  return { dbStatus };
}

function dbStatus() {
  return { 
    connection, 
    dbState: mongoose.STATES[mongoose.connection.readyState]
  }
};

module.exports = {
  dbConnect,
}