import fs from "fs";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
import multer from "multer";
import { exec } from "child_process";
import QRCode from "qrcode";
ffmpeg.setFfmpegPath(ffmpegStatic);

export const config = {
  api: {
    bodyParser: false, // Disables body parsing for multer to handle it
  },
};

const upload = multer({ dest: "public" });

export default function handler(req, res) {
  res.status(200).json({ message: "Accepted" });
  upload.single("video")(req, res, async (err) => {
    if (err) {
      return res.status(500).send("Failed to upload video");
    }
    console.log(req.body);
    console.log(req.file);
    req.body.metaData = JSON.parse(req.body.metaData);
    let metaData = req.body.metaData;
    const inputVideo = req.file.path;
    const basename = path.basename(
      req.file.originalname,
      path.extname(req.file.originalname)
    );
    const outputVideo = path.join(
      process.cwd(),
      "public",
      basename,
      basename + "_final.mp4"
    );

    const watermarks = [];

    for (let index = 0; index < metaData.length; index++) {
      const element = metaData[index];
      // File path to save the QR code image
      const outputPath = path.join(
        process.cwd(),
        "public",
        basename + "_" + index + "_watermark.png"
      );

      try {
        // Generate QR code and save it as an image file
        await QRCode.toFile(outputPath, JSON.stringify(element));
        watermarks.push({
          path: outputPath,
          scale: "100:100",
          startTime: index * 5,
          endTime: index * 5 + 5,
        }); // Add the outputPath to the array after the QR code is generated
      } catch (err) {
        console.log(err);
      }
    }

    console.log(watermarks); // This will be an array of all the file paths generated

    if (!fs.existsSync(path.join(process.cwd(), "public", basename))) {
      fs.mkdirSync(path.join(process.cwd(), "public", basename));
    }

    // Build the -i part for the watermarks
    const watermarkInputs = watermarks.map((wm) => `-i ${wm.path}`).join(" ");

    // Build the scale and overlay filters
    const filterComplex = watermarks
      .map((wm, index) => {
        const scaleFilter = `[${index + 1}:v] scale=${wm.scale} [wm${
          index + 1
        }]`;
        const overlayFilter =
          index === 0
            ? `[0:v][wm${index + 1}] overlay=10:10:enable='between(t,${
                wm.startTime
              },${wm.endTime})'[v${index + 1}]`
            : `[v${index}][wm${index + 1}] overlay=10:10:enable='between(t,${
                wm.startTime
              },${wm.endTime})'[v${index + 1}]`;
        return `${scaleFilter};${overlayFilter}`;
      })
      .join(";");

    // Construct the full command
    const ffmpegCommand = `ffmpeg -i ${inputVideo} ${watermarkInputs} -filter_complex "${filterComplex}" -map "[v${watermarks.length}]" -map 0:a ${outputVideo}`;

    console.log(ffmpegCommand);

    // Execute FFmpeg command
    exec(ffmpegCommand, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing FFmpeg: ${error.message}`);
        res.status(500).json({ error: "Error processing video" });
      }
      if (stderr) {
        console.error(`FFmpeg stderr: ${stderr}`);
      }
      console.log(`FFmpeg stdout: ${stdout}`);
      res
        .status(200)
        .json({ message: "Video processed successfully", outputVideo });
    });
  });
}
