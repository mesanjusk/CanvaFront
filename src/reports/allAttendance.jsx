import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Card,
  CardContent,
  Divider,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import BASE_URL from "../config";

export default function AllAttendance() {
  const [attendance, setAttendance] = useState([]);
  const institute_uuid = localStorage.getItem("institute_uuid");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/auth/GetUserList/${institute_uuid}`);
      if (response.data.success) {
        const map = {};
        response.data.result.forEach(user => {
          map[user.user_uuid] = `${user.name}`.trim();
        });
        fetchAttendanceData(map);
      }
    } catch (err) {
      console.error("Error fetching users", err);
    }
  };

  const fetchAttendanceData = async (map) => {
    try {
      const res = await axios.get(`${BASE_URL}/api/attendance/GetAttendanceList`);
      const records = res.data.result || [];

      const todayDate = new Date().toISOString().split("T")[0];

      const groupedData = new Map();

      records.forEach(({ Date: recordDate, User, User_uuid }) => {
        if (!recordDate) return;
        const dateKey = new Date(recordDate).toISOString().split("T")[0];
        if (dateKey !== todayDate) return;

        const userName = map[User_uuid] || 'Unknown';
        const key = `${userName}-${dateKey}`;

        if (!groupedData.has(key)) {
          groupedData.set(key, {
            User_name: userName,
            Date: dateKey,
            In: "N/A",
            Break: "N/A",
            Start: "N/A",
            Out: "N/A",
            TotalHours: "N/A"
          });
        }

        const entry = groupedData.get(key);

        User.forEach((log) => {
          switch (log.Type) {
            case "In": entry.In = log.Time || "N/A"; break;
            case "Break": entry.Break = log.Time || "N/A"; break;
            case "Start": entry.Start = log.Time || "N/A"; break;
            case "Out": entry.Out = log.Time || "N/A"; break;
            default: break;
          }
        });
      });

      const finalList = Array.from(groupedData.values()).map(entry => {
        entry.TotalHours = calculateWorkingHours(entry.In, entry.Out, entry.Break, entry.Start);
        return entry;
      });

      setAttendance(finalList);
    } catch (err) {
      console.error("Error fetching attendance", err);
    }
  };

  const calculateWorkingHours = (inTime, outTime, breakTime, startTime) => {
    if (!inTime || !outTime || inTime === "N/A" || outTime === "N/A") return "N/A";

    const parseTime = (timeStr) => {
      const [time, period] = timeStr.split(" ");
      const [h, m] = time.split(":").map(Number);
      let hour = h;
      if (period === "PM" && h !== 12) hour += 12;
      if (period === "AM" && h === 12) hour = 0;
      const d = new Date();
      d.setHours(hour, m, 0, 0);
      return d;
    };

    const inDate = parseTime(inTime);
    const outDate = parseTime(outTime);
    const breakDate = breakTime !== "N/A" ? parseTime(breakTime) : null;
    const startDate = startTime !== "N/A" ? parseTime(startTime) : null;

    let duration = (outDate - inDate) / 1000;
    if (breakDate && startDate) duration -= (startDate - breakDate) / 1000;

    const hrs = Math.floor(duration / 3600);
    const mins = Math.floor((duration % 3600) / 60);
    const secs = Math.floor(duration % 60);
    return `${hrs}h ${mins}m ${secs}s`;
  };

  return (
    <Card elevation={2} sx={{ borderRadius: 3 }}>
      <CardContent>
        <Stack spacing={3} alignItems="stretch">
          <TableContainer component={Paper} sx={{ display: { xs: "none", md: "block" } }}>
            <Table size="small" aria-label="Attendance table">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>In</TableCell>
                  <TableCell>Break</TableCell>
                  <TableCell>Start</TableCell>
                  <TableCell>Out</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {attendance.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No attendance records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  attendance.map((record, idx) => (
                    <TableRow key={idx} hover>
                      <TableCell>{record.User_name}</TableCell>
                      <TableCell>{record.In}</TableCell>
                      <TableCell>{record.Break}</TableCell>
                      <TableCell>{record.Start}</TableCell>
                      <TableCell>{record.Out}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Stack spacing={2} sx={{ display: { xs: "flex", md: "none" } }}>
            {attendance.length === 0 ? (
              <Typography align="center" color="text.secondary">
                No attendance records found.
              </Typography>
            ) : (
              attendance.map((record, idx) => (
                <Paper key={idx} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    {record.User_name}
                  </Typography>
                  <Divider sx={{ mb: 1 }} />
                  <Stack spacing={0.75}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography color="text.secondary">In:</Typography>
                      <Typography>{record.In}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography color="text.secondary">Break:</Typography>
                      <Typography>{record.Break}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography color="text.secondary">Start:</Typography>
                      <Typography>{record.Start}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography color="text.secondary">Out:</Typography>
                      <Typography>{record.Out}</Typography>
                    </Box>
                  </Stack>
                </Paper>
              ))
            )}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
