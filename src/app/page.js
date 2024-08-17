"use client"; // Mark this as a Client Component

import { Spinner } from "react-bootstrap";
import React, { useState } from "react";
import CircularProgress from "@mui/material/CircularProgress";

export default function Home() {
  const [files, setFiles] = useState([null, null]); // State to hold two video files
  const [previews, setPreviews] = useState([]); // State to hold video previews
  const [keyValuePairs, setKeyValuePairs] = useState([]); // State to hold key-value pairs
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
    event.preventDefault();
    setLoadingSubmit(true);
    if (files[0]) {
      const formData = new FormData();
      formData.append("videoFile", files[0]);
      formData.append("videoMetaDataJSON",keyValuePairs);
      console.log(formData);
    } else {
      alert("Please upload  video files before submitting.");
    }
    setLoadingSubmit(false);
  }

  function verifySubmit(event) {
    event.preventDefault();
    setLoadingVerify(true);
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
          <div className="heading">{index == 0 ? "Upload" : "Verify"}</div>

          <div className="scroll">
            <button
              className="file-upload-btn"
              type="button"
              onClick={() =>
                document.querySelectorAll(".file-upload-input")[index].click()
              }
            >
              Choose from media library
            </button>
            <div className="image-upload-wrap">
              <input
                hidden
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
            {index == 0 && (
              <span className="add-info-txt">
                Add more information about your video
              </span>
            )}
            {index == 0 &&
              keyValuePairs.map((pair, idx) => (
                <div key={idx} className="keyValuePairs">
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
                    placeholder="Attribute Name"
                    value={pair.key || ""}
                    onChange={(e) =>
                      handleKeyValueChange(idx, "key", e.target.value)
                    }
                    // style={{ marginRight: "10px" }}
                  />
                  <input
                    className="input-keyPair"
                    type="text"
                    placeholder="Attribute Value"
                    value={pair.value || ""}
                    onChange={(e) =>
                      handleKeyValueChange(idx, "value", e.target.value)
                    }
                  />
                </div>
              ))}
            {index == 0 ? (
              <div className="add-button-section">
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
                {loadingSubmit ? (
                  <CircularProgress />
                ) : (
                  <button
                    className="submit-button"
                    type="submit"
                    onClick={handleSubmit}
                  >
                    Upload
                  </button>
                )}
              </div>
            ) : (
              <div className="submit-button-section">
                {loadingVerify ? (
                  <CircularProgress />
                ) : (
                  <button
                    className="submit-button"
                    type="submit"
                    onClick={verifySubmit}
                  >
                    Verify
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
