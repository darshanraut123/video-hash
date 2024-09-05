// pages/api/read-qrcode.js

import Jimp from "jimp";
import QrCodeReader from "qrcode-reader";
import path from "path";

export default async function handler(req, res) {
  // Path to the QR code image
  const imagePath = path.join(process.cwd(), "public", "watermarkqrcode.png");

  try {
    console.log(imagePath);
    // Load the image containing the QR code
    const image = await Jimp.read(imagePath);

    if (!image || !image.bitmap) {
      throw new Error("Failed to load image or image has no bitmap data");
    }

    const a = await readCode();
    console.log(a);
  } catch (err) {
    console.error("Image processing error:", err);
    res.status(500).json({ error: "Failed to process image" });
  }
}

function readCode() {
  return new Promise((resolve, reject) => {
    // Initialize QR code reader
    const qr = new QrCodeReader();
    // Decode QR code
    qr.decode(image.bitmap, (err, result) => {
      if (err) {
        console.error("QR code reading error:", err);
        reject({ error: "Failed to read QR code" });
      }

      if (!result) {
        reject({ error: "No QR code found in the image" });
      }
      console.log(result);
      // Return the decoded QR code data
      resolve({ result: result.result });
    });
  });
}
