"use client"; // Mark this as a Client Component

import React, { useState } from "react";
import CircularProgress from "@mui/material/CircularProgress";
import toast, { Toaster } from "react-hot-toast";
import { Button } from "react-bootstrap";
import { storage } from "../config";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { Box, Card, Modal } from "@mui/material";
const index = 0;
export default function Home() {
  const [files, setFiles] = useState([null, null]); // State to hold two video files
  const [previews, setPreviews] = useState([]); // State to hold video previews
  const [keyValuePairs, setKeyValuePairs] = useState([]); // State to hold key-value pairs
  const [loadingSubmit, setLoadingSubmit] = useState(false); // State to hold
  const [loadingVerify, setLoadingVerify] = useState(false); // State to hold
  const [foundRecords, setFoundRecords] = useState([]);
  const [exactFoundRecord, setExactFoundRecord] = useState(null);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [originalURL, setOriginalURL] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
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
      uploadToFirebase(input.files[0]);
      getVideoURLWithParameters(input.files[0]);
    } else {
      removeUpload(index);
    }
  }

  async function getVideoURLWithParameters(file) {
    const formData = new FormData();
    formData.append("video", file);
    formData.append("outputFileName", "processed_video.mp4");

    try {
      const response = await fetch("/api/processVideo", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to process the video");
      }

      const result = await response.json();
      if (result.success) {
        console.log("file", result);
        // setSuccessMessage(`Video processed successfully: ${result.file}`);
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      // setError(`Processing failed: ${err.message}`);
      console.log(err, "error");
    } finally {
      // setIsLoading(false);
    }
  }
  function uploadToFirebase(file) {
    console.log(file, "file");
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
          setOriginalURL(downloadURL);
        });
      }
    );
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

  function renderExactRecord() {
    return exactFoundRecord ? (
      <>
        <Button
          onClick={() => {
            setExactFoundRecord(null);
          }}
          variant="outline-primary"
        >
          Reset
        </Button>

        <h6 className="mt-5 mb-2">Exact Record Found : </h6>
        <table className="table table-hover">
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Attribute</th>
              <th scope="col">Value</th>
            </tr>
          </thead>
          <tbody>
            {exactFoundRecord.metaData.map((keyVal, index) => (
              <tr key={index}>
                <th scope="row">{index + 1}</th>
                <td>{keyVal.key}</td>
                {keyVal.key === "Download" ? (
                  <td>
                    <a href={keyVal.value} target="_blank">
                      Click here
                    </a>
                  </td>
                ) : (
                  <td>{keyVal.value}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </>
    ) : null;
  }

  function renderSimilarRecords() {
    return foundRecords.length > 0 ? (
      <>
        <Button
          onClick={() => {
            setFoundRecords([]);
          }}
          variant="outline-primary"
        >
          Reset
        </Button>

        <h6 className="mt-5 mb-2">Similar Records Found : </h6>
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
                  {keyVal.key === "Download" ? (
                    <td>
                      <a href={keyVal.value} target="_blank">
                        Click here
                      </a>
                    </td>
                  ) : (
                    <td>{keyVal.value}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        ))}
      </>
    ) : null;
  }
  async function uploadFileURL() {
    console.log(files[0], "Uploading file", originalURL);
    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: JSON.stringify({
          url: originalURL,
          metaData: [
            ...keyValuePairs,
            { key: "FileName", value: files[0].name },
          ],
        }),
      });
      console.log(response, "response");
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
  }
  async function verifyVideo() {
    
    try {
      const response = await fetch("/api/verify", {
        method: "POST",
        body: JSON.stringify({
          url: originalURL,
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
  }
  return (
    <>
      <Modal
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
        }}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <div
          style={{
            backgroundColor: "white",
            width: "30%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <h2>Add parameters</h2>
          <div className="scroll">
            {keyValuePairs.map((pair, idx) => (
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
          </div>
          <div className="add-button-section">
            {keyValuePairs.length > 0 ? (
              <button onClick={uploadFileURL} className="submit-button">
                Upload File
              </button>
            ) : null}
            <button
              type="button"
              onClick={addKeyValuePair}
              className="add-button"
            >
              Add +
            </button>
          </div>
        </div>
      </Modal>
      <div style={{ padding: "10px", margin: "10px" }}>
        <Toaster />
        <button
          className="file-upload-btn"
          type="button"
          onClick={() =>
            document.querySelectorAll(".file-upload-input")[index].click()
          }
        >
          {progressPercentage == 0 || progressPercentage == 100
            ? "Choose from media library"
            : "uploading..."}
        </button>

        <input
          hidden
          className="file-upload-input"
          type="file"
          onChange={(e) => readURL(e.target, 0)}
          accept="video/*"
        />

        {originalURL && (
          <Card style={{ padding: "10px", width: "80%", marginTop: "15px" }}>
            <div>
              <video width="220" height="210" controls>
                <source src={originalURL} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              <div className="add-button-section">
                <button
                  className="submit-button"
                  onClick={() => setModalOpen(true)}
                >
                  upload
                </button>
                <button onClick={verifyVideo} className="add-button">Verify</button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </>
  );
}
