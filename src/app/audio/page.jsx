"use client";
import React, { useState } from "react";
import { fft, fftInPlace } from "fft-js"; // Adjust based on your module structure

const AudioFingerprint = () => {
  const [hash, setHash] = useState("N/A");
  const [error, setError] = useState("");
  const [file, setFile] = useState(null);

  const processAudio = async () => {
    try {
      if (!file) {
        alert("Upload a file first");
        return;
      }
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      const channelData = audioBuffer.getChannelData(0); // Get left channel data (mono)

      // Apply FFT using the fft-js library
      const fftSize = 2048;
      const data = new Float32Array(fftSize);

      // Copy audio data into the data array
      data.set(channelData.slice(0, fftSize));

      // Perform the FFT
      const [real, imag] = fft(data);

      // Calculate the magnitude of the FFT result (frequency spectrum)
      const spectrum = real.map((re, i) =>
        Math.sqrt(re * re + imag[i] * imag[i])
      );

      // Generate a simple hash based on the spectrum
      const generatedHash = generateHash(spectrum);
      setHash(generatedHash);
    } catch (err) {
      setError("Error processing audio file");
      console.error(err);
    }
  };

  const generateHash = (spectrum) => {
    return spectrum
      .map((freq) => Math.round(freq * 100)) // Scale frequency values
      .slice(0, 16) // Take first 16 values for simplicity
      .map((val) => val.toString(2).padStart(8, "0")) // Convert to binary
      .join(""); // Join into a single binary string
  };

  return (
    <div className="container">
      <h1>Audio Fingerprinting</h1>
      <input
        type="file"
        id="audioFile"
        accept="audio/*"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <button onClick={processAudio} className="btn btn-success">
        Process Audio File
      </button>
      <h4>Hash: {hash}</h4>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default AudioFingerprint;
