import { MongoClient } from "mongodb";

const uri =
  "mongodb+srv://darshanraut123:darshanraut123@cluster0.blxpgv4.mongodb.net/";
const client = new MongoClient(uri);

export default async function handler(req, res) {
  try {
    await client.connect();
    const database = client.db("video-hash"); // Replace with your database name
    const collection = database.collection("verifylogs");
    if (req.method === "POST") {
      console.log("body ===>  " + req.body);
      const body = req.body;
      const result = await collection.insertOne({
        ...body,
        createdAt: new Date().toLocaleString(),
      });
      res.status(200).json(result);
    } else if (req.method === "GET") {
      const document = await collection.find({}).toArray();
      if (document) res.status(200).json({ logs: document, message: "found" });
      else res.status(200).json({ message: "not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  } finally {
    await client.close();
  }
}
