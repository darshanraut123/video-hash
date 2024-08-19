import { createHash } from 'crypto';
import fs from 'fs';
import { MongoClient } from 'mongodb';
import multer from 'multer';
import path from 'path';
import { promisify } from 'util';

const upload = multer({ dest: 'uploads/' }); // Save the files in the 'uploads' directory

const uri = 'mongodb+srv://darshanraut123:darshanraut123@cluster0.blxpgv4.mongodb.net/';
const client = new MongoClient(uri);

// Promisify the fs.readFile function
const readFile = promisify(fs.readFile);

// Disable the default Next.js body parser
export const config = {
  api: {
    bodyParser: false,
  },
};

const handler = async (req, res) => {
  if (req.method === 'POST') {
    try {
      // Use multer to handle the file upload
      await new Promise((resolve, reject) => {
        upload.single('video')(req, res, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve({});
          }
        });
      });

      // Get the uploaded file path
      const filePath = path.resolve('./', req.file.path);

      // Read the file and generate a fingerprint using SHA-256
      const fileBuffer = await readFile(filePath);
      const hash = createHash('sha256').update(fileBuffer).digest('hex');

      // Clean up the uploaded file if needed
      fs.unlinkSync(filePath);

      // Parse additional JSON data from the request body
      const metaData = JSON.parse(req.body.metaData);

      // Connect to MongoDB
      await client.connect();
      const database = client.db('video-hash'); // Replace with your database name
      const collection = database.collection('videos');

      // Insert the fingerprint and JSON data into the collection
      const result = await collection.insertOne({
        fingerprint: hash,
        metaData: metaData,
        uploadedAt: new Date(),
      });

      // Return the fingerprint and the inserted ID
      res.status(200).json({ fingerprint: hash, id: result.insertedId });
    } catch (error) {
      console.error('Error processing file:', error);
      res.status(500).json({ error: 'File upload failed.' });
    } finally {
      await client.close();
    }
  } else {
    res.status(405).json({ error: 'Method not allowed.' });
  }
};

export default handler;
