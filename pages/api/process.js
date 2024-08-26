import multer from "multer";
import ffmpeg from "fluent-ffmpeg";
import path from "path";
import fs from "fs";
import ffmpegStatic from "ffmpeg-static";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../src/config";
import { promisify } from "util";

ffmpeg.setFfmpegPath(ffmpegStatic);

const parameters = [
  [
    "-c:v libx265", // Using H.265 for video encoding
    "-x265-params log-level=error", // Example of codec-specific parameters
  ], //mkv
  [
    // Set format to MPEG
    "-vcodec mpeg2video", // Set video codec to MPEG-2
    "-acodec mp2", // Set audio codec to MP2 (common in MPEG-2)
    "-b:v 5000k", // Set video bitrate (e.g., 5000 kbps for high quality)
    "-b:a 192k", // Set audio bitrate
    "-ar 48000", // Set audio sample rate (48 kHz is standard for video)
    "-s 720x480", // Set frame size (e.g., DVD standard)
  ], // mpeg
  [
    "-ss 10", // Start time
    "-to 30", // End time
    "-c copy", // Use stream copy to avoid re-encoding (fast and no quality loss)
  ], // trimmed
  ["-b:v 1000k", "-b:a 128k"], // Compressed
  ["-vf", "scale=640:360"], // Resize video
  ["-vf", "colorchannelmixer=.3:.4:.3:0:.3:.4:.3:0:.3:.4:.3"], // Tinted video
  ["-vf", "crop=640:480:10:10"], // Cropped
  ["-c:v", "libx264"], // Set video codec
  ["-b:v", "1000k"], // Set video bitrate
  ["-preset", "fast"], // Set encoding speed
];

const parameterDescriptions = [
  "mkv",
  "mpeg",
  "trimmed",
  "compressed",
  "resized",
  "tinted",
  "cropped",
  "video_codec",
  "video_bitrate",
  "fast_encoding_speed",
];

export const config = {
  api: {
    bodyParser: false, // Disable Next.js's default body parser
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ error: `Method '${req.method}' Not Allowed` });
  }

  //   fs.rmSync("uploads/", { recursive: true, force: true });

  // Set up Multer
  const upload = multer({ dest: "uploads/" });
  const uploadSingle = promisify(upload.single("video"));

  try {
    // Await the execution of multer middleware
    await uploadSingle(req, res);

    // At this point, multer has processed the file, and it's available via req.file
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, error: "No file uploaded." });
    }

    const outputArray = await processVideo(
      req.file,
      parameters,
      parameterDescriptions
    );

    res.status(200).json({ success: true, response: outputArray });
  } catch (err) {
    // This will catch any error thrown by Multer or the processVideo function
    res.status(500).json({ success: false, error: err.message });
  }
}

async function processVideo(file, parameters, parameterDescriptions) {
  const outputArray = [];

  for (let index = 0; index < parameters.length; index++) {
    const option = parameters[index];
    const description = parameterDescriptions[index];
    const basename = path.basename(
      file.originalname,
      path.extname(file.originalname)
    );

    let ext = ".mp4";

    switch (description) {
      case "mpeg": {
        ext = ".mpeg";
        break;
      }
      case "mkv": {
        ext = ".mkv";
        break;
      }
      default:
        ext = ".mp4";
    }

    description;
    const outputPath = path.join(
      process.cwd(),
      "public",
      `${description}_${basename}${ext}`
    );

    try {
      await processWithFFmpeg(file.path, option, outputPath);
      const url = await uploadToFirebase(
        basename,
        description,
        outputPath,
        ext
      );
      outputArray.push({ url, filename: description });
      console.log(index + 1 + " File out of " + parameters.length);
    } catch (error) {
      console.error(`Error processing ${description}: ${error.message}`);
    }
  }
  return outputArray;
}

function processWithFFmpeg(filePath, option, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(filePath)
      .outputOptions(option)
      .on("end", resolve)
      .on("error", reject)
      .save(outputPath);
  });
}

async function uploadToFirebase(originalName, description, filePath, ext) {
  const fileBuffer = fs.readFileSync(filePath);
  const storageRef = ref(
    storage,
    `${originalName}/${description}_${originalName}${ext}`
  );
  await uploadBytes(storageRef, fileBuffer);
  const url = await getDownloadURL(storageRef);
  fs.unlinkSync(filePath);
  return url;
}
