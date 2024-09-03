// pages/api/generate-qrcode.js

import QRCode from "qrcode";
import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  // The plain string you want to encode in the QR code

  const plainString = req.body;

  // const plainString = {
  //   timeStamp: "2024-09-02T18:48:38.066Z",
  //   hash: "1101111011011110010000110010100111011001110110000010000001100001",
  //   uniqueSegmentId: "dc32ade6-7da4-4c90-bd65-1892cce37e9b",
  //   frameSeconds: 5,
  //   beaconUniqueId:
  //     "7665F054F21B50DF62CD3E50AF8EB783E30D271B091DE051212D301E0E3D17FFCF0367DB41CFFD3C51E88BDE0B0621F49EB03435BC373D5D49480941A8B3547E",
  //   beaconTimeStamp: "2018-07-23T19:26:00.000Z",
  //   beaconVersion: "Version 2.0",
  //   unixTimestamp: 1725302918,
  // };

  // File path to save the QR code image
  const outputPath = path.join(process.cwd(), "public", "qrcode.png");

  try {
    // Generate QR code and save it as an image file
    await QRCode.toFile(outputPath, JSON.stringify(plainString));

    // Send back the file path
    res
      .status(200)
      .json({ message: "QR code generated successfully", outputPath });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate QR code" });
  }
}
