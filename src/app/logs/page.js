"use client";
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Link,
  Box,
  IconButton,
  Tooltip,
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";

const VerifierTable = () => {
  const [data, setData] = React.useState([]);

  React.useEffect(() => {
    const data = [
      {
        _id: "676d63ba500a2b7019de49a7",
        verifierEmail: "darshan.raut@buzzybrains.com",
        verifierName: "Darshan Raut",
        message: "Found a match",
        uri: "file:///data/user/0/com.videohash/cache/rn_image_picker_lib_temp_a23bdce1-54f7-44a2-85c0-87b7e62662fd.mp4",
        videoId: "17346663928731",
        verifyVideoHashes: [
          "1010100101010110101011111010111101010111011111111010111101011111",
          "1000011101111111100011111111111101111111011111111111111101111111",
          "1110111101111111111011111011111101111111111111111111111101111111",
          "1001111101111111101111111011111101111111011111111111111101111111",
        ],
        originalVideoHashes: [
          "1010110101011010101011011010111101011111010111111010110110111111",
          "1000011101111111100111111100011101111111010111111111111111011111",
          "1110011100111111111001111011111101111111011111111011111111111111",
          "1001111101111111111111111011111101111111011111111111111111111111",
        ],
        averageDistance: 90.234375,
      },
    ];
    setData(data);
  }, []);

  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h4" gutterBottom>
        Verify Logs
      </Typography>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="verifier table">
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Message</TableCell>
              <TableCell>URI</TableCell>
              <TableCell>ID</TableCell>
              <TableCell>Verify Hashes</TableCell>
              <TableCell>Original Hashes</TableCell>
              <TableCell>Average Distance</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((item, index) => (
              <TableRow key={item._id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{item.createdAt}</TableCell>
                <TableCell>{item.verifierEmail}</TableCell>
                <TableCell>{item.verifierName}</TableCell>
                <TableCell>{item.message}</TableCell>
                <TableCell>
                  <Tooltip title={item.uri}>
                    <IconButton>
                      <InfoIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
                <TableCell>{item.videoId ? item.videoId : "NA"}</TableCell>
                <TableCell>
                  <Tooltip
                    title={
                      <div>
                        {item.verifyVideoHashes
                          ? item.verifyVideoHashes.map((hash, idx) => (
                              <Typography key={idx} variant="body2">
                                {hash},
                              </Typography>
                            ))
                          : "NA"}
                      </div>
                    }
                    arrow
                  >
                    <IconButton>
                      <InfoIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Tooltip
                    title={
                      <div>
                        {item.originalVideoHashes
                          ? item.originalVideoHashes.map((hash, idx) => (
                              <Typography key={idx} variant="body2">
                                {hash},
                              </Typography>
                            ))
                          : "NA"}
                      </div>
                    }
                    arrow
                  >
                    <IconButton>
                      <InfoIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  {item.averageDistance ? item.averageDistance.toFixed(2) : 0}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default VerifierTable;
