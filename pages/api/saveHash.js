import { MongoClient } from "mongodb";

const uri =
  "mongodb+srv://darshanraut123:darshanraut123@cluster0.blxpgv4.mongodb.net/";
const client = new MongoClient(uri);

export default async function handler(req, res) {
  await client.connect();
  const database = client.db("video-hash"); // Replace with your database name
  const collection = database.collection("videoHashRecords");
  if (req.method === "POST") {
    console.log("body ===>  " + req.body);
    const body = req.body;
    // Insert the fingerprint and JSON data into the collection
    const result = await collection.insertOne({ _id: body.videoId, ...body });
    res.status(200).json(result);
  } else if (req.method === "GET") {
    const { videoId } = req.query;
    if (!videoId) res.status(404).json({ message: "not found" });
    const document = await collection.findOne({ videoId: videoId });
    if (document) res.status(200).json({ document, message: "found" });
    else res.status(200).json({ message: "not found" });
  }
}
