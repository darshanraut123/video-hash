import { MongoClient } from "mongodb";

const uri =
  "mongodb+srv://darshanraut123:darshanraut123@cluster0.blxpgv4.mongodb.net/";
const client = new MongoClient(uri);

export default async function handler(req, res) {
  try {
    // Connect to the MongoDB client
    await client.connect();
    const database = client.db("video-hash"); // Replace with your database name
    const collection = database.collection("photoHashRecords");

    if (req.method === "GET") {
      const { email } = req.query;

      // Validate query parameter
      if (!email) {
        res.status(400).json({ message: "Provide email in query params" });
        return;
      }

      // Query MongoDB to find records matching the email
      let documentList = await collection
        .find({
          "user.email": email,
          publicData: { $exists: true, $ne: null }, // Ensure publicData exists and is not null
        })
        .project({ publicData: 1, _id: 0 }) // Return only the `publicData` field
        .sort({ createdAt: -1 }) // Sort by `createdAt` in descending order
        .toArray();

      if (documentList.length > 0) {
        documentList = documentList.map((doc) => doc.publicData);
        res
          .status(200)
          .json({ publicDataList: documentList, message: "Found" });
      } else {
        res.status(404).json({ message: "No records found" });
      }
    } else {
      res.status(405).json({ message: "Method not allowed" });
    }
  } catch (error) {
    console.error("Error fetching data:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  } finally {
    await client.close(); // Ensure the client is closed after use
  }
}
