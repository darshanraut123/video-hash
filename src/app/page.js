"use client"; // Mark this as a Client Component

import { Spinner } from "react-bootstrap";
import React, { useState } from "react";
import CircularProgress from "@mui/material/CircularProgress";

export default function Home() {
  const [files, setFiles] = useState([null, null]); // State to hold two video files
  const [previews, setPreviews] = useState([null, null]); // State to hold video previews
  const [keyValuePairs, setKeyValuePairs] = useState([{}]); // State to hold key-value pairs
  const [loadingSubmit, setLoadingSubmit] = useState(false); // State to hold
  const [loadingVerify, setLoadingVerify] = useState(false); // State to hold
  function readURL(input, index) {
    if (input.files && input.files[0]) {
      const newFiles = [...files];
      newFiles[index] = input.files[0];
      setFiles(newFiles);

      const newPreviews = [...previews];
      newPreviews[index] = URL.createObjectURL(input.files[0]); // Create preview URL
      setPreviews(newPreviews);
    } else {
      removeUpload(index);
    }
  }

  function removeUpload(index) {
    const newFiles = [...files];
    newFiles[index] = null;
    setFiles(newFiles);

    const newPreviews = [...previews];
    newPreviews[index] = null;
    setPreviews(newPreviews);

    document.querySelectorAll(".file-upload-input")[index].value = "";
  }

  function handleSubmit(event) {
    setLoadingSubmit(true)
    event.preventDefault();

    console.log(files, "file");
    if (files[0]) {
      const formData = new FormData();
      formData.append("file", files[0]);

      console.log("file", keyValuePairs);
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
      }
    } else {
      alert("Please upload  video files before submitting.");
    }
  }
  function verifySubmit(event) {
    event.preventDefault();
    setLoadingVerify(true)
    console.log(files, "file");
    if (files[1]) {
      const formData = new FormData();
      formData.append("file", files[1]);

      console.log(formData, "file");
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
      }
    } else {
      alert("Please upload two video files before submitting.");
    }
  }
  function addKeyValuePair() {
    setKeyValuePairs([...keyValuePairs, {}]); // Add an empty object to the array
  }

  function handleKeyValueChange(index, key, value) {
    const newPairs = [...keyValuePairs];
    newPairs[index] = { ...newPairs[index], [key]: value };
    setKeyValuePairs(newPairs);
  }
  function removeKeyValuePair(index) {
    const newPairs = keyValuePairs.filter((_, idx) => idx !== index);
    setKeyValuePairs(newPairs);
  }
  return (
    <div className="file-upload">
      {[0, 1].map((index) => (
        <div key={index} className="upload-section">
          <div
          className="heading"
           
          >
            {index == 0 ? "Upload video" : "Verify Video"}
          </div>

          <div
            className="scroll"
          >
            <button
              className="file-upload-btn"
              type="button"
              onClick={() =>
                document.querySelectorAll(".file-upload-input")[index].click()
              }
            >
              Add video {index + 1}
            </button>
            <div className="image-upload-wrap">
              <input
                className="file-upload-input"
                type="file"
                onChange={(e) => readURL(e.target, index)}
                accept="video/*"
              />
              {previews[index] && (
                <div className="video-preview">
                  <video
                    src={previews[index]}
                    controls
                    width="150"
                    height="100"
                  ></video>
                  <button
                    type="button"
                    onClick={() => removeUpload(index)}
                    className="remove-video"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
            {/* Key-Value Pair Section */}
            {index == 0 &&
              keyValuePairs.map((pair, idx) => (
                <div
                  key={idx}
                  className="keyValuePairs"
                >
                  <button
                    type="button"
                    onClick={() => removeKeyValuePair(idx)}
                    className="remove-button"
                  >
                    Remove
                  </button>
                  <input
                   className="input-keyPair"
                    type="text"
                    placeholder="Key"
                    value={pair.key || ""}
                    onChange={(e) =>
                      handleKeyValueChange(idx, "key", e.target.value)
                    }
                    // style={{ marginRight: "10px" }}
                  />
                  <input
                   className="input-keyPair"
                    type="text"
                    placeholder="Value"
                    value={pair.value || ""}
                    onChange={(e) =>
                      handleKeyValueChange(idx, "value", e.target.value)
                    }
                  />
                </div>
              ))}
            {index == 0 ? (
              <div
               className="add-button-section"
              >
                <button
                  type="button"
                  onClick={addKeyValuePair}
                  className="add-button"
                >
                  Add +
                </button>
              </div>
            ) : null}{" "}
            {index == 0 ? (
              <div className="submit-button-section">
                <button
                  className="submit-button"
                  type="submit"
                  onClick={ handleSubmit }
                >
                Upload
                </button>
                {loadingSubmit ? <CircularProgress /> : null}
              </div>
            ) : (
              <div className="submit-button-section">
                <button
                  className="submit-button"
                  type="submit"
                  onClick={ verifySubmit}
                >
                Verify
                </button>
                {loadingVerify ? <CircularProgress /> : null}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
