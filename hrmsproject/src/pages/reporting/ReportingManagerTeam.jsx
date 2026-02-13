import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Logo from '../../assets/ORYFOLKS-logo.png';
import WeeklyTimesheetGrid from "../employee/timesheet/WeeklyTimesheetGrid";
import { toast } from "react-toastify";


export default function ReportingManagerTeam() {
    const navigate = useNavigate();
    const [teamMembers, setTeamMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [view, setView] = useState('team'); // 'team' or 'leaves'
    const [leaves, setLeaves] = useState([]);
    const [leavesLoading, setLeavesLoading] = useState(false);
    const [leavesError, setLeavesError] = useState(null);
    const [leavesFilter, setLeavesFilter] = useState("");
    const storedUser = JSON.parse(localStorage.getItem("user")) || {};
    const initialManagerId = storedUser.employeeId || storedUser.id || storedUser.userId || null;

    const [managerId, setManagerId] = useState(initialManagerId);
    const [userLoading, setUserLoading] = useState(!initialManagerId);
    const [teamTimesheets, setTeamTimesheets] = useState([]);
    const [tsLoading, setTsLoading] = useState(false);
    const [tsError, setTsError] = useState(null);
    const [tsFilter, setTsFilter] = useState("");
    const [user, setUser] = useState(storedUser);
    const [tsSubView, setTsSubView] = useState('summary'); // 'summary' or 'grid'
    const [selectedWeek, setSelectedWeek] = useState(null);
    const [groupedWeeks, setGroupedWeeks] = useState([]);

    useEffect(() => {
        // If we already have managerId from localStorage, start fetching team immediately
        if (managerId) {
            fetchTeam(managerId);
        }

        const fetchEmployeeProfile = async () => {
            try {
                const token = localStorage.getItem("token");
                const response = await fetch("http://localhost:8080/me/employee", {
                    method: "GET",
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    credentials: "include"
                });

                if (response.ok) {
                    const result = await response.json();
                    const employeeData = result.data || result;
                    if (employeeData && employeeData.id) {
                        setManagerId(employeeData.id);

                        // If it's the first time and we didn't have it in localStorage, fetch team now
                        if (!managerId) fetchTeam(employeeData.id);

                        const stored = JSON.parse(localStorage.getItem("user")) || {};
                        const newUser = {
                            ...stored,
                            firstName: employeeData.firstName || stored.firstName,
                            lastName: employeeData.lastName || stored.lastName,
                            fullName: employeeData.firstName ? `${employeeData.firstName} ${employeeData.lastName}` : (stored.fullName || "Reporting Manager"),
                            designation: employeeData.designation || stored.designation,
                            role: stored.role || "REPORTING_MANAGER"
                        };
                        setUser(newUser);
                        localStorage.setItem("user", JSON.stringify(newUser));
                        setUserLoading(false);
                    }
                }
            } catch (err) {
                console.error("🔴 Error fetching employee profile:", err);
            } finally {
                setUserLoading(false);
            }
        };

        fetchEmployeeProfile();
        // eslint-disable-next-line
    }, []);

    // Fetch all team members' leaves (moved to component scope)
    const fetchLeaves = async (managerId) => {
        setLeavesLoading(true);
        setLeavesError(null);
        try {
            // Correct API endpoint
            const res = await fetch(`http://localhost:8080/api/leaves/manager/${managerId}/team-leaves`, {
                credentials: "include"
            });
            if (res.ok) {
                let api = await res.json();
                let data = (api && api.data) ? api.data : [];
                // Sort: pending on top, then by date desc
                data = (data || []).sort((a, b) => {
                    if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
                    if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;
                    return new Date(b.startDate) - new Date(a.startDate);
                });
                setLeaves(data);
            } else {
                setLeavesError("Failed to load leaves. Try again later.");
            }
        } catch (err) {
            setLeavesError("Server error. Try again later.");
        } finally {
            setLeavesLoading(false);
        }
    };

    const fetchTeamTimesheets = async (managerId) => {
        setTsLoading(true);
        setTsError(null);
        try {
            const res = await fetch(`http://localhost:8080/api/timesheets/manager/${managerId}/team-timesheets`, {
                credentials: "include"
            });
            if (res.ok) {
                const api = await res.json();
                const allEntries = api.data || [];
                setTeamTimesheets(allEntries);
                const grouped = groupTeamIntoWeeks(allEntries);
                setGroupedWeeks(grouped);
            } else {
                setTsError("Failed to load team timesheets.");
            }
        } catch (err) {
            setTsError("Server error loading timesheets.");
        } finally {
            setTsLoading(false);
        }
    };

    const fetchTeam = async (managerId) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`http://localhost:8080/api/reporting-managers/${managerId}`, {
                credentials: "include"
            });
            if (res.ok) {
                const data = await res.json();
                // API returns manager object, team is in 'team' array
                // We exclude the manager themselves if they appear in their own team
                const team = (data.team || []).filter(member => member.id !== managerId);
                setTeamMembers(team);
            } else {
                setError("Failed to load team data. Please try again later.");
            }
        } catch (err) {
            console.error("Error fetching team:", err);
            setError("Server connection failed. Please check your network.");
        } finally {
            setLoading(false);
        }
    };

    const handleApproveTimesheet = async (id) => {
        try {
            const response = await fetch(`http://localhost:8080/api/timesheets/${id}/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: "include",
                body: JSON.stringify({ reviewerId: managerId, comments: "Approved by manager" })
            });

            if (response.ok) {
                if (managerId) fetchTeamTimesheets(managerId);
            } else {
                console.error("Failed to approve timesheet");
            }
        } catch (err) {
            console.error("Error approving timesheet:", err);
        }
    };

    const handleRejectTimesheet = async (id) => {
        const reason = window.prompt("Enter reason for rejection:", "Rejected by manager");
        if (reason === null) return; // User cancelled

        try {
            const response = await fetch(`http://localhost:8080/api/timesheets/${id}/reject`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: "include",
                body: JSON.stringify({ reviewerId: managerId, reason: reason })
            });

            if (response.ok) {
                if (managerId) fetchTeamTimesheets(managerId);
            } else {
                console.error("Failed to reject timesheet");
            }
        } catch (err) {
            console.error("Error rejecting timesheet:", err);
        }
    };

    const handleLogout = () => {
        if (window.confirm("Are you sure you want to logout?")) {
            localStorage.removeItem("user");
            localStorage.removeItem("token");
            navigate("/login");
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB'); // DD/MM/YYYY
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB') + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const calculateDuration = (start, end) => {
        if (!start || !end) return "0.0";
        const [startH, startM] = start.split(':').map(Number);
        const [endH, endM] = end.split(':').map(Number);
        const startTotal = startH * 60 + startM;
        const endTotal = endH * 60 + endM;
        let diff = endTotal - startTotal;
        if (diff < 0) diff += 24 * 60;
        return (diff / 60).toFixed(1);
    };

    const formatTime12h = (time24) => {
        if (!time24) return "—";
        const [hours, minutes] = time24.split(':').map(Number);
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const h12 = hours % 12 || 12;
        const m = minutes.toString().padStart(2, '0');
        return `${h12}:${m} ${ampm}`;
    };

    const groupTeamIntoWeeks = (data) => {
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

        const getSaturday = (d) => {
            const date = parseDateLocal(d);
            const day = date.getDay();
            const diff = (day + 1) % 7;
            date.setDate(date.getDate() - diff);
            date.setHours(0, 0, 0, 0);
            return date;
        };

        const formatShortDate = (date) => {
            const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
            return `${date.getDate().toString().padStart(2, '0')}-${months[date.getMonth()]}-${date.getFullYear()}`;
        };

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

        data.forEach(entry => {
            const sat = getSaturday(entry.date);
            const weekKey = getLocalDateStr(sat);

            if (!weeksMap[weekKey]) {
                const fri = new Date(sat);
                fri.setDate(sat.getDate() + 6);
                weeksMap[weekKey] = {
                    weekKey,
                    start: sat,
                    end: fri,
                    startDateStr: formatShortDate(sat),
                    endDateStr: formatShortDate(fri),
                    employees: {}
                };
            }

            const week = weeksMap[weekKey];
            const empId = entry.employeeId;

            if (!week.employees[empId]) {
                week.employees[empId] = {
                    employeeId: empId,
                    employeeName: entry.employeeName,
                    billableHrs: 0,
                    nonBillableHrs: 0,
                    timeOffHrs: 0,
                    status: 'Approved',
                    entries: []
                };
            }

            const empWeek = week.employees[empId];
            empWeek.entries.push(entry);

            if (entry.category === 'TRUTIME') { }
            else if (['HOLIDAY', 'TIMEOFF', 'LEAVE', 'Sick Leave', 'Casual Leave', 'Earned Leave'].some(c => entry.category?.includes(c))) empWeek.timeOffHrs += entry.totalHours;
            else if (entry.billable) empWeek.billableHrs += entry.totalHours;
            else empWeek.nonBillableHrs += entry.totalHours;

            if (entry.status === 'PENDING') empWeek.status = 'Pending';
            else if (entry.status === 'REJECTED' && empWeek.status !== 'Pending') empWeek.status = 'Rejected';
        });

        const result = Object.values(weeksMap).map(w => ({
            ...w,
            employeeList: Object.values(w.employees).sort((a, b) => (a.employeeName || "").localeCompare(b.employeeName || ""))
        }));

        return result.sort((a, b) => b.start - a.start);
    };

    const handleApproveWeek = async (week) => {
        try {
            const pendingEntries = week.entries.filter(e => e.status === 'PENDING');
            if (pendingEntries.length === 0) {
                toast.info("No pending entries to approve in this week.");
                return;
            }

            setTsLoading(true);
            for (const entry of pendingEntries) {
                await fetch(`http://localhost:8080/api/timesheets/${entry.id}/approve`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: "include",
                    body: JSON.stringify({ reviewerId: managerId, comments: "Approved by manager" })
                });
            }
            toast.success(`Week approved for ${week.employeeName}`);
            await fetchTeamTimesheets(managerId);
            setTsSubView('summary');
        } catch (err) {
            toast.error("Error approving week");
        } finally {
            setTsLoading(false);
        }
    };

    const handleRejectWeek = async (week) => {
        const reason = window.prompt("Enter reason for rejection:", "Rejected by manager");
        if (reason === null) return;

        try {
            const pendingEntries = week.entries.filter(e => e.status === 'PENDING');
            setTsLoading(true);
            for (const entry of pendingEntries) {
                await fetch(`http://localhost:8080/api/timesheets/${entry.id}/reject`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: "include",
                    body: JSON.stringify({ reviewerId: managerId, reason: reason })
                });
            }
            toast.success(`Week rejected for ${week.employeeName}`);
            await fetchTeamTimesheets(managerId);
            setTsSubView('summary');
        } catch (err) {
            toast.error("Error rejecting week");
        } finally {
            setTsLoading(false);
        }
    };

    const navItems = [
        {
            tab: "dashboard",
            label: "Dashboard",
            to: "/reporting-dashboard",
            icon: (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
            )
        },
        {
            tab: "team",
            label: "Team Members",
            icon: (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                </svg>
            ),
            onClick: () => setView('team')
        },
        {
            tab: "timesheets",
            label: "Time Sheets",
            icon: (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
            ),
            onClick: () => {
                setView('timesheets');
                setTsSubView('summary');
                if (managerId) fetchTeamTimesheets(managerId);
            }
        },
        {
            tab: "leaves",
            label: "Leaves",
            icon: (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
            ),
            onClick: () => {
                setView('leaves');
                if (managerId) fetchLeaves(managerId);
            }
        }
    ];

    // We allow the sidebar to render immediately by removing the top-level loader.
    // Individual loading states (loading, leavesLoading, tsLoading) handle content areas.
    return (
        <div className="flex flex-col md:flex-row w-full min-h-screen bg-bg-slate font-brand text-brand-blue">
            {/* Professional Sidebar */}
            <aside className="w-72 bg-brand-blue text-white flex flex-col hidden md:flex h-screen sticky top-0 shadow-xl overflow-hidden flex-shrink-0 z-20">
                {/* Profile Header Block */}
                <div className="p-6 pb-4 text-center border-b border-white/5 flex flex-col items-center bg-brand-blue-hover/30">
                    <img src={Logo} alt="ORYFOLKS Logo" className="h-10 mb-10 object-contain" />
                    <h1 className="text-lg font-bold truncate w-full px-2 leading-tight">
                        {user.fullName || (user.firstName ? `${user.firstName} ${user.lastName}` : "Reporting Manager")}
                    </h1>
                    <p className="text-[10px] opacity-40 uppercase tracking-[0.2em] mt-2 font-bold italic">
                        {user.designation || "Reporting Manager"}
                    </p>
                </div>

                {/* Navigation Menu */}
                <nav className="flex-1 px-4 py-2 space-y-4 overflow-y-auto custom-scrollbar">
                    {/* Team Management Sections */}
                    <div className="space-y-1">
                        <p className="px-5 text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-3">Directory & Work</p>
                        {navItems.filter(item => item.tab !== 'dashboard').map((item) => (
                            <button
                                key={item.tab}
                                onClick={() => {
                                    if (item.onClick) item.onClick();
                                    else setView(item.tab);
                                }}
                                className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-xl transition-all duration-200 text-sm font-semibold group ${view === item.tab
                                    ? 'bg-brand-yellow text-brand-blue shadow-lg scale-[1.02]'
                                    : 'text-white/60 hover:text-brand-yellow hover:bg-white/5'
                                    }`}
                            >
                                <span className={`${view === item.tab ? 'text-brand-blue' : 'text-white/20 group-hover:text-brand-yellow'} transition-colors`}>
                                    {item.icon}
                                </span>
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Primary Action: Back to Dashboard (Moved to End) */}
                    <div className="pt-4 border-t border-white/5">
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                navigate("/reporting-dashboard");
                            }}
                            className="w-full flex items-center gap-4 px-5 py-3.5 rounded-xl transition-all duration-200 text-sm font-semibold text-white/60 hover:text-brand-yellow hover:bg-white/5 group"
                        >
                            <span className="text-white/20 group-hover:text-brand-yellow transition-colors">
                                <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M19 12H5M12 19l-7-7 7-7" />
                                </svg>
                            </span>
                            <span>Back to Dashboard</span>
                        </button>
                    </div>
                </nav>

                {/* Footer / Logout Section */}
                <div className="p-4 border-t border-white/5 bg-brand-blue-hover/10">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs font-bold hover:bg-red-500 hover:text-white transition-all active:scale-[0.98] uppercase tracking-widest"
                    >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                            <polyline points="16 17 21 12 16 7"></polyline>
                            <line x1="21" y1="12" x2="9" y2="12"></line>
                        </svg>
                        <span>LOGOUT</span>
                    </button>
                </div>
            </aside>

            {/* ================= MAIN CONTENT ================= */}
            <main className="flex-1 p-4 md:p-8" style={{ minWidth: 0 }}>
                {view === 'team' && (
                    <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-xl border border-brand-blue/5 p-6 md:p-10 relative overflow-hidden">
                        {/* Subtle Background Art */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-yellow/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
                        {/* Header */}
                        <header className="border-b border-brand-blue/5 pb-6 mb-8 flex justify-between items-end">
                            <div className="space-y-1">
                                <p className="text-brand-blue/40 text-[10px] font-bold uppercase tracking-[0.3em] leading-none">Directory View</p>
                                <h1 className="text-2xl md:text-3xl font-black text-brand-blue leading-none">
                                    Team Members
                                </h1>
                            </div>
                            <div className="text-[10px] font-black text-brand-blue bg-brand-yellow px-4 py-1.5 rounded-full uppercase tracking-widest shadow-sm">
                                Total: {teamMembers.length}
                            </div>
                        </header>
                        {/* Premium Cards Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {loading ? (
                                <div className="col-span-full py-20 flex flex-col items-center justify-center space-y-4">
                                    <div className="w-12 h-12 border-4 border-brand-yellow/30 border-t-brand-yellow rounded-full animate-spin" />
                                    <p className="text-brand-blue/40 font-bold uppercase tracking-widest text-[10px]">Fetching Team Members...</p>
                                </div>
                            ) : error ? (
                                <div className="col-span-full py-20 text-center space-y-4">
                                    <div className="text-red-500 font-bold uppercase tracking-widest text-xs">{error}</div>
                                    <button
                                        onClick={() => {
                                            const user = JSON.parse(localStorage.getItem("user"));
                                            if (user) fetchTeam(user.id);
                                        }}
                                        className="btn-primary text-[10px]"
                                    >
                                        Retry
                                    </button>
                                </div>
                            ) : teamMembers.length === 0 ? (
                                <div className="col-span-full py-20 text-center">
                                    <p className="text-brand-blue/30 font-bold uppercase tracking-widest text-xs italic">No team members assigned yet.</p>
                                </div>
                            ) : (
                                teamMembers.map((member) => (
                                    <div
                                        key={member.id}
                                        className="bg-bg-slate p-6 rounded-2xl border border-brand-blue/5 flex flex-col items-center text-center group card-hover relative"
                                    >
                                        <div className="w-14 h-14 bg-white rounded-2xl mb-4 flex items-center justify-center p-3 text-brand-blue/20 group-hover:bg-brand-yellow group-hover:text-brand-blue transition-all duration-300 shadow-sm border border-brand-blue/5">
                                            <svg fill="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                            </svg>
                                        </div>
                                        <h2 className="text-sm font-bold text-brand-blue leading-tight mb-0.5">{member.name || member.fullName}</h2>
                                        <p className="text-[10px] text-brand-blue/40 font-bold mb-4 tracking-wider">ID: {member.id}</p>
                                        <div className="w-full space-y-3 pt-4 border-t border-brand-blue/5 mt-auto">
                                            <div className="flex flex-col items-center">
                                                <span className="text-[8px] uppercase font-bold text-brand-blue/30 tracking-[0.2em] mb-1">Position</span>
                                                <span className="text-[11px] font-bold text-brand-blue/70 leading-tight">{member.role || "Employee"}</span>
                                            </div>
                                            <div className="flex flex-col items-center gap-2">
                                                <span className="text-[10px] font-semibold text-brand-blue/50 truncate w-full px-2">
                                                    {member.corporateEmail || "Not Available"}
                                                </span>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/admin/employee/${member.id}`);
                                                    }}
                                                    className="w-full py-2 bg-brand-blue text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-brand-blue-hover transition-all active:scale-95 shadow-md"
                                                >
                                                    View Profile
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
                {view === 'timesheets' && (
                    <div className="max-w-[1200px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {tsSubView === 'summary' ? (
                            <>
                                <header className="flex justify-between items-end mb-8 border-b border-brand-blue/5 pb-2">
                                    <div className="flex-1">
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="relative group">
                                            <input
                                                type="text"
                                                placeholder="Filter by Name or ID..."
                                                value={tsFilter}
                                                onChange={(e) => setTsFilter(e.target.value)}
                                                className="w-64 h-10 bg-white border border-brand-blue/10 rounded-xl px-4 text-xs font-bold text-brand-blue outline-none focus:ring-2 focus:ring-brand-blue/5 transition-all shadow-sm"
                                            />
                                        </div>
                                    </div>
                                </header>

                                <div className="space-y-8">
                                    {tsLoading ? (
                                        <div className="py-20 flex flex-col items-center justify-center space-y-4 bg-white rounded-[32px] border border-brand-blue/5 shadow-sm">
                                            <div className="w-12 h-12 border-4 border-brand-blue border-t-transparent rounded-full animate-spin" />
                                            <p className="text-brand-blue/40 font-bold uppercase tracking-widest text-[10px]">Filtering Team Evidence...</p>
                                        </div>
                                    ) : groupedWeeks.length === 0 ? (
                                        <div className="py-20 text-center bg-white rounded-[32px] border-2 border-dashed border-brand-blue/5">
                                            <p className="text-brand-blue/20 font-bold uppercase tracking-widest text-xs italic">No team timesheet records found.</p>
                                        </div>
                                    ) : (
                                        groupedWeeks
                                            .map(week => {
                                                const filteredEmployees = week.employeeList.filter(emp => {
                                                    const member = teamMembers.find(m => String(m.id) === String(emp.employeeId));
                                                    return !tsFilter ||
                                                        emp.employeeName.toLowerCase().includes(tsFilter.toLowerCase()) ||
                                                        emp.employeeId.toString().includes(tsFilter) ||
                                                        (member?.officeId && member.officeId.toLowerCase().includes(tsFilter.toLowerCase()));
                                                });
                                                return { ...week, filteredEmployees };
                                            })
                                            .filter(week => week.filteredEmployees.length > 0)
                                            .map((week, wIdx) => (
                                                <div key={wIdx} className="bg-white rounded-[32px] shadow-xl border border-brand-blue/5 overflow-hidden">
                                                    <div className="bg-gradient-to-r from-brand-blue to-indigo-900 p-3 px-6 flex items-center justify-between">
                                                        <div>
                                                            <h3 className="text-white font-black text-sm tracking-tight uppercase">Week of {week.startDateStr}</h3>
                                                            <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest leading-none">{week.startDateStr} — {week.endDateStr}</p>
                                                        </div>
                                                        <div className="bg-white/10 px-3 py-1 rounded-lg border border-white/10">
                                                            <span className="text-white font-black text-xs">{week.filteredEmployees.length}</span>
                                                            <span className="text-white/40 text-[8px] font-bold uppercase tracking-widest ml-2">Team Members Recorded</span>
                                                        </div>
                                                    </div>

                                                    <div className="p-4 grid grid-cols-1 gap-2">
                                                        {week.filteredEmployees.map((emp, eIdx) => (
                                                            <div
                                                                key={eIdx}
                                                                onClick={() => {
                                                                    setSelectedWeek({
                                                                        ...week,
                                                                        entries: emp.entries,
                                                                        status: emp.status,
                                                                        employeeId: emp.employeeId,
                                                                        employeeName: emp.employeeName,
                                                                        startDate: week.startDateStr,
                                                                        endDate: week.endDateStr
                                                                    });
                                                                    setTsSubView('grid');
                                                                }}
                                                                className="group bg-bg-slate/30 hover:bg-white p-4 rounded-2xl flex items-center gap-4 border border-transparent hover:border-brand-blue/10 hover:shadow-xl hover:shadow-brand-blue/5 transition-all cursor-pointer"
                                                            >
                                                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-brand-blue/30 group-hover:bg-brand-blue group-hover:text-white transition-all shadow-sm">
                                                                    {emp.employeeName?.[0]}
                                                                </div>

                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2">
                                                                        <h4 className="font-black text-sm text-brand-blue uppercase tracking-tight">{emp.employeeName}</h4>
                                                                        <span className="text-[10px] font-bold text-brand-blue/20 uppercase tracking-widest">ID: {(() => {
                                                                            const member = teamMembers.find(m => String(m.id) === String(emp.employeeId));
                                                                            return member?.officeId || emp.employeeId;
                                                                        })()}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-3 mt-1">
                                                                        <div className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${emp.status === 'Approved' ? 'bg-emerald-100 text-emerald-600' :
                                                                            emp.status === 'Rejected' ? 'bg-rose-100 text-rose-600' :
                                                                                'bg-amber-100 text-amber-600'
                                                                            }`}>
                                                                            {emp.status}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="hidden md:flex items-center gap-6 pr-6">
                                                                    <div className="text-center">
                                                                        <p className="text-xs font-black text-brand-blue">{emp.billableHrs.toFixed(1)}</p>
                                                                        <p className="text-[8px] font-black text-brand-blue/20 uppercase tracking-widest">Billable</p>
                                                                    </div>
                                                                    <div className="text-center">
                                                                        <p className="text-xs font-black text-brand-blue">{emp.nonBillableHrs.toFixed(1)}</p>
                                                                        <p className="text-[8px] font-black text-brand-blue/20 uppercase tracking-widest">Non-Bill</p>
                                                                    </div>
                                                                    <div className="text-center border-l border-brand-blue/5 pl-6">
                                                                        <p className="text-sm font-black text-indigo-600">{(emp.billableHrs + emp.nonBillableHrs + emp.timeOffHrs).toFixed(1)}</p>
                                                                        <p className="text-[8px] font-black text-indigo-600/30 uppercase tracking-widest">Total</p>
                                                                    </div>
                                                                </div>

                                                                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-brand-blue/20 group-hover:bg-brand-blue group-hover:text-white transition-all shadow-sm">
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                                                                    </svg>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col gap-6">
                                <WeeklyTimesheetGrid
                                    weekData={selectedWeek}
                                    employeeId={selectedWeek.employeeId}
                                    readOnly={true}
                                    approvedLeaves={[]}
                                    onBack={() => setTsSubView('summary')}
                                    onApprove={() => handleApproveWeek(selectedWeek)}
                                    onReject={() => handleRejectWeek(selectedWeek)}
                                />
                                <div className="flex justify-end gap-4 p-8 bg-white rounded-[32px] border border-brand-blue/5 shadow-xl">
                                    <p className="text-xs font-bold text-brand-blue/30 italic uppercase">
                                        Audit recorded for {selectedWeek.employeeName} — Week of {selectedWeek.startDate}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                {view === 'leaves' && (
                    <div className="max-w-[1200px] mx-auto">
                        <header className="flex justify-between items-center mb-8">
                            <h1 className="text-3xl font-bold text-brand-blue">Team Leaves</h1>
                            <div className="flex items-center gap-3">
                                <div className="relative group">
                                    <input
                                        type="text"
                                        placeholder="Filter by name..."
                                        value={leavesFilter}
                                        onChange={(e) => setLeavesFilter(e.target.value)}
                                        className="w-[268px] h-[47px] bg-white border-2 border-transparent focus:border-brand-yellow rounded-2xl px-5 text-sm font-bold text-brand-blue/60 outline-none transition-all shadow-sm"
                                    />
                                    <button className="absolute right-0 top-0 h-full w-[66px] bg-brand-blue text-white rounded-r-2xl flex items-center justify-center hover:bg-brand-blue-hover transition-colors">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </header>

                        <div className="bg-white rounded-[20px] shadow-xl overflow-hidden border border-brand-blue/5">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-separate border-spacing-0">
                                    <thead className="bg-bg-slate/50">
                                        <tr className="text-brand-blue/40 font-black uppercase tracking-[0.15em] text-[11px]">
                                            <th className="p-5 px-8 border-b border-brand-blue/5">Emp ID</th>
                                            <th className="p-5 px-6 border-b border-brand-blue/5">Name</th>
                                            <th className="p-5 px-6 border-b border-brand-blue/5 text-center">Type</th>
                                            <th className="p-5 px-6 border-b border-brand-blue/5">Reason</th>
                                            <th className="p-5 px-6 border-b border-brand-blue/5 text-center">Dates</th>
                                            <th className="p-5 px-6 border-b border-brand-blue/5 text-center">Days</th>
                                            <th className="p-5 px-6 border-b border-brand-blue/5 text-center">Status</th>
                                            <th className="p-5 px-8 border-b border-brand-blue/5 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-brand-blue/5">
                                        {leavesLoading ? (
                                            <tr>
                                                <td colSpan="8" className="p-20 text-center text-brand-blue/30 font-bold uppercase tracking-widest text-xs animate-pulse">Loading Team Leaves...</td>
                                            </tr>
                                        ) : leavesError ? (
                                            <tr>
                                                <td colSpan="8" className="p-20 text-center text-red-500 font-bold uppercase tracking-widest text-xs">{leavesError}</td>
                                            </tr>
                                        ) : leaves.length === 0 ? (
                                            <tr>
                                                <td colSpan="8" className="p-20 text-center text-brand-blue/20 font-bold uppercase tracking-widest text-xs italic">No leave requests found.</td>
                                            </tr>
                                        ) : (
                                            leaves.filter(lv => !leavesFilter || (lv.employeeName && lv.employeeName.toLowerCase().includes(leavesFilter.toLowerCase()))).map((leave) => (
                                                <tr key={leave.id} className="hover:bg-bg-slate/40 transition-colors font-medium group">
                                                    <td className="p-5 px-8 font-black text-brand-blue/40 text-xs">#{(() => {
                                                        const member = teamMembers.find(m => String(m.id) === String(leave.employeeId) || (m.firstName + " " + m.lastName) === leave.employeeName);
                                                        return member?.officeId || leave.employeeId;
                                                    })()}</td>
                                                    <td className="p-5 px-6 font-bold text-brand-blue uppercase text-xs">{leave.employeeName}</td>
                                                    <td className="p-5 px-6 text-brand-blue/70 text-xs font-bold text-center">{leave.type || leave.leaveType}</td>
                                                    <td className="p-5 px-6 text-brand-blue/60 text-xs italic truncate max-w-[150px]">{leave.reason || "-"}</td>
                                                    <td className="p-5 px-6 text-brand-blue/60 text-xs text-center whitespace-nowrap">
                                                        {leave.startDate}{leave.endDate && leave.endDate !== leave.startDate ? ` → ${leave.endDate}` : ''}
                                                    </td>
                                                    <td className="p-5 px-6 text-center">
                                                        <span className="bg-brand-blue/5 text-brand-blue px-3 py-1 rounded-lg font-black text-[11px]">
                                                            {calculateLeaveDays(leave.startDate, leave.endDate)}
                                                        </span>
                                                    </td>
                                                    <td className="p-5 px-6 text-center">
                                                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm transition-all ${leave.status === 'PENDING'
                                                            ? 'bg-brand-yellow/10 text-brand-yellow-dark border-brand-yellow/20'
                                                            : leave.status === 'APPROVED'
                                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                                : 'bg-red-50 text-red-600 border-red-100'
                                                            }`}>
                                                            {leave.status}
                                                        </span>
                                                    </td>
                                                    <td className="p-5 px-8 text-right">
                                                        {leave.status === 'PENDING' ? (
                                                            <div className="flex justify-end gap-2">
                                                                <button
                                                                    onClick={async () => {
                                                                        await fetch(`http://localhost:8080/api/leaves/${leave.id}/approve`, {
                                                                            method: 'POST',
                                                                            credentials: 'include',
                                                                            headers: { 'Content-Type': 'application/json' },
                                                                            body: JSON.stringify({ approverId: managerId })
                                                                        });
                                                                        if (managerId) fetchLeaves(managerId);
                                                                    }}
                                                                    className="px-3 py-1 bg-emerald-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-md active:scale-95"
                                                                >
                                                                    Approve
                                                                </button>
                                                                <button
                                                                    onClick={async () => {
                                                                        await fetch(`http://localhost:8080/api/leaves/${leave.id}/reject`, {
                                                                            method: 'POST',
                                                                            credentials: 'include',
                                                                            headers: { 'Content-Type': 'application/json' },
                                                                            body: JSON.stringify({ approverId: managerId, reason: "Rejected by manager" })
                                                                        });
                                                                        if (managerId) fetchLeaves(managerId);
                                                                    }}
                                                                    className="px-3 py-1 bg-red-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-md active:scale-95"
                                                                >
                                                                    Reject
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col items-end">
                                                                <span className="text-[8px] font-black text-brand-blue/30 uppercase tracking-widest">
                                                                    By: {leave.approvedBy || "System"}
                                                                </span>
                                                                <span className="text-[8px] font-bold text-brand-blue/20 uppercase tracking-widest leading-none mt-0.5">
                                                                    {formatDateTime(leave.reviewedAt)}
                                                                </span>
                                                                {leave.status === 'REJECTED' && leave.rejectionReason && (
                                                                    <span className="text-[9px] text-red-400 font-bold truncate max-w-[150px] mt-1">{leave.rejectionReason}</span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
}
