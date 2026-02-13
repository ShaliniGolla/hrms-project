
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";

export default function HrManagerLeaves() {
    const [activeTab, setActiveTab] = useState("leaves");
    const [user, setUser] = useState({});
    const [loading, setLoading] = useState(true);
    const [leaves, setLeaves] = useState([]);
    const [leavesFilter, setLeavesFilter] = useState("");
    const [employees, setEmployees] = useState([]);
    const [leaveRoleFilter, setLeaveRoleFilter] = useState("ALL");
    const navigate = useNavigate();

    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem("user")) || {};
        setUser(userData);
        fetchData();
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            const res = await fetch("http://localhost:8080/api/employees", { credentials: "include" });
            const data = await res.json();
            setEmployees(Array.isArray(data.data) ? data.data : []);
        } catch (error) {
            console.error("Error fetching employees:", error);
        }
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:8080/api/leaves", {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                credentials: "include"
            });

            if (res.ok) {
                const json = await res.json();
                let allLeaves = json.data || json || [];

                // Sort: pending on top, then by date desc
                allLeaves.sort((a, b) => {
                    if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
                    if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;
                    const dateA = new Date(a.startDate);
                    const dateB = new Date(b.startDate);
                    return dateB - dateA;
                });

                setLeaves(allLeaves);
            }
        } catch (err) {
            console.error("Error fetching data", err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        if (window.confirm("Are you sure you want to logout?")) {
            localStorage.removeItem("user");
            localStorage.removeItem("token");
            navigate("/login");
        }
    };

    const handleApprove = async (leaveId) => {
        try {
            const res = await fetch(`http://localhost:8080/api/leaves/${leaveId}/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: "include",
                // current user (HR) approves it
                body: JSON.stringify({ approverId: user.id })
            });
            if (res.ok) {
                fetchData();
            } else {
                alert("Failed to approve leave");
            }
        } catch (e) {
            console.error(e);
            alert("Error approving leave");
        }
    };

    const handleReject = async (leaveId) => {
        const reason = window.prompt("Enter rejection reason:");
        if (reason === null) return;
        try {
            const res = await fetch(`http://localhost:8080/api/leaves/${leaveId}/reject`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: "include",
                body: JSON.stringify({ approverId: user.id, reason })
            });
            if (res.ok) {
                fetchData();
            } else {
                alert("Failed to reject leave");
            }
        } catch (e) {
            console.error(e);
            alert("Error rejecting leave");
        }
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB') + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const calculateLeaveDays = (start, end) => {
        const startDate = new Date(start);
        const endDate = new Date(end);
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return 0;

        let days = 0;
        let d = new Date(startDate);
        while (d <= endDate) {
            const day = d.getDay();
            if (day !== 0 && day !== 6) { // Skip Sat/Sun
                days++;
            }
            d.setDate(d.getDate() + 1);
        }
        return days;
    };

    const navItems = [
        {
            tab: "dashboard",
            label: "Dashboard",
            icon: (
                <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <rect x="3" y="3" width="7" height="7"></rect>
                    <rect x="14" y="3" width="7" height="7"></rect>
                    <rect x="14" y="14" width="7" height="7"></rect>
                    <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
            ),
            to: "/hr/actions",
        },
        {
            tab: "candidates",
            label: "Candidates",
            icon: (
                <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                >
                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                </svg>
            ),
            to: "/hr/actions/candidates",
        },
        {
            tab: "managers",
            label: "Reporting Managers",
            icon: (
                <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                >
                    <path d="M9 7a4 4 0 118 0 4 4 0 01-8 0zM3 20a6 6 0 0112 0v1H3v-1zM17 13a4 4 0 110 8" />
                </svg>
            ),
            to: "/hr/actions/reporting-managers",
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
            to: "/hr/actions/leaves"
        },
        {
            tab: "timesheet",
            label: "Timesheet",
            icon: (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
            ),
            to: "/hr/actions/timesheet"
        },
    ];

    return (
        <div className="flex h-screen bg-bg-slate font-brand text-brand-blue">
            <Sidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                handleLogout={handleLogout}
                navItems={navItems}
            />

            <main className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white px-8 py-6 flex items-center justify-between shadow-sm z-10 border-b border-brand-blue/5">
                    <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-brand-blue/5 rounded-2xl flex items-center justify-center border border-brand-blue/10 shadow-sm overflow-hidden">
                            <svg
                                className="w-7 h-7 text-brand-blue/20"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                            >
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-brand-blue tracking-tight">
                                Employee Leaves
                            </h1>
                            <p className="text-[10px] text-brand-blue/40 uppercase font-black tracking-[0.2em] mt-0.5">
                                {user.designation || "Human Resources"}
                            </p>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-4 md:p-10">
                    <div className="max-w-[1200px] mx-auto">
                        <header className="flex justify-between items-center mb-8">
                            <h1 className="text-3xl font-bold text-brand-blue text-2xl">All Leave Requests</h1>
                            <div className="flex items-center gap-4">
                                <div className="flex bg-bg-slate/50 p-1.5 rounded-2xl w-full sm:w-auto overflow-x-auto scrollbar-hide">
                                    {["ALL", "REPORTING_MANAGERS", "OTHERS"].map((role) => (
                                        <button
                                            key={role}
                                            onClick={() => setLeaveRoleFilter(role)}
                                            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${leaveRoleFilter === role
                                                ? "bg-brand-blue text-white shadow-lg active"
                                                : "text-brand-blue/40 hover:text-brand-blue hover:bg-white"
                                                }`}
                                        >
                                            {role === "REPORTING_MANAGERS" ? "REPORTING MANAGERS" : role === "OTHERS" ? "EMPLOYEES" : role}
                                        </button>
                                    ))}
                                </div>
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
                                        {loading ? (
                                            <tr>
                                                <td colSpan="8" className="p-20 text-center text-brand-blue/30 font-bold uppercase tracking-widest text-xs animate-pulse">Loading Leave Requests...</td>
                                            </tr>
                                        ) : leaves.length === 0 ? (
                                            <tr>
                                                <td colSpan="8" className="p-20 text-center text-brand-blue/20 font-bold uppercase tracking-widest text-xs italic">No leave requests found for managers.</td>
                                            </tr>
                                        ) : (
                                            leaves.filter(lv => {
                                                const matchesSearch = !leavesFilter || (lv.employeeName && lv.employeeName.toLowerCase().includes(leavesFilter.toLowerCase()));

                                                // Find employee for role check
                                                const emp = employees.find(e => e.id === lv.employeeId || e.fullName === lv.employeeName);
                                                const role = emp?.role;

                                                // Hard exclude HR leaves
                                                if (role === "HR") return false;

                                                if (leaveRoleFilter === "ALL") return matchesSearch;
                                                if (leaveRoleFilter === "REPORTING_MANAGERS") return matchesSearch && role === "REPORTING_MANAGER";
                                                if (leaveRoleFilter === "OTHERS") return matchesSearch && role !== "REPORTING_MANAGER";

                                                return matchesSearch;
                                            }).map((leave, index) => (
                                                <tr key={leave.id || index} className="hover:bg-bg-slate/40 transition-colors font-medium group">
                                                    <td className="p-5 px-8 font-black text-brand-blue/40 text-xs">#{(() => {
                                                        const emp = employees.find(e => e.id === leave.employeeId || e.fullName === leave.employeeName);
                                                        return emp?.officeId || leave.employeeId;
                                                    })()}</td>
                                                    <td className="p-5 px-6 font-bold text-brand-blue uppercase text-xs">{leave.employeeName}</td>
                                                    <td className="p-5 px-6 text-brand-blue/70 text-xs font-bold text-center">{leave.leaveType}</td>
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
                                                                    onClick={() => handleApprove(leave.id)}
                                                                    className="px-3 py-1 bg-emerald-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-md active:scale-95"
                                                                >
                                                                    Approve
                                                                </button>
                                                                <button
                                                                    onClick={() => handleReject(leave.id)}
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

                </div >
            </main >
        </div >
    );
}
