"use client"; // Mark this as a Client Component

import { useState } from 'react';

const parameters =[
    '-vf', 'scale=640:360',                // Resize video
    '-c:v', 'libx264',                     // Set video codec
    '-b:v', '1000k',                       // Set video bitrate
    '-c:a', 'aac',                         // Set audio codec
    '-b:a', '128k',                        // Set audio bitrate
    '-preset', 'fast',                     // Set encoding speed
    '-vf', 'delogo=x=10:y=20:w=100:h=50',  // Remove watermark
]
export default function VideoUploader() {
    const [file, setFile] = useState(null);

    const handleUpload = async () => {
        const formData = new FormData();
        formData.append('video', file);
        formData.append('outputFileName', 'processed_video.mp4');

        try {
            const response = await fetch('/api/processVideo', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Failed to process the video');
            }

            const result = await response.json();
            if (result.success) {
               console.log('file', result)
                // setSuccessMessage(`Video processed successfully: ${result.file}`);
            } else {
                throw new Error(result.error);
            }
        } catch (err) {
            // setError(`Processing failed: ${err.message}`);
            console.log(err,"error");
        } finally {
            // setIsLoading(false);
        }
    };

    return (
        <div>
            <input type="file" onChange={(e) => setFile(e.target.files[0])} />
            <button onClick={handleUpload}>Upload and Process</button>
        </div>
    );
}
