import { MongoClient } from "mongodb";

const uri =
  "mongodb+srv://darshanraut123:darshanraut123@cluster0.blxpgv4.mongodb.net/";
const client = new MongoClient(uri);

export default async function handler(req, res) {
  if (req.method === "POST") {
    // Connect to MongoDB
    await client.connect();
    const database = client.db("video-hash"); // Replace with your database name
    const collection = database.collection("videoHashRecords");
    console.log("body ===>  " + req.body);
    const body = req.body;
    // Insert the fingerprint and JSON data into the collection
    const result = await collection.insertOne(body);
    res.status(200).json(result);
  }
}
