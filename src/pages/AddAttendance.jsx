import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { formatDisplayDate } from '../utils/dateUtils';
import BASE_URL from '../config';

export default function AddAttendance() {
    const [attendanceData, setAttendanceData] = useState([]);
    const [attendanceState, setAttendanceState] = useState(null);
    const [loggedInUser, setLoggedInUser] = useState(null);
    const [userName, setUserName] = useState('');
    const [attendance, setAttendance] = useState([]);
    const [showButtons, setShowButtons] = useState(false);
    const navigate = useNavigate();
    const institute_uuid = localStorage.getItem("institute_uuid");

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user?.name) {
            setLoggedInUser(user.name);
            setUserName(user.name);
        }
    }, []);

    useEffect(() => {
        if (loggedInUser) {
            fetchAttendanceData(loggedInUser);
        }
    }, [loggedInUser]);

    useEffect(() => {
        if (userName) {
            initAttendanceState(userName);
        }
    }, [userName]);

    const initAttendanceState = async (userName) => {
        if (!userName) return;

        try {
            const response = await axios.get(`${BASE_URL}/api/attendance/getTodayAttendance/${userName}`);
            const data = response.data;

            if (!data.success || !Array.isArray(data.flow)) {
                setAttendanceState("In");
                return;
            }

            const flow = data.flow;
            const sequence = ["In", "Break", "Start", "Out"];
            const nextStep = sequence.find(step => !flow.includes(step));

            if (flow.includes("Out")) {
                setAttendanceState(null);
            } else {
                setAttendanceState(nextStep || null);
            }
        } catch (error) {
            console.error("Failed to fetch attendance state:", error);
            setAttendanceState("In");
        } finally {
            setShowButtons(true);
        }
    };

    const saveAttendance = async (type) => {
        if (!userName || !type) return;

        try {
            const formattedTime = new Date().toLocaleTimeString();

            const response = await axios.post(`${BASE_URL}/api/attendance/addAttendance/${institute_uuid}`, {
                User_name: userName,
                Type: type,
                Status: "Present",
                Time: formattedTime
            });

            if (response.data.success) {
                alert(`Attendance saved successfully for ${type}`);
                
                await initAttendanceState(userName);
                await fetchAttendanceData(userName); 
            } else {
                alert("Failed to save attendance.");
            }
        } catch (error) {
            console.error("Error saving attendance:", error);
        }
    };

    const fetchUserNames = async () => {
        try {
            const response = await axios.get('/user/GetUserList');
            const data = response.data;
            if (data.success) {
                const userLookup = {};
                data.result.forEach(user => {
                    userLookup[user.User_uuid] = (user.User_name || '').trim();
                });
                return userLookup;
            } else {
                console.error('Failed to fetch user names:', data);
                return {};
            }
        } catch (error) {
            console.error('Error fetching user names:', error);
            return {};
        }
    };

    const fetchAttendanceData = async (loggedInUser) => {
        try {
            const userLookup = await fetchUserNames();
            const attendanceResponse = await axios.get(`${BASE_URL}/api/attendance/GetAttendanceList`);
            const attendanceRecords = attendanceResponse.data.result || [];

            const formattedData = processAttendanceData(attendanceRecords, userLookup);

            setAttendance(formattedData);
        } catch (error) {
            console.error("Error fetching attendance:", error);
        }
    };

    const processAttendanceData = (data, userLookup) => {
        const groupedData = new Map();
        const todayDate = new Date().toISOString().split("T")[0];

        data.forEach(({ Date: recordDate, User, Employee_uuid }) => {
            if (!User || !Array.isArray(User)) return;
            const employeeUuid = (Employee_uuid || "").trim();
            const userName = userLookup[employeeUuid] || 'Unknown';
            const dateKey = new Date().toISOString().split("T")[0];
            const userDateKey = `${userName}-${dateKey}`;

            if (!groupedData.has(userDateKey)) {
                groupedData.set(userDateKey, {
                    Date: dateKey,
                    User_name: userName,
                    In: "N/A",
                    Break: "N/A",
                    Start: "N/A",
                    Out: "N/A",
                    TotalHours: "N/A"
                });
            }

            const record = groupedData.get(userDateKey);
            User.forEach(userEntry => {
                const time = (userEntry.Time || '').trim();
                switch (userEntry.Type) {
                    case "In": record.In = time; break;
                    case "Break": record.Break = time; break;
                    case "Start": record.Start = time; break;
                    case "Out": record.Out = time; break;
                }
            });
        });

        return Array.from(groupedData.values()).map((record) => {
            record.TotalHours = calculateWorkingHours(record.In, record.Out, record.Break, record.Start);
            return record;
        });
    };

    const calculateWorkingHours = (inTime, outTime, breakTime, startTime) => {
        if (!inTime || !outTime) return "N/A";
        const parseTime = (timeStr) => {
            if (!timeStr || timeStr === "N/A") return null;
            const [time, period] = timeStr.split(" ");
            const [hours, minutes] = time.split(":").map(Number);
            let hours24 = hours;
            if (period === "PM" && hours !== 12) hours24 += 12;
            if (period === "AM" && hours === 12) hours24 = 0;
            const now = new Date();
            now.setHours(hours24, minutes, 0, 0);
            return now;
        };
        const inDate = parseTime(inTime);
        const outDate = parseTime(outTime);
        const breakDate = parseTime(breakTime) || 0;
        const startDate = parseTime(startTime) || 0;
        if (!inDate || !outDate) return "N/A";
        let workDuration = (outDate - inDate) / 1000;
        if (breakDate && startDate) {
            const breakDuration = (startDate - breakDate) / 1000;
            workDuration -= breakDuration;
        }
        const hours = Math.floor(workDuration / 3600);
        const minutes = Math.floor((workDuration % 3600) / 60);
        const seconds = workDuration % 60;
        return `${hours}h ${minutes}m ${seconds}s`;
    };

    return (
        <div className="bg-[#e5ddd5] pt-5 max-w-8xl mx-auto px-2">
            <div className="shadow-lg overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 p-2">
                    <div className="bg-white overflow-x-auto max-h-[70vh] w-full md:w-3/4">
                        <table className="min-w-full text-sm text-center border">
                            <thead className="bg-gray-100 sticky top-0">
                                <tr>
                                    <th className="px-4 py-2 border">In</th>
                                    <th className="px-4 py-2 border hidden md:table-cell">Lunch</th>
                                    <th className="px-4 py-2 border hidden md:table-cell">Start</th>
                                    <th className="px-4 py-2 border">Out</th>
                                </tr>
                            </thead>
                            <tbody>
                                {attendance.length === 0 ? (
                                    <tr>
                                        <td className="px-4 py-2 border" colSpan="4">No attendance records found.</td>
                                    </tr>
                                ) : (
                                    attendance.map((record, index) => (
                                        <tr key={index} className="hover:bg-gray-50 border-t">
                                            <td className="px-4 py-2 border truncate">{record.In}</td>
                                            <td className="px-4 py-2 border truncate hidden md:table-cell">{record.Break}</td>
                                            <td className="px-4 py-2 border truncate hidden md:table-cell">{record.Start}</td>
                                            <td className="px-4 py-2 border truncate">{record.Out}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>

                    </div>

                    {showButtons && attendanceState && (
                        <div className="w-full md:w-1/4">
                            <button
                                onClick={async () => {
                                    setShowButtons(false);
                                    await saveAttendance(attendanceState);
                                    setShowButtons(true);
                                }}
                                disabled={!showButtons}
                                className={`w-full text-white font-semibold py-3 rounded-md transition-all ${
                                    showButtons
                                        ? "bg-green-500 hover:bg-green-600 cursor-pointer"
                                        : "bg-gray-400 cursor-not-allowed"
                                }`}
                            >
                                {showButtons
                                    ? `${userName}   ${attendanceState}   -   ${formatDisplayDate(new Date())}`
                                    : "Saving..."}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
