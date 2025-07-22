import React, { useEffect, useState } from "react";
import axios from "axios";
import { format } from 'date-fns';
import BASE_URL from '../config';

export default function AllAttendance() {
  const [attendance, setAttendance] = useState([]);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [userMap, setUserMap] = useState({});
  const institute_uuid = localStorage.getItem("institute_uuid");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user?.name) setLoggedInUser(user.name);
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
        setUserMap(map);
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
    <div className="bg-white p-4 rounded-2xl shadow flex flex-col items-start">
      {/* Desktop Table */}
      <div className="overflow-x-auto w-full hidden md:block">
        <table className="min-w-full text-sm text-center border">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 border">Name</th>
              <th className="px-4 py-2 border">In</th>
              <th className="px-4 py-2 border">Break</th>
              <th className="px-4 py-2 border">Start</th>
              <th className="px-4 py-2 border">Out</th>
            </tr>
          </thead>
          <tbody>
            {attendance.length === 0 ? (
              <tr>
                <td className="px-4 py-2 border" colSpan="6">No attendance records found.</td>
              </tr>
            ) : (
              attendance.map((record, idx) => (
                <tr key={idx} className="hover:bg-gray-50 border-t">
                  <td className="px-4 py-2 border">{record.User_name}</td>
                  <td className="px-4 py-2 border truncate">{record.In}</td>
                  <td className="px-4 py-2 border truncate">{record.Break}</td>
                  <td className="px-4 py-2 border truncate">{record.Start}</td>
                  <td className="px-4 py-2 border truncate">{record.Out}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Mobile Card List */}
      <div className="w-full flex flex-col gap-3 md:hidden">
        {attendance.length === 0 ? (
          <div className="text-center text-gray-500 py-4">No attendance records found.</div>
        ) : (
          attendance.map((record, idx) => (
            <div key={idx} className="border rounded-xl shadow-sm px-3 py-3 flex flex-col gap-1 bg-gray-50">
              <div className="font-semibold text-base text-gray-700 mb-1">{record.User_name}</div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">In:</span>
                <span>{record.In}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Break:</span>
                <span>{record.Break}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Start:</span>
                <span>{record.Start}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Out:</span>
                <span>{record.Out}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
