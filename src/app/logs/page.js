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
    const fetchData = async () => {
      const response = await fetch("http://localhost:4000/api/verifylogs");
      const data = await response.json();
      setData(data.logs);
    };
    fetchData();
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
