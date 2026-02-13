import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import TimesheetSummary from "./timesheet/TimesheetSummary";
import WeeklyTimesheetGrid from "./timesheet/WeeklyTimesheetGrid";

const PersonalTimesheetContent = ({ employeeId, user, profileResolved = true }) => {
    const [view, setView] = useState("summary"); // 'summary' or 'grid'
    const [selectedWeek, setSelectedWeek] = useState(null);
    const [timesheetData, setTimesheetData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [weeks, setWeeks] = useState([]);
    const [joiningDate, setJoiningDate] = useState(null);

    const [approvedLeaves, setApprovedLeaves] = useState([]);

    useEffect(() => {
        if (employeeId) {
            fetchTimesheets(employeeId);
            fetchEmployeeDetails(employeeId);
            fetchApprovedLeaves(employeeId);
        }
    }, [employeeId]);

    useEffect(() => {
        if (timesheetData.length >= 0) {
            const grouped = groupIntoWeeks(timesheetData, joiningDate);
            setWeeks(grouped);
        }
    }, [timesheetData, joiningDate]);

    const fetchApprovedLeaves = async (id) => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`http://localhost:8080/api/leaves/employee/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (response.ok && result.data) {
                // Filter only approved leaves
                const approved = result.data.filter(l => l.status === 'APPROVED');
                setApprovedLeaves(approved);
            }
        } catch (err) {
            console.error("Error fetching approved leaves", err);
        }
    };

    const fetchTimesheets = async (id) => {
        if (!id) return;
        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            const response = await fetch(`http://localhost:8080/api/timesheets?employeeId=${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                credentials: "include"
            });
            const result = await response.json();
            if (response.ok) {
                setTimesheetData(result.data || []);
            } else {
                toast.error(result.message || "Failed to fetch timesheets");
            }
        } catch (err) {
            toast.error("Error connecting to server");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployeeDetails = async (id) => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`http://localhost:8080/api/employees/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (response.ok && result.data) {
                setJoiningDate(result.data.joiningDate || result.data.hireDate);
            }
        } catch (err) {
            console.error("Error fetching employee details", err);
        }
    };

    const formatDate = (date) => {
        const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        return `${date.getDate().toString().padStart(2, '0')}-${months[date.getMonth()]}-${date.getFullYear()}`;
    };

    const groupIntoWeeks = (data, joiningDate) => {
        const weeksMap = {};

        const parseDateLocal = (d) => {
            if (!d) return new Date();
            if (d instanceof Date) return new Date(d);
            const s = d.toString().split('T')[0];
            const parts = s.split('-');
            if (parts.length === 3) {
                return new Date(parts[0], parts[1] - 1, parts[2]);
            }
            return new Date(d);
        };

        // Helper to get Saturday of the week
        const getSaturday = (d) => {
            const date = parseDateLocal(d);
            const day = date.getDay(); // 0 (Sun) to 6 (Sat)
            const diff = (day + 1) % 7;
            date.setDate(date.getDate() - diff);
            date.setHours(0, 0, 0, 0);
            return date;
        };

        // Initialize weeks from now back to joiningDate
        const now = new Date();
        const startPoint = joiningDate ? parseDateLocal(joiningDate) : new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);

        let currentSat = getSaturday(now);
        const limitSat = getSaturday(startPoint);

        const getLocalDateStr = (date) => {
            if (!date) return "";
            if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(date)) {
                return date.split('T')[0];
            }
            const d = date instanceof Date ? date : new Date(date);
            const year = d.getFullYear();
            const month = (d.getMonth() + 1).toString().padStart(2, '0');
            const day = d.getDate().toString().padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        while (currentSat >= limitSat) {
            const key = getLocalDateStr(currentSat);
            const fri = new Date(currentSat);
            fri.setDate(currentSat.getDate() + 6);

            weeksMap[key] = {
                start: new Date(currentSat),
                end: fri,
                startDate: formatDate(currentSat),
                endDate: formatDate(fri),
                status: 'Not Filled',
                billableHrs: 0,
                nonBillableHrs: 0,
                timeOffHrs: 0,
                truTimeHrs: 0,
                entries: []
            };

            currentSat.setDate(currentSat.getDate() - 7);
        }

        data.forEach(entry => {
            const sat = getSaturday(entry.date);
            const key = getLocalDateStr(sat);

            if (!weeksMap[key]) {
                const fri = new Date(sat);
                fri.setDate(sat.getDate() + 6);
                weeksMap[key] = {
                    start: sat,
                    end: fri,
                    startDate: formatDate(sat),
                    endDate: formatDate(fri),
                    status: 'Approved',
                    billableHrs: 0,
                    nonBillableHrs: 0,
                    timeOffHrs: 0,
                    truTimeHrs: 0,
                    entries: []
                };
            }

            const week = weeksMap[key];
            week.entries.push(entry);

            if (entry.category === 'TRUTIME') {
                week.truTimeHrs += entry.totalHours;
            } else if (entry.category === 'HOLIDAY' || entry.category === 'TIMEOFF' || entry.category === 'LEAVE') {
                week.timeOffHrs += entry.totalHours;
            } else if (entry.billable) {
                week.billableHrs += entry.totalHours;
            } else {
                week.nonBillableHrs += entry.totalHours;
            }

            if (entry.status === 'PENDING') {
                week.status = 'Pending';
            } else if (entry.status === 'REJECTED') {
                week.status = 'Rejected';
            } else if (entry.status === 'APPROVED') {
                week.status = 'Approved';
            }
        });

        return Object.values(weeksMap).sort((a, b) => b.start - a.start);
    };

    const handleSelectWeek = (week) => {
        setSelectedWeek(week);
        setView("grid");
    };

    const handleSaveWeekly = async (payload) => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");

            // Format entries to include startTime/endTime as the backend expects
            const formattedEntries = payload.entries.map(entry => {
                const startTime = "09:00:00";
                const [h, m] = [Math.floor(entry.totalHours + 9), Math.round((entry.totalHours % 1) * 60)];
                const endTime = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:00`;
                return {
                    ...entry,
                    employeeId: employeeId, // Ensure employeeId is included for each entry
                    startTime,
                    endTime
                };
            });

            const weeklyPayload = {
                weekStart: payload.weekStart,
                entries: formattedEntries
            };

            await fetch('http://localhost:8080/api/timesheets/save-weekly', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                credentials: "include",
                body: JSON.stringify(weeklyPayload)
            });

            toast.success("Weekly timesheet saved successfully");
            setView("summary");
            fetchTimesheets(employeeId);
        } catch (err) {
            toast.error("Error saving timesheet");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-[600px] max-w-7xl mx-auto flex flex-col overflow-hidden px-4">
            {view === 'summary' && (
                <div className="flex justify-end mb-4 shrink-0">
                    <div />
                </div>
            )}

            {loading && (
                <div className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Processing Request...</p>
                    </div>
                </div>
            )}

            {!loading && view === 'summary' && (
                <TimesheetSummary
                    weeks={weeks}
                    onSelectWeek={handleSelectWeek}
                />
            )}

            {!loading && view === 'grid' && (
                <WeeklyTimesheetGrid
                    weekData={selectedWeek}
                    employeeId={employeeId}
                    approvedLeaves={approvedLeaves}
                    readOnly={selectedWeek.status === 'Approved'}
                    onBack={() => setView('summary')}
                    onSave={handleSaveWeekly}
                />
            )}
        </div>
    );
};

export default PersonalTimesheetContent;
