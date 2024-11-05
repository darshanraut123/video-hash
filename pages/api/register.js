import { MongoClient } from "mongodb";
import bcrypt from "bcrypt";
const saltRounds = 10;
const uri =
  "mongodb+srv://darshanraut123:darshanraut123@cluster0.blxpgv4.mongodb.net/";
const client = new MongoClient(uri);

export default async function handler(req, res) {
  await client.connect();
  const database = client.db("video-hash"); // Replace with your database name
  const collection = database.collection("user");

  if (req.method === "POST") {
    console.log("body ===>  " + JSON.stringify(req.body));
    const body = req.body;

    if (!body.email || !body.name || !body.password) {
      res.status(401).json({ message: "Please provide correct data" });
    }

    try {
      let user = await collection.findOne({ email: body.email });
      if (!user) {
        const salt = bcrypt.genSaltSync(saltRounds);
        const password = bcrypt.hashSync(body.password, salt);
        await collection.insertOne({ ...body, password });
        res.status(200).json({
          message: "Registration success",
          name: body.name,
          email: body.email,
        });
      } else {
        console.log("User found:", user);
        res.status(401).json({ message: "User exists please login" });
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  } else {
    res.status(404).json({ message: "not found" });
  }
}
