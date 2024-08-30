import { MongoClient } from "mongodb";

const uri =
  "mongodb+srv://darshanraut123:darshanraut123@cluster0.blxpgv4.mongodb.net/";
const client = new MongoClient(uri);

const handler = async (req, res) => {
  if (req.method === "POST") {
    console.log("body ===>  " + req.body);
    const body = req.body;

    const url = "https://rrdemo.buzzybrains.net/vapi/generateHash";
    const subscriptionKey = "8de99f71e2264c6cb1d567bd9d2864a2";
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": subscriptionKey,
        "Content-Type": "application/json",
      },
      body,
    });
    const newHashUrl = "https://rrdemo.buzzybrains.net/vpdq/generate_hashes";

    let Videourl = JSON.parse(req.body);
    console.log(Videourl.url, "urlll");
    const reqData = {
      video_url: Videourl.url,
    };

    const Hashresponse = await fetch(newHashUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(reqData),
    });
    const Hashesdata = await Hashresponse.json();
    console.log(Hashesdata, "hash");

    const data = await response.json();

    // Connect to MongoDB

    await client.connect();
    const database = client.db("video-hash"); // Replace with your database name
    const collection = database.collection("videos");

    const bodyObj = JSON.parse(body);
    // Insert the fingerprint and JSON data into the collection
    const result = await collection.insertOne({
      fingerprint: data.hash,
      hashes: JSON.stringify(Hashesdata.hashes),
      metaData: [
        ...bodyObj.metaData,
        {
          key: "UploadedAt",
          value:
            new Date().toLocaleDateString() +
            " " +
            new Date().toLocaleTimeString(),
        },
        {
          key: "Download",
          value: bodyObj.url,
        },
      ],
      uploadedAt: new Date(),
    });

    res.status(200).json(result);
  }
};

export default handler;
