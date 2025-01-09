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
  CircularProgress,
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";

const VerifierTable = () => {
  const [logs, setLogs] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch("api/feedback");
        const data = await response.json();
        console.log(data);
        data.length && setLogs(data);
      } catch (e) {
        console.log(e);
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h4" gutterBottom>
        Feedback
      </Typography>
      {loading ? (
        <CircularProgress />
      ) : (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="verifier table">
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Message</TableCell>
                <TableCell>Created</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.map((item, index) => (
                <TableRow key={item._id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{item.email}</TableCell>
                  <TableCell>{item.message}</TableCell>
                  <TableCell>{item.createdAt}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default VerifierTable;
