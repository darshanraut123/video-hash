"use client"; // Mark this as a Client Component

import Table from "react-bootstrap/Table";
import React, { useState } from "react";
import CircularProgress from "@mui/material/CircularProgress";
import toast, { Toaster } from "react-hot-toast";
import { Button } from "react-bootstrap";

// export const metadata = {
//   title: "New Title",
// };

export default function Home() {
  const [files, setFiles] = useState([null, null]); // State to hold two video files
  const [previews, setPreviews] = useState([]); // State to hold video previews
  const [keyValuePairs, setKeyValuePairs] = useState([]); // State to hold key-value pairs
  const [loadingSubmit, setLoadingSubmit] = useState(false); // State to hold
  const [loadingVerify, setLoadingVerify] = useState(false); // State to hold
  const [foundRecords, setFoundRecords] = useState([]);

  const uploadVideoUrl = "http://localhost:8080/upload-video";
  const verifyVideoUrl = "http://localhost:8080/verify-similarity";

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
    console.log(keyValuePairs);
    if (!files[0]) {
      toast("Please upload a video file");
      setLoadingSubmit(false);
      return;
    }
    if (!keyValuePairs.length) {
      toast("Please add metadata before submitting");
      setLoadingSubmit(false);
      return;
    }
    if (!keyValuePairs[0].key || !keyValuePairs[0].values) {
      toast("Please complete the metadata");
      setLoadingSubmit(false);
      return;
    }
    const formData = new FormData();
    formData.append("videoFile", files[0]);
    formData.append("videoMetaDataJSON", keyValuePairs);
    console.log(formData);

    fetch(uploadVideoUrl, {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((response) => {
        console.log(response);
        toast("Video records uploaded");
      })
      .catch((e) => {
        console.log(e);
        toast("Unexpected error occured");
      });
  }

  function verifySubmit(event) {
    event.preventDefault();
    setLoadingVerify(true);
    console.log(files, "file");
    if (files[1]) {
      const formData = new FormData();
      formData.append("videoFile", files[1]);
      console.log(formData, "file");
      fetch(verifyVideoUrl, {
        method: "POST",
        body: formData,
      })
        .then((response) => response.json())
        .then((response) => {
          console.log(response);
          setFoundRecords(response.videoinfo.videoMetaDataList);
          toast(response.message);
        })
        .catch((e) => {
          console.log(e);
          toast("Unexpected error occured");
        });
    } else {
      toast("Please upload a video file.");
    }
    setLoadingVerify(false);
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

  function renderRecords() {
    return foundRecords.length > 0 ? (
      <>
        <Button onClick={() => setFoundRecords([])} variant="outline-primary">
          Reset
        </Button>
        <table className="table table-hover mt-2">
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Attribute name</th>
              <th scope="col">Attribute value</th>
            </tr>
          </thead>
          <tbody>
            {foundRecords.map((metaData, index) => (
              <tr key={index}>
                <th scope="row">{index + 1}</th>
                <td>{metaData.key}</td>
                <td>{metaData.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </>
    ) : null;
  }
  return (
    <div className="file-upload">
      <Toaster />
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
            {index == 1 && renderRecords()}
          </div>
        </div>
      ))}
    </div>
  );
}
