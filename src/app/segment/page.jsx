"use client";
import { useEffect, useRef, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import uuid from "uuid-random";
import QRCode from "qrcode";
import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";
import { base64StringToBlob } from "blob-util";
import fft from "fft-js";

const ffmpeg = createFFmpeg({
  corePath: "https://unpkg.com/@ffmpeg/core@0.10.0/dist/ffmpeg-core.js",
  log: true,
});

const VideoFrameExtractor = () => {
  const videoFileInputRef = useRef(null);
  const videoElementRef = useRef(null);
  const [finalArrOp, setFinalArrOp] = useState([]);
  const [latestBeaconUi, setLatestBeaconUi] = useState(null);
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState("");
  const [videoOutputSrc, setVideoOutputSrc] = useState("");
  let latestBeacon = useRef(null);
  let fileRef = useRef(null);

  useEffect(() => {
    const loadFFmpeg = async () => {
      if (!ffmpeg.isLoaded()) {
        await ffmpeg.load();
        setReady(true);
      }
    };
    loadFFmpeg();
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/phash-js/dist/phash.min.js";
    script.onload = () => {
      console.log("pHash script loaded");
    };
    script.onerror = () => {
      setError("Failed to load pHash script");
    };
    document.body.appendChild(script);

    const fetchBeacon = () => {
      fetch("/api/beacon")
        .then((response) => response.json())
        .then((data) => {
          setLatestBeaconUi(data);
          latestBeacon.current = data;
        })
        .catch((error) => console.error("Error fetching beacon:", error));
    };

    // Set up an interval to fetch the beacon every 2 seconds
    const intervalId = setInterval(fetchBeacon, 3000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const videoElement = videoElementRef.current;
    let duration = null;
    let lastCapturedTime = 0;

    const handleVideoFileChange = async (event) => {
      let resultsContainer = document.querySelector(".results-container");
      if (resultsContainer) resultsContainer.remove();

      const file = event.target.files[0];
      fileRef.current = file;
      const fileURL = URL.createObjectURL(file);
      videoElement.src = fileURL;

      videoElement.addEventListener("loadedmetadata", () => {
        duration = videoElement.duration;
        console.log(duration);
      });

      videoElement.addEventListener("timeupdate", () => {
        const currentTime = Math.floor(videoElement.currentTime);
        if (currentTime >= lastCapturedTime + 5) {
          lastCapturedTime = currentTime;
          captureFrame(lastCapturedTime);
        }
      });

      videoElement.addEventListener("ended", () => {
        console.log(setFinalArrOp);
        toast("Playback completed");
      });
    };

    const captureFrame = async (lastCapturedTime) => {
      let canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      const hash = await generatePHash(canvas);

      const eachSegmentData = {
        timeStamp: new Date(),
        hash,
        uniqueSegmentId: uuid(),
        frameSeconds: lastCapturedTime,
      };

      await getNistBeaconByCurrentTimestamp(eachSegmentData);
      setFinalArrOp((prev) => [...prev, eachSegmentData]);
    };

    const generatePHash = (canvas) => {
      return new Promise(async (resolve) => {
        const file = await canvasToFile(canvas, "fileName");
        const { value } = await window.pHash.hash(file);
        resolve(value);
      });
    };

    const canvasToFile = (canvas, filename) => {
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          const file = new File([blob], filename, { type: "image/png" });
          resolve(file);
        }, "image/png");
      });
    };

    const getNistBeaconByCurrentTimestamp = async (eachSegmentData) => {
      try {
        const unixTimestamp = Math.floor(Date.now() / 1000);
        const beaconUrl = `https://beacon.nist.gov/beacon/2.0/pulse/time/${unixTimestamp}`;
        const response = await fetch(beaconUrl);

        if (!response.ok) {
          throw new Error(`Error fetching data: ${response.statusText}`);
        }

        const data = await response.json();
        eachSegmentData.beaconUniqueId = data.pulse.outputValue;
        eachSegmentData.beaconTimeStamp = data.pulse.timeStamp;
        eachSegmentData.beaconVersion = data.pulse.version;
        eachSegmentData.unixTimestamp = unixTimestamp;
        eachSegmentData.localBeaconUniqueId = latestBeacon.current.uniqueValue;
        eachSegmentData.localBeaconTimestamp = latestBeacon.current.timestamp;
      } catch (error) {
        console.error("Error fetching data from NIST Beacon:", error);
      }
    };

    const videoFileInput = videoFileInputRef.current;
    videoFileInput.addEventListener("change", handleVideoFileChange);

    return () => {
      videoFileInput.removeEventListener("change", handleVideoFileChange);
    };
  }, [finalArrOp]);

  async function processVideo() {
    if (!fileRef.current || !finalArrOp.length || !ready) {
      toast("Please play the video fully before processing");
      return;
    }
    console.log(finalArrOp);
    try {
      // Generate QR code and save it as an image file

      const watermarks = [];
      for (let index = 0; index < finalArrOp.length; index++) {
        const eachMetadata = finalArrOp[index];
        var canvas = document.getElementById("canvas");
        await QRCode.toCanvas(canvas, JSON.stringify(eachMetadata));
        const imgBase64Url = canvas.toDataURL("image/png");
        const watermarkBlob = base64StringToBlob(
          imgBase64Url.split(",")[1],
          "image/png"
        );
        // Load the file into the virtual file system
        const inputFileUrl = URL.createObjectURL(fileRef.current);
        ffmpeg.FS("writeFile", "input.mp4", await fetchFile(inputFileUrl));
        const watermarkFile = new File(
          [watermarkBlob],
          "temp_" + index + "_watermark.png",
          {
            type: "image/png",
          }
        );
        ffmpeg.FS(
          "writeFile",
          "temp_" + index + "_watermark.png",
          await fetchFile(watermarkFile)
        );

        try {
          // Generate QR code and save it as an image file

          watermarks.push({
            name: "temp_" + index + "_watermark.png",
            scale: "100:100",
            startTime: index * 5,
            endTime: index * 5 + 5,
          }); // Add the outputPath to the array after the QR code is generated
        } catch (err) {
          console.log(err);
        }
      }

      console.log(watermarks); // This will be an array of all the file paths generated

      // Construct FFmpeg filter complex string
      let filterComplex = "";
      let inputFiles = ["-i", "input.mp4"]; // Start with the video input
      let currentVideoStream = "[0:v]";

      watermarks.forEach((watermark, index) => {
        inputFiles.push("-i", watermark.name); // Add each watermark as an input
        filterComplex += `${currentVideoStream}[${
          index + 1
        }:v] overlay=W-w-10:H-h-10:enable='between(t,${watermark.startTime},${
          watermark.endTime
        })'[v${index + 1}];`;
        currentVideoStream = `[v${index + 1}]`; // Update the current video stream for the next overlay
      });

      // Remove the trailing semicolon from filterComplex and remove the last [vN]
      filterComplex = filterComplex.slice(0, -1);

      console.log(inputFiles);
      console.log(filterComplex);
      console.log(currentVideoStream);

      ffmpeg.setProgress(({ ratio }) => {
        console.log(`Percentage: ${Math.round(ratio * 100)}%`);
        setProgress(`Percentage: ${Math.round(ratio * 100)}%`);
      });

      // Run FFmpeg
      await ffmpeg.run(
        ...inputFiles,
        "-filter_complex",
        filterComplex,
        "-map",
        currentVideoStream,
        "-c:v",
        "libx264",
        "-crf",
        "30", // Increase CRF value to reduce quality and speed up processing
        "-preset",
        "ultrafast",
        "-c:a",
        "copy",
        "output.mp4"
      );

      // Read the output from the virtual file system
      const data = ffmpeg.FS("readFile", "output.mp4");

      // Convert the output to a Blob and create an object URL to display
      const outputBlob = new Blob([data.buffer], { type: "video/mp4" });
      const outputUrl = URL.createObjectURL(outputBlob);
      setVideoOutputSrc(outputUrl);
      setProgress("");
    } catch (err) {
      console.log(err);
    }
  }

  async function callEmbedApi() {
    if (!fileRef.current || !finalArrOp.length) {
      toast("Please play the video fully");
      return;
    }
    console.log(finalArrOp);
    const formData = new FormData();
    formData.append("video", fileRef.current);
    formData.append("metaData", JSON.stringify(finalArrOp));

    const response = await fetch("/api/embed", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      toast("Failed to process the video");
    }

    const result = await response.json();
    toast(result.message);
  }

  return (
    <div>
      <Toaster />
      <button className="btn btn-dark" onClick={processVideo}>
        {progress || "Process QR codes"}
      </button>
      <input type="file" ref={videoFileInputRef} accept="video/*" />
      <video controls height="200" width="300" ref={videoElementRef}></video>
      <video src={videoOutputSrc} controls height="200" width="300"></video>

      {latestBeaconUi && (
        <div>{`Time: ${latestBeaconUi.timestamp} Beacon: ${latestBeaconUi.uniqueValue}`}</div>
      )}
      <canvas hidden id="canvas"></canvas>
      <div>{JSON.stringify(finalArrOp)}</div>
    </div>
  );
};

export default VideoFrameExtractor;
