"use client";
import { useEffect, useRef, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import uuid from "uuid-random";

const VideoFrameExtractor = () => {
  const videoFileInputRef = useRef(null);
  const videoElementRef = useRef(null);
  const [finalArrOp, setFinalArrOp] = useState([]);
  const [latestBeaconUi, setLatestBeaconUi] = useState(null);
  let latestBeacon = useRef(null);
  let fileRef = useRef(null);

  useEffect(() => {
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
      <button className="btn btn-dark" onClick={callEmbedApi}>
        Process QR codes
      </button>
      <input type="file" ref={videoFileInputRef} accept="video/*" />
      <video controls height="200" width="300" ref={videoElementRef}></video>

      {latestBeaconUi && (
        <div>{`Time: ${latestBeaconUi.timestamp} Beacon: ${latestBeaconUi.uniqueValue}`}</div>
      )}

      <div>{JSON.stringify(finalArrOp)}</div>
    </div>
  );
};

export default VideoFrameExtractor;
