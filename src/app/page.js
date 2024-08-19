"use client"; // Mark this as a Client Component

import Table from "react-bootstrap/Table";
import React, { useState } from "react";
import CircularProgress from "@mui/material/CircularProgress";
import toast, { Toaster } from "react-hot-toast";
import { Button } from "react-bootstrap";
import { storage } from "../config";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";

export default function Home() {
  const [files, setFiles] = useState([null, null]); // State to hold two video files
  const [previews, setPreviews] = useState([]); // State to hold video previews
  const [keyValuePairs, setKeyValuePairs] = useState([]); // State to hold key-value pairs
  const [loadingSubmit, setLoadingSubmit] = useState(false); // State to hold
  const [loadingVerify, setLoadingVerify] = useState(false); // State to hold
  const [foundRecords, setFoundRecords] = useState([]);
  const [exactFoundRecord, setExactFoundRecord] = useState(null);
  const [progressPercentage, setProgressPercentage] = useState(0);

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

  function uploadFileToFirebase() {
    const file = files[0];
    if (!file) {
      toast("Please upload a video file");
      setLoadingSubmit(false);
      return;
    }
    if (!keyValuePairs.length) {
      toast("Please add metadata before submitting");
      setLoadingSubmit(false);
      return;
    }
    if (!keyValuePairs[0].key || !keyValuePairs[0].value) {
      toast("Please complete the metadata");
      setLoadingSubmit(false);
      return;
    }
    if (!file) {
      toast("Please select a video file.");
      setLoadingSubmit(false);
      return;
    }

    const storageRef = ref(storage, "videos/" + file.name);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log(progress);
        setProgressPercentage(progress.toFixed(2));
      },
      (error) => {
        // Handle unsuccessful uploads
        console.error("Upload failed:", error);
        setLoadingSubmit(false);
        setProgressPercentage(0);
        toast("Upload failed");
      },
      () => {
        // Handle successful uploads on complete
        getDownloadURL(uploadTask.snapshot.ref).then(async (downloadURL) => {
          console.log("File available at", downloadURL);
          setProgressPercentage(0);
          toast("Processing video fingerprints");

          try {
            const response = await fetch("/api/upload", {
              method: "POST",
              body: JSON.stringify({
                url: downloadURL,
                metaData: [
                  ...keyValuePairs,
                  { key: "FileName", value: file.name },
                ],
              }),
            });

            if (!response.ok) {
              throw new Error(`Upload failed: ${response.statusText}`);
            }

            const data = await response.json();
            console.log("Upload successful:", data);
            toast("Video fingerprint generated & added to records");

            removeUpload(0);
            setKeyValuePairs([]);
          } catch (error) {
            console.error("Error during upload:", error);
          } finally {
            setLoadingSubmit(false);
          }
        });
      }
    );
  }

  async function verifyVideo() {
    setFoundRecords([]);
    setExactFoundRecord(null);

    const file = files[1];
    if (!file) {
      toast("Please upload a video file");
      setLoadingVerify(false);
      return;
    }

    const storageRef = ref(storage, "videos/" + file.name);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log(progress);
        setProgressPercentage(progress.toFixed(2));
      },
      (error) => {
        console.error("Upload failed:", error);
        setLoadingVerify(false);
        setProgressPercentage(0);
        toast("Upload failed");
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then(async (downloadURL) => {
          console.log("File available at", downloadURL);
          setProgressPercentage(0);
          toast("Searching for similar records.");

          try {
            const response = await fetch("/api/verify", {
              method: "POST",
              body: JSON.stringify({
                url: downloadURL,
              }),
            });

            if (!response.ok) {
              throw new Error(`Verification failed: ${response.statusText}`);
            }

            const result = await response.json();
            if (response.status === 200) {
              console.log("Fingerprint found:", result);
              toast(result.message);
              setFoundRecords(result.similarRecords);
              setExactFoundRecord(result.exactMatchRecord);
            } else if (response.status === 404) {
              toast("No matching records found.");
            }
          } catch (error) {
            console.error("Error during verification:", error);
            toast("Something went wrong");
          } finally {
            setLoadingVerify(false);
          }
        });
      }
    );
  }

  function handleSubmit(event) {
    setLoadingSubmit(true);
    event.preventDefault();
    uploadFileToFirebase();
  }

  function verifySubmit(event) {
    event.preventDefault();
    setLoadingVerify(true);
    verifyVideo();
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
        <Button
          onClick={() => {
            setFoundRecords([]);
            setExactFoundRecord(null);
          }}
          variant="outline-primary"
        >
          Reset
        </Button>

        {exactFoundRecord && (
          <>
            <h6 className="mt-2">Exact Record Found : </h6>
            <table className="table table-hover">
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">Attribute name</th>
                  <th scope="col">Attribute value</th>
                </tr>
              </thead>
              <tbody>
                {exactFoundRecord.metaData.map((keyVal, index) => (
                  <tr key={index}>
                    <th scope="row">{index + 1}</th>
                    <td>{keyVal.key}</td>
                    <td>{keyVal.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {foundRecords.length > 0 && (
          <h6 className="mt-2">Similar Records Found : </h6>
        )}
        {foundRecords.map((record, index) => (
          <table key={index} className="table table-hover mb-5">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Attribute name</th>
                <th scope="col">Attribute value</th>
              </tr>
            </thead>
            <tbody>
              {record.metaData.map((keyVal, index) => (
                <tr key={index}>
                  <th scope="row">{index + 1}</th>
                  <td>{keyVal.key}</td>
                  <td>{keyVal.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ))}
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
                  <div className="loader-container">
                    {progressPercentage == 0 ? null : (
                      <div>{progressPercentage} %</div>
                    )}
                    <CircularProgress />
                  </div>
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
                  <div className="loader-container">
                    {progressPercentage == 0 ? null : (
                      <div>{progressPercentage} %</div>
                    )}
                    <CircularProgress />
                  </div>
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
