
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import WeeklyTimesheetGrid from "../employee/timesheet/WeeklyTimesheetGrid";
import { toast } from "react-toastify";

export default function HrManagerTimesheets() {
    const [activeTab, setActiveTab] = useState("timesheet");
    const [user, setUser] = useState({});
    const [loading, setLoading] = useState(true);
    const [timesheets, setTimesheets] = useState([]);
    const [tsFilter, setTsFilter] = useState("");
    const [managers, setManagers] = useState([]);
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

            // 1. Fetch Reporting Managers
            const managerRes = await fetch("http://localhost:8080/api/reporting-managers", {
                headers,
                credentials: "include",
            });
            const managersData = await managerRes.json();
            const managersList = Array.isArray(managersData) ? managersData : (managersData.data || []);
            setManagers(managersList);

            // 2. Fetch ALL timesheets (since backend now allows HR to see all)
            const tsRes = await fetch("http://localhost:8080/api/timesheets?size=1000", {
                headers,
                credentials: "include"
            });

            if (tsRes.ok) {
                const tsJson = await tsRes.json();
                const allTs = tsJson.data || tsJson || [];

                if (Array.isArray(allTs)) {
                    // Filter to only include timesheets from the reporting managers
                    const managerIds = new Set(managersList.map(m => String(m.id || m.employeeId)));
                    const filteredTs = allTs.filter(ts => ts.employeeId && managerIds.has(String(ts.employeeId)));

                    setTimesheets(filteredTs);
                    const grouped = groupIntoWeeks(filteredTs);
                    setGroupedWeeks(grouped);
                }
            } else {
                console.error("Failed to fetch timesheets");
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

    const handleApprove = async (id) => {
        try {
            const res = await fetch(`http://localhost:8080/api/timesheets/${id}/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: "include",
                body: JSON.stringify({ reviewerId: user.id })
            });
            if (res.ok) {
                fetchData();
            } else {
                alert("Failed to approve timesheet");
            }
        } catch (e) {
            console.error(e);
            alert("Error approving timesheet");
        }
    };

    const handleReject = async (id) => {
        const reason = window.prompt("Enter rejection reason:");
        if (reason === null) return;
        try {
            const res = await fetch(`http://localhost:8080/api/timesheets/${id}/reject`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: "include",
                body: JSON.stringify({ reviewerId: user.id, reason })
            });
            if (res.ok) {
                fetchData();
            } else {
                alert("Failed to reject timesheet");
            }
        } catch (e) {
            console.error(e);
            alert("Error rejecting timesheet");
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

            if (entry.category === 'TRUTIME') { }
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

    const handleApproveWeek = async (week) => {
        try {
            const pendingEntries = week.entries.filter(e => e.status === 'PENDING');
            if (pendingEntries.length === 0) {
                toast.info("No pending entries to approve.");
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
            toast.error("Error approving week");
        } finally {
            setLoading(false);
        }
    };

    const handleRejectWeek = async (week) => {
        const reason = window.prompt("Enter rejection reason:");
        if (reason === null) return;

        try {
            const pendingEntries = week.entries.filter(e => e.status === 'PENDING');
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
            toast.error("Error rejecting week");
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB');
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
        <div className="flex min-h-screen bg-bg-slate font-brand text-brand-blue">
            <Sidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                handleLogout={handleLogout}
                navItems={navItems}
            />

            <main className="flex-1 flex flex-col">
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
                                Manager Timesheets
                            </h1>
                            <p className="text-[10px] text-brand-blue/40 uppercase font-black tracking-[0.2em] mt-0.5">
                                {user.designation || "Human Resources"}
                            </p>
                        </div>
                    </div>
                </header>

                <div className="flex-1 p-4 md:p-10">
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
                                                placeholder="Search Manager..."
                                                value={tsFilter}
                                                onChange={(e) => setTsFilter(e.target.value)}
                                                className="w-64 h-10 bg-white border border-brand-blue/10 rounded-xl px-4 text-xs font-bold text-brand-blue outline-none focus:ring-2 focus:ring-brand-blue/5 transition-all shadow-sm"
                                            />
                                        </div>
                                    </div>
                                </header>

                                <div className="space-y-8">
                                    {loading ? (
                                        <div className="py-20 flex flex-col items-center justify-center space-y-4 bg-white rounded-[32px] border border-brand-blue/5 shadow-sm">
                                            <div className="w-12 h-12 border-4 border-brand-blue border-t-transparent rounded-full animate-spin" />
                                            <p className="text-brand-blue/40 font-bold uppercase tracking-widest text-[10px]">Processing Manager Data...</p>
                                        </div>
                                    ) : groupedWeeks.length === 0 ? (
                                        <div className="py-20 text-center bg-white rounded-[32px] border-2 border-dashed border-brand-blue/5">
                                            <p className="text-brand-blue/20 font-bold uppercase tracking-widest text-xs italic">No manager timesheet records found.</p>
                                        </div>
                                    ) : (
                                        groupedWeeks
                                            .map(week => {
                                                const filteredEmployees = week.employeeList.filter(emp => {
                                                    const manager = managers.find(m => String(m.id || m.employeeId) === String(emp.employeeId));
                                                    return !tsFilter ||
                                                        emp.employeeName.toLowerCase().includes(tsFilter.toLowerCase()) ||
                                                        emp.employeeId.toString().includes(tsFilter) ||
                                                        (manager?.officeId && manager.officeId.toLowerCase().includes(tsFilter.toLowerCase()));
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
                                                            <span className="text-white/40 text-[8px] font-bold uppercase tracking-widest ml-2">Managers Recorded</span>
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
                                                                            const manager = managers.find(m => String(m.id || m.employeeId) === String(emp.employeeId));
                                                                            return manager?.officeId || emp.employeeId;
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
                </div>
            </main>
        </div>
    );
}
