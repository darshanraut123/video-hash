import multer from "multer";
import ffmpeg from "fluent-ffmpeg";
import path from "path";
import fs from "fs";
import ffmpegStatic from "ffmpeg-static";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "../../src/config";

ffmpeg.setFfmpegPath(ffmpegStatic);
const upload = multer({ dest: "uploads/" });
const parameters = [
  ["-vf", "scale=640:360"], // Resize video
  ["-c:v", "libx264"], // Set video codec
  ["-b:v", "1000k"], // Set video bitrate
  ["-c:a", "aac"], // Set audio codec
  ["-b:a", "128k"], // Set audio bitrate
  ["-preset", "fast"], // Set encoding speed
  ["-vf", "delogo=x=50:y=50:w=100:h=50"], // Remove watermark
];
const parametersDetails = [
  "Resize_video",
  "video_codec",
  "video_bitrate",
  "audio_codec",
  "audio_bitrate",
  "encoding_speed",
  "Remove_watermark",
];
export const config = {
  api: {
    bodyParser: false, // Disable Next.js's default body parser
  },
};

export default async function handler(req, res) {
  if (req.method === "POST") {
    // Handle the file upload using multer
    console.log(upload, "upload");
    upload.single("video")(req, res, async (err) => {
      if (err) {
        return res.status(500).json({ success: false, error: err.message });
      }
    
      const { file } = req;
      const { outputFileName } = req.body;
    
      if (!file) {
        return res.status(400).json({ success: false, error: "No file uploaded." });
      }
    
      const outputPath = path.join(process.cwd(), "public", outputFileName);
    
      try {
        const outputArray = await Promise.all(
          parameters.map((option, id) => {
            return new Promise((resolve, reject) => {
              ffmpeg(file.path)
                .outputOptions(option)
                .on("end", async () => {
                  try {
                    console.log(file.originalname, "file");
                    
                    const processedFileBuffer = fs.readFileSync(outputPath);
                    const storageRef = ref(
                      storage,
                      `${file.originalname}/${parametersDetails[id]}_${file.originalname}`
                    );
                    await uploadBytes(storageRef, processedFileBuffer, {
                      contentType: "video/mp4",
                    });
    
                    const url = await getDownloadURL(storageRef);
                    let obj={
                      url:url,
                      filename:parametersDetails[id],
                    }
                    console.log("URL obtained:", url);
                    resolve(obj);
                  } catch (uploadErr) {
                    reject(uploadErr);
                  }
                })
                .on("error", (err) => {
                  console.error("Error: " + err.message);
                  reject(err);
                })
                .save(outputPath);
            });
          })
        );
    
        res.status(200).json({ success: true, response: outputArray });
        console.log("Success", outputPath);
      } catch (processingError) {
        res.status(500).json({ success: false, error: processingError.message });
        console.error("Processing error: ", processingError.message);
      }
    });
    

    // // Upload to Firebase Storage
  } else {
    res.status(405).json({ error: `Method '${req.method}' Not Allowed` });
  }
}
