import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Grid,
  Skeleton,
  Typography,
} from "@mui/material";
import AllAttendance from "../reports/allAttendance";

const API_URL = "https://socialbackend-iucy.onrender.com/api/dashboard-stats";

const Dashboard = () => {
  const navigate = useNavigate();

  // Safe JSON parse for institute
  let instituteObj = {};
  try {
    instituteObj = JSON.parse(localStorage.getItem("institute")) || {};
  } catch {
    // ignore JSON parse errors
  }
  const instituteName =
    instituteObj.institute_name ||
    localStorage.getItem("institute_title") ||
    "Your Institute";

  const expiryDateStr =
    localStorage.getItem("expiry_date") || localStorage.getItem("trialExpiresAt");
  const planType = localStorage.getItem("plan_type");

  // Dashboard stats state
  const [stats, setStats] = useState({
    students: null,
    admissions: null,
    courses: null,
    enquiries: null,
    feesToday: null,
    followupToday: null,
    attendance: [],
  });
  const [loading, setLoading] = useState(true);
  const [expired, setExpired] = useState(false);
  const [daysLeft, setDaysLeft] = useState(null);

  useEffect(() => {
    if (expiryDateStr) {
      const diff = Math.ceil((new Date(expiryDateStr) - new Date()) / (1000 * 60 * 60 * 24));
      setDaysLeft(diff);
      if (diff < 0) setExpired(true);
    }
  }, [expiryDateStr]);

  useEffect(() => {
    const institute_uuid = localStorage.getItem("institute_uuid");
    const fetchUrl = `${API_URL}?institute_uuid=${institute_uuid}`;

    fetch(fetchUrl)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        setStats({
          students: data.students ?? 0,
          admissions: data.admissions ?? 0,
          courses: data.courses ?? 0,
          enquiries: data.enquiries ?? 0,
          feesToday: data.feesToday ?? 0,
          followupToday: data.followupToday ?? 0,
          attendance: Array.isArray(data.attendance) ? data.attendance : [],
        });
      })
      .catch(() => {
        setStats({
          students: 0,
          admissions: 0,
          courses: 0,
          enquiries: 0,
          feesToday: 0,
          followupToday: 0,
          attendance: [],
        });
      })
      .finally(() => setLoading(false));
  }, []);

  if (expired) {
    return (
      <Box
        minHeight="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
        bgcolor="grey.100"
        px={2}
      >
        <Card elevation={3} sx={{ maxWidth: 420 }}>
          <CardContent sx={{ textAlign: "center" }}>
            <Typography variant="h5" color="error" fontWeight={700} gutterBottom>
              Trial Expired
            </Typography>
            <Typography color="text.secondary" mb={3}>
              Your trial has ended. Please contact support to upgrade your plan.
            </Typography>
            <Button
              variant="contained"
              color="error"
              onClick={() => navigate("/login")}
            >
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  const skeleton = <Skeleton variant="text" width={60} height={32} />;

  const display = (val, isMoney = false) =>
    loading ? skeleton : isMoney ? `₹${(val || 0).toLocaleString()}` : val || 0;

  const StatCard = ({ label, value, color, onClick }) => (
    <Grid item xs={12} sm={6} md={4} lg={2}>
      <CardActionArea onClick={onClick} sx={{ height: "100%" }}>
        <Card elevation={3} sx={{ height: "100%" }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary" mb={1}>
              {label}
            </Typography>
            <Typography variant="h4" fontWeight={700} color={color}>
              {display(value)}
            </Typography>
          </CardContent>
        </Card>
      </CardActionArea>
    </Grid>
  );

  return (
    <Box minHeight="100vh" display="flex" bgcolor="grey.50">
      <Box flex={1} display="flex" flexDirection="column">
        {planType === "trial" && daysLeft !== null && daysLeft >= 0 && (
          <Alert severity="warning" sx={{ borderRadius: 0, mb: 1 }}>
            Trial expires in {daysLeft} day{daysLeft !== 1 && "s"}!
          </Alert>
        )}

        <Box px={{ xs: 2, md: 3 }} py={2}>
          <Typography variant="h5" fontWeight={700} mb={2}>
            Welcome, {instituteName}
          </Typography>
          <AllAttendance />
        </Box>

        <Box component="main" flex={1} p={{ xs: 2, md: 3 }}>
          <Grid container spacing={2} mb={4}>
            <StatCard
              label="Total Students"
              value={stats.students}
              color="success.main"
              onClick={() => navigate("/dashboard/Students")}
            />
            <StatCard
              label="Total Admissions"
              value={stats.admissions}
              color="primary.main"
              onClick={() => navigate("/dashboard/allLeadByAdmission")}
            />
            <StatCard
              label="Active Courses"
              value={stats.courses}
              color="secondary.main"
              onClick={() => navigate("/dashboard/Courses")}
            />
            <StatCard
              label="No. of Enquiries"
              value={stats.enquiries}
              color="warning.main"
              onClick={() => navigate("/dashboard/leads")}
            />
          </Grid>

          <Grid container spacing={2} mb={3}>
            <Grid item xs={12} md={6}>
              <Card elevation={3} sx={{ height: "100%" }}>
                <CardContent sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    Today's Collection
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="success.main" mb={3}>
                    {display(stats.feesToday, true)}
                  </Typography>
                  <Box mt="auto">
                    <Button
                      variant="contained"
                      color="success"
                      onClick={() => navigate("/dashboard/fees")}
                    >
                      View Details
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card elevation={3} sx={{ height: "100%" }}>
                <CardContent sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    Today's Follow-up
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="primary.main" mb={3}>
                    {display(stats.followupToday)}
                  </Typography>
                  <Box mt="auto">
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => navigate("/dashboard/followup")}
                    >
                      View List
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;
