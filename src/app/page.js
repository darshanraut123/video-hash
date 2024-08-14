"use client"; // Mark this as a Client Component

import React, { useState } from "react";

export default function Home() {
  const [files, setFiles] = useState([null, null]); // State to hold two video files
  const [previews, setPreviews] = useState([null, null]); // State to hold video previews

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

    console.log(files, "file");
    if (files[0] && files[1]) {
      const formData1 = new FormData();
      const formData2 = new FormData();
      formData1.append("file1", files[0]);
      formData2.append("file2", files[1]);
      let array = [
        { id: 1, formData: formData1 },
        { id: 2, formData: formData2 },
      ];

      console.log(array, "file");
      // for (let [key, value] of formData.entries()) {
      //   console.log(`${key}:`, value);
      // }
    } else {
      alert("Please upload two video files before submitting.");
    }
  }

  return (
    <div className="file-upload">
      {[0, 1].map((index) => (
        <div key={index} className="upload-section">
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
        </div>
      ))}
      <div className="submit-button-section">
        <button className="submit-button" type="submit" onClick={handleSubmit}>
          Submit
        </button>
      </div>
    </div>
  );
}
