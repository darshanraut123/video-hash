"use client";
import React, { useState } from "react";
// import { getFingerprint } from "../../../lib/audio";
const AudioFingerprint = () => {
  const [fingerprint, setFingerprint] = useState(null);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [chromaprint, setChromaprint] = useState(null);
  //   const [verificationResult, setVerificationResult] = useState(null);

  const readToEnd = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = (e) => reject(e);
      reader.readAsArrayBuffer(file);
    });

  const toPCM16 = (data) => {
    const pcm16 = new Int16Array(data.length);
    for (let i = 0; i < data.length; i++) {
      pcm16[i] = data[i] * 32767;
    }

    return pcm16;
  };

  const handleFileChange = async () => {
    // if (!file) return;
    // const sampleRate = 44100;
    // const time = 120;
    // const context = new OfflineAudioContext(1, sampleRate * time, sampleRate);
    // const rawBuffer = await readToEnd(file);
    // const audioBuffer = await context.decodeAudioData(rawBuffer);
    // const data = audioBuffer.getChannelData(0);
    // const duration = Math.round(data.length / sampleRate);
    // const pcm16 = toPCM16(data.slice(0, sampleRate * time));
    // const chromaprintContext = new ChromaprintContext();
    // chromaprintContext.feed(pcm16);
    // const fingerprint = chromaprintContext.finish();
    // console.log({ fingerprint, duration });
  };

  //   // Function to handle file input and generate fingerprint
  //   const handleFileChange = async (event) => {
  //     if (!file) return;

  //     const audioContext = new (window.AudioContext ||
  //       window.webkitAudioContext)();
  //     const reader = new FileReader();

  //     setLoading(true);
  //     reader.onload = async (event) => {
  //       const sampleRate = 44100;
  //       const time = 120;
  //       const arrayBuffer = event.target.result;
  //       const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  //       const pcmData = audioBuffer.getChannelData(0); // Get PCM data from one channel (mono)
  //       const pcm16 = toPCM16(pcmData.slice(0, sampleRate * time));
  //       try {
  //         const duration = Math.round(data.length / sampleRate);
  //         // Initialize Chromaprint using ChromaprintContext
  //         const chromaprintContext = new ChromaprintContext();
  //         chromaprintContext.feed(pcm16);
  //         const generatedFingerprint = chromaprintContext.finish();

  //         setFingerprint(generatedFingerprint);
  //         setLoading(false);

  //         // Call verification function (next step)
  //         // verifyFingerprint(generatedFingerprint);
  //       } catch (error) {
  //         console.error("Error generating fingerprint:", error);
  //         setLoading(false);
  //       }
  //     };

  //     reader.readAsArrayBuffer(file);
  //   };

  //   // Function to verify fingerprint with AcoustID
  //   const verifyFingerprint = async (fp) => {
  //     const apiKey = "YOUR_ACOUSTID_API_KEY"; // Replace with your AcoustID API Key

  //     const response = await fetch(
  //       `https://api.acoustid.org/v2/lookup?client=${apiKey}&meta=recordings&fingerprint=${fp}&duration=30`
  //     );
  //     const data = await response.json();

  //     // Set verification result
  //     setVerificationResult(data);
  //   };

  return (
    <div>
      <h1>Audio Fingerprint Generator</h1>
      {/* <input
        type="file"
        accept="audio/*"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <button onClick={handleFileChange} className="btn btn-danger">
        Create fingerprint for audio
      </button>
      {loading ? <p>Generating fingerprint...</p> : null}
      {fingerprint ? <p>Fingerprint: {fingerprint}</p> : null} */}
      {/* {verificationResult ? (
        <div>
          <h2>Verification Result:</h2>
          <pre>{JSON.stringify(verificationResult, null, 2)}</pre>
        </div>
      ) : null} */}
    </div>
  );
};

export default AudioFingerprint;
