
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import { getHrNavItems } from "../../utils/hrNav";
import LeaveDetailsModal from "../../components/LeaveDetailsModal";
import { Eye } from "lucide-react";

export default function HrManagerLeaves() {
    const [activeTab, setActiveTab] = useState("leaves");
    const [user, setUser] = useState({});
    const [loading, setLoading] = useState(true);
    const [leaves, setLeaves] = useState([]);
    const [leavesFilter, setLeavesFilter] = useState("");
    const [employees, setEmployees] = useState([]);
    const [leaveRoleFilter, setLeaveRoleFilter] = useState("ALL");
    const [selectedLeave, setSelectedLeave] = useState(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem("user")) || {};
        setUser(userData);
        loadAllData();
    }, []);

    const loadAllData = async () => {
        setLoading(true);
        const emps = await fetchEmployees();
        await fetchData(emps);
        setLoading(false);
    };

    const fetchEmployees = async () => {
        try {
            const res = await fetch("http://localhost:8080/api/employees", { credentials: "include" });
            const data = await res.json();
            const emps = Array.isArray(data.data) ? data.data : [];
            setEmployees(emps);
            return emps;
        } catch (error) {
            console.error("Error fetching employees:", error);
            return [];
        }
    };

    const fetchData = async (empsList) => {
        try {
            const currentEmps = empsList || employees;
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

                // Filter out HR leaves immediately
                const filteredLeaves = allLeaves.filter(lv => {
                    const emp = currentEmps.find(e => e.id === lv.employeeId || e.fullName === lv.employeeName);
                    return emp?.role !== "HR";
                });

                // Sort: pending on top, then by date desc
                filteredLeaves.sort((a, b) => {
                    if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
                    if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;
                    const dateA = new Date(a.startDate);
                    const dateB = new Date(b.startDate);
                    return dateB - dateA;
                });

                setLeaves(filteredLeaves);
            }
        } catch (err) {
            console.error("Error fetching data", err);
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

    const navItems = getHrNavItems();

    return (
        <div className="flex h-screen bg-bg-slate font-brand text-brand-blue">
            <Sidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                handleLogout={handleLogout}
                navItems={navItems}
            />

            <main className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white px-8 py-4 flex items-center justify-between shadow-sm z-10 border-b border-brand-blue/5">
                    <div className="flex items-center gap-6">
                        <div className="w-11 h-11 bg-brand-blue/5 rounded-xl flex items-center justify-center border border-brand-blue/10 shadow-sm overflow-hidden">
                            <svg
                                className="w-7 h-7 text-brand-blue/20"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                            >
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-brand-blue tracking-tight">
                                Employee Leaves
                            </h1>
                            <p className="text-[10px] text-brand-blue/40 uppercase font-black tracking-[0.2em] mt-0.5">
                                {user.designation || "Human Resources Operations"}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate("/hr?tab=profile")}
                            className="px-6 py-2 bg-brand-yellow text-brand-blue font-black rounded-xl text-[11px] uppercase tracking-widest shadow-lg shadow-brand-yellow/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            VIEW PROFILE
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-4 md:p-10">
                    <div className="max-w-[1200px] mx-auto">
                        <header className="flex justify-end items-center mb-8">
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
                                                            {leave.daysCount != null ? leave.daysCount.toFixed(1) : calculateLeaveDays(leave.startDate, leave.endDate)}
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
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedLeave(leave);
                                                                    setIsDetailsModalOpen(true);
                                                                }}
                                                                className="p-2 bg-brand-blue/5 text-brand-blue rounded-lg hover:bg-brand-blue hover:text-white transition-all shadow-sm"
                                                                title="View Details"
                                                            >
                                                                <Eye size={16} />
                                                            </button>
                                                            {leave.status === 'PENDING' && (
                                                                <>
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
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <LeaveDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                leave={selectedLeave}
            />
        </div>
    );
}
