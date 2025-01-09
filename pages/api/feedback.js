import { MongoClient } from "mongodb";

const uri =
  "mongodb+srv://darshanraut123:darshanraut123@cluster0.blxpgv4.mongodb.net/";
const client = new MongoClient(uri);

export default async function handler(req, res) {
  try {
    await client.connect();
    const database = client.db("video-hash"); // Replace with your database name
    if (req.method === "POST") {
      console.log("body ===>  " + req.body);
      const body = req.body;
      const collection = database.collection("feedback");
      const result = await collection.insertOne({
        ...body,
        createdAt: new Date().toLocaleString(),
      });
      res.status(200).json(result);
    } else if (req.method === "GET") {
      const collection = database.collection("feedback");
      const records = await collection.find().toArray();
      console.log(records);
      res.status(200).json(records);
    } else {
      res.status(404).json({ message: "Not found" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    await client.close();
  }
}
