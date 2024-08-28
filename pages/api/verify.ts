import { MongoClient } from "mongodb";

const uri =
  "mongodb+srv://darshanraut123:darshanraut123@cluster0.blxpgv4.mongodb.net/";
const client = new MongoClient(uri);

const handler = async (req, res) => {
  if (req.method === "POST") {
    let body = req.body;
    if (typeof body !== "string") body = JSON.stringify(body);

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
    const data = await response.json();
    const sourceHash = data.hash;
    console.log("sourceHash ===> " + sourceHash);

    const pipeline = [
      {
        $addFields: {
          hammingDistance: {
            $sum: {
              $map: {
                input: { $range: [0, { $strLenCP: "$fingerprint" }] },
                as: "index",
                in: {
                  $cond: {
                    if: {
                      $ne: [
                        { $substrCP: ["$fingerprint", "$$index", 1] },
                        { $substrCP: [sourceHash, "$$index", 1] },
                      ],
                    },
                    then: 1,
                    else: 0,
                  },
                },
              },
            },
          },
        },
      },
      {
        $match: {
          hammingDistance: { $lt: 11 },
        },
      },
      {
        $sort: { hammingDistance: 1 }, // Sort by hammingDistance in ascending order
      },
    ];

    // Connect to MongoDB
    await client.connect();
    const database = client.db("video-hash"); // Replace with your database name
    const collection = database.collection("videos");

    try {
      // Await the aggregation results
      const result = await collection.aggregate(pipeline).toArray();
      console.log("K-Nearest Neighbors:", result);

      if (result.length > 0) {
        // Find similar hashes
        const similarHashesArr = result
          .filter((item) => item.hammingDistance != 0)
          .map((item) => item.fingerprint);

        const query = { fingerprint: { $in: similarHashesArr } };
        let similarRecords = await collection.find(query).toArray();

        similarRecords = similarRecords.map((rec) => {
          const similarHashesSingleObject: any = result.find(
            (item) => item.fingerprint === rec.fingerprint
          );
          return {
            ...rec,
            metaData: [
              ...rec.metaData,
              {
                key: "Hamming Distance",
                value: similarHashesSingleObject.hammingDistance,
              },
            ],
          };
        });

        // Find exact hash
        const exactMatch = result.find((item) => item.hammingDistance === 0);

        let exactMatchRecord: any = null;
        if (exactMatch) {
          exactMatchRecord = await collection.findOne({
            fingerprint: exactMatch.fingerprint,
          });
          exactMatchRecord = {
            ...exactMatchRecord,
            metaData: [
              ...exactMatchRecord.metaData,
              { key: "Hamming Distance", value: 0 },
            ],
          };
        }

        res.status(200).json({
          message: "Matching records found.",
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
