import { MongoClient, ObjectId } from "mongodb";
import jwt from "jsonwebtoken";
const JWT_SECRET =
  "4e2133a7c9f5de0728d0d00a4e71536c7f03ab18f6f56c927d4f5419208eeb42";
const uri =
  "mongodb+srv://darshanraut123:darshanraut123@cluster0.blxpgv4.mongodb.net/";
const client = new MongoClient(uri);

export default async function handler(req, res) {
  await client.connect();
  const database = client.db("video-hash"); // Replace with your database name
  const collection = database.collection("user");

  if (req.method === "GET") {
    try {
      const headers = req.headers;
      let token = headers.authorization;
      if (!token) {
        res
          .status(401)
          .json({ message: "Unauthorized! Provide correct headers" });
      }
      token = token.replace("Bearer ", "");
      console.log(token);
      const userJwt = jwt.verify(token, JWT_SECRET);
      console.log(userJwt);
      if (!userJwt) {
        res.status(401).json({ message: "Unauthorized! Incorrect token" });
      }
      const user = await collection.findOne({
        _id: new ObjectId(userJwt.userId),
      });
      console.log(user);

      if (!user) {
        res.status(401).json({ message: "Unauthorized! No user found" });
      }
      delete user.password;
      res.status(200).json({ message: "Authorized!", user });
    } catch (e) {
      console.log(e);
      res.status(500).json({ message: "Unauthorized! Error occured" });
    } finally {
      client.close();
    }
  }

  if (req.method === "POST") {
    console.log("body ===>  " + JSON.stringify(req.body));
    const body = req.body;

    if (!body.email || !body.password) {
      res.status(401).json({ message: "Provide correct data" });
    }

    try {
      const user = await collection.findOne({ email: body.email });
      console.log("user: " + user);
      if (!user) {
        res.status(401).json({ message: "User not found please register" });
      } else {
        const token = jwt.sign({ userId: user._id }, JWT_SECRET);
        user.token = token;
        res.status(200).json({
          message: "Authorized!",
          user,
        });
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Unauthorized! Error occured" });
    } finally {
      client.close();
    }
  } else {
    res.status(404).json({ message: "not found" });
  }
}
