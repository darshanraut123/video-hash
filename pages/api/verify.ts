import { createHash } from "crypto";
import fs from "fs";
import { MongoClient } from "mongodb";
import multer from "multer";
import path from "path";
import { promisify } from "util";

const upload = multer({ dest: "uploads/" }); // Save the files in the 'uploads' directory

const uri =
  "mongodb+srv://darshanraut123:darshanraut123@cluster0.blxpgv4.mongodb.net/";
const client = new MongoClient(uri);

// Promisify the fs.readFile function
const readFile = promisify(fs.readFile);

const handler = async (req, res) => {
  if (req.method === "POST") {
    const body = req.body;
    console.log("body ===>  " + JSON.stringify(body));

    const genHashurl = "http://rrdemo.buzzybrains.net/vapi/generateHash";
    const subscriptionKey = "8de99f71e2264c6cb1d567bd9d2864a2";
    const response = await fetch(genHashurl, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": subscriptionKey,
        "Content-Type": "application/json",
      },
      body,
    });
    const resdata = await response.json();
    const sourceHash = resdata.hash;

    // Connect to MongoDB
    await client.connect();
    const database = client.db("video-hash"); // Replace with your database name
    const collection = database.collection("videos");
    const allDbRecords = await collection.find().toArray();
    const targetHashes = allDbRecords.map((recObj) => recObj.fingerprint);

    const compareHashesurl = "http://rrdemo.buzzybrains.net/vapi/compareHashes";
    const data = {
      sourceHash,
      targetHashes,
    };
    try {
      const response = await fetch(compareHashesurl, {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": subscriptionKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      console.log("Response:", result);

      if (result.similar_hashes.length > 0) {
        const similarHashesArr = result.similar_hashes
          .filter((item) => item.hamming_distance != 0)
          .map((item) => item.target_hash);
        const exactMatch = result.similar_hashes.find(
          (item) => item.hamming_distance === 0
        );
        const query = { fingerprint: { $in: similarHashesArr } };
        const similarRecords = await collection.find(query).toArray();
        const exactMatchRecord = await collection.findOne({
          fingerprint: exactMatch.target_hash,
        });
        res.status(200).json({
          message: "Matching ecords found.",
          exactMatchRecord,
          similarRecords,
        });
      } else {
        res.status(200).json({
          message: "No matching records found.",
          exactMatchRecord: null,
          similarRecords: [],
        });
      }
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "Verification failed." });
    }
  }
};

export default handler;
