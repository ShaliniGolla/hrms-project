
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../../components/AdminSidebar";
import WeeklyTimesheetGrid from "../employee/timesheet/WeeklyTimesheetGrid";
import { toast } from "react-toastify";
import { Search, Filter, Clock } from "lucide-react";

export default function AdminTimesheets() {
    const [activeTab, setActiveTab] = useState("timesheets");
    const [user, setUser] = useState({});
    const [loading, setLoading] = useState(true);
    const [timesheets, setTimesheets] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [tsFilter, setTsFilter] = useState("");
    const [roleFilter, setRoleFilter] = useState("ALL");
    const [tsSubView, setTsSubView] = useState('summary'); // 'summary' or 'grid'
    const [selectedWeek, setSelectedWeek] = useState(null);
    const [groupedWeeks, setGroupedWeeks] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem("user")) || {};
        setUser(userData);
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

            // Fetch Employees to know their roles
            const empRes = await fetch("http://localhost:8080/api/employees", {
                headers,
                credentials: "include",
            });
            const empJson = await empRes.json();
            const empList = empJson.data || empJson || [];
            if (Array.isArray(empList)) {
                setEmployees(empList);
            }

            const tsRes = await fetch("http://localhost:8080/api/timesheets?size=10000", {
                headers,
                credentials: "include"
            });

            if (tsRes.ok) {
                const tsJson = await tsRes.json();
                const allTs = tsJson.data || tsJson || [];

                if (Array.isArray(allTs)) {
                    setTimesheets(allTs);
                    const grouped = groupIntoWeeks(allTs);
                    setGroupedWeeks(grouped);
                }
            }
        } catch (err) {
            console.error("Error fetching data", err);
        } finally {
            setLoading(false);
        }
    };

    const groupIntoWeeks = (data) => {
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

            if (entry.category === 'TRUTIME') { /* ignore or add to non-billable */ }
            else if (['HOLIDAY', 'TIMEOFF', 'LEAVE', 'Sick Leave', 'Casual Leave', 'Earned Leave'].some(c => entry.category?.includes(c))) empWeek.timeOffHrs += entry.totalHours;
            else if (entry.billable) empWeek.billableHrs += entry.totalHours;
            else empWeek.nonBillableHrs += entry.totalHours;

            if (entry.status === 'PENDING') empWeek.status = 'Pending';
            else if (entry.status === 'REJECTED' && empWeek.status !== 'Pending') empWeek.status = 'Rejected';
        });

        const result = Object.values(weeksMap).map(w => ({
            ...w,
            employeeList: Object.values(w.employees).sort((a, b) => a.employeeName.localeCompare(b.employeeName))
        }));

        return result.sort((a, b) => b.start - a.start);
    };

    const handleLogout = () => {
        if (window.confirm("Are you sure you want to logout?")) {
            localStorage.removeItem("user");
            localStorage.removeItem("token");
            navigate("/login");
        }
    };

    const handleApproveWeek = async (week) => {
        try {
            const pendingEntries = week.entries.filter(e => e.status === 'PENDING');
            if (pendingEntries.length === 0) {
                toast.info("No pending entries to approve in this week.");
                return;
            }

            setLoading(true);
            for (const entry of pendingEntries) {
                await fetch(`http://localhost:8080/api/timesheets/${entry.id}/approve`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: "include",
                    body: JSON.stringify({ reviewerId: user.id })
                });
            }
            toast.success(`Week approved for ${week.employeeName}`);
            await fetchData();
            setTsSubView('summary');
        } catch (err) {
            console.error(err);
            toast.error("Error approving week");
        } finally {
            setLoading(false);
        }
    };

    const handleRejectWeek = async (week) => {
        const reason = window.prompt("Enter rejection reason for this week:");
        if (reason === null) return;

        try {
            const pendingEntries = week.entries.filter(e => e.status === 'PENDING');
            if (pendingEntries.length === 0) {
                toast.info("No pending entries to reject.");
                return;
            }

            setLoading(true);
            for (const entry of pendingEntries) {
                await fetch(`http://localhost:8080/api/timesheets/${entry.id}/reject`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: "include",
                    body: JSON.stringify({ reviewerId: user.id, reason })
                });
            }
            toast.success(`Week rejected for ${week.employeeName}`);
            await fetchData();
            setTsSubView('summary');
        } catch (err) {
            console.error(err);
            toast.error("Error rejecting week");
        } finally {
            setLoading(false);
        }
    };

    const filteredWeeks = groupedWeeks.map(week => {
        const filteredEmployees = week.employeeList.filter(emp => {
            const profile = employees.find(e => e.id === emp.employeeId);
            const matchesSearch = !tsFilter ||
                (emp.employeeName && emp.employeeName.toLowerCase().includes(tsFilter.toLowerCase())) ||
                emp.employeeId.toString().includes(tsFilter) ||
                (profile?.officeId && profile.officeId.toLowerCase().includes(tsFilter.toLowerCase()));

            if (!matchesSearch) return false;
            if (roleFilter === "ALL") return true;

            const role = profile?.role?.toUpperCase() || "";

            if (roleFilter === "HR") return role === "HR";
            if (roleFilter === "RM") return role === "REPORTING_MANAGER";
            if (roleFilter === "OTHERS") return role !== "HR" && role !== "REPORTING_MANAGER" && role !== "ADMIN";

            return true;
        });
        return { ...week, filteredEmployees };
    }).filter(week => week.filteredEmployees.length > 0);

    return (
        <div className="flex min-h-screen bg-bg-slate font-brand text-brand-blue">
            <AdminSidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onLogout={handleLogout}
            />

            <main className="flex-1 flex flex-col overflow-hidden">

                <div className="flex-1 p-4 md:p-10 overflow-y-auto">
                    <div className="max-w-[1200px] mx-auto animate-in fade-in duration-500">
                        {tsSubView === 'summary' ? (
                            <>
                                <div className="bg-white rounded-[24px] p-4 shadow-xl border border-brand-blue/5 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                                    <div className="flex bg-bg-slate/50 p-1.5 rounded-2xl overflow-x-auto scrollbar-hide">
                                        {["ALL", "HR", "RM", "OTHERS"].map((role) => (
                                            <button
                                                key={role}
                                                onClick={() => setRoleFilter(role)}
                                                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${roleFilter === role
                                                    ? "bg-brand-blue text-white shadow-lg shadow-brand-blue/20"
                                                    : "text-brand-blue/40 hover:text-brand-blue hover:bg-white"
                                                    }`}
                                            >
                                                {role === "RM" ? "REPORTING MANAGERS" : role === "OTHERS" ? "OTHER DEPTS" : role}
                                            </button>
                                        ))}
                                    </div>

                                    {tsSubView === 'grid' && (
                                        <button
                                            onClick={() => setTsSubView('summary')}
                                            className="px-6 py-3 bg-brand-blue text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl shadow-brand-blue/10 active:scale-95 transition-all flex items-center gap-2"
                                        >
                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                <path d="M19 12H5M12 19l-7-7 7-7" />
                                            </svg>
                                            Return
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-8">
                                    {loading ? (
                                        <div className="py-20 flex flex-col items-center justify-center space-y-4 bg-white rounded-[32px] border border-brand-blue/5 shadow-sm">
                                            <div className="w-12 h-12 border-4 border-brand-blue border-t-transparent rounded-full animate-spin" />
                                            <p className="text-brand-blue/40 font-bold uppercase tracking-widest text-[10px]">Processing Personnel Data...</p>
                                        </div>
                                    ) : filteredWeeks.length === 0 ? (
                                        <div className="py-20 text-center bg-white rounded-[32px] border-2 border-dashed border-brand-blue/5">
                                            <p className="text-brand-blue/20 font-bold uppercase tracking-widest text-xs italic">No matching records found in archive.</p>
                                        </div>
                                    ) : (
                                        filteredWeeks.map((week, wIdx) => (
                                            <div key={wIdx} className="bg-white rounded-[32px] shadow-xl border border-brand-blue/5 overflow-hidden">
                                                <div className="bg-gradient-to-r from-brand-blue to-indigo-900 p-3 px-6 flex items-center justify-between">
                                                    <div>
                                                        <h3 className="text-white font-black text-sm tracking-tight uppercase">Week of {week.startDateStr}</h3>
                                                        <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest leading-none">{week.startDateStr} — {week.endDateStr}</p>
                                                    </div>
                                                    <div className="bg-white/10 px-3 py-1 rounded-lg border border-white/10">
                                                        <span className="text-white font-black text-xs">{week.filteredEmployees.length}</span>
                                                        <span className="text-white/40 text-[8px] font-bold uppercase tracking-widest ml-2">Resources Recorded</span>
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
                                                                        const profile = employees.find(e => e.id === emp.employeeId);
                                                                        return profile?.officeId || emp.employeeId;
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
                                    onBack={() => setTsSubView('summary')}
                                    employeeId={selectedWeek.employeeId}
                                    readOnly={true}
                                    approvedLeaves={[]}
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
                </div>
            </main>
        </div>
    );
}
