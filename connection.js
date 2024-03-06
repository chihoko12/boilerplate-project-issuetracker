require('dotenv').config();
const { MongoClient } = require('mongodb');
const URI = process.env.MONGI_URI;
const client = new MongoClient(URI, { useNewUrlParser: true, userUnifiedTopology: true });

async function main(callback) {

  try {
    // connect to the MongoDB cluster
    await client.connect();

    // Make the appropriate DB calls
    await callback(client);
  } catch (e) {
    // catch any errors
    console.error(e);
    throw new Error('Unable to Connect to Database')
  }
}

module.exports = main;
