import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Sidebar from '../../components/Sidebar';
import LeaveRequestPage from "../employee/LeaveRequestPage";
import PersonalTimesheetContent from "../employee/PersonalTimesheetContent";
import EmployeeOwnProfile from "../employee/EmployeeOwnProfile";

const ReportingManagerDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [user, setUser] = useState({});
  const [currentDate, setCurrentDate] = useState("");
  const [employeeId, setEmployeeId] = useState(null);
  const [profileResolved, setProfileResolved] = useState(false);
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [recentTimesheets, setRecentTimesheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tsLoading, setTsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get("tab");
    if (tabParam && ["dashboard", "team", "timesheet", "leave", "profile"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user")) || {};
    setUser(userData);
    const role = userData?.role || userData?.user?.role;

    // Proactively set employeeId if already in localStorage
    const storedId = userData?.employeeId || userData?.id || userData?.userId;
    if (storedId) {
      setEmployeeId(storedId);
    }

    if (!userData || role !== "REPORTING_MANAGER") {
      navigate("/login");
      return;
    }
    const today = new Date();
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    setCurrentDate(today.toLocaleDateString('en-GB', options));
    fetchEmployeeProfile();
  }, [navigate]);

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
          setEmployeeId(employeeData.id);

          // Use fresh localStorage data to merge, avoiding stale state issues
          const stored = JSON.parse(localStorage.getItem("user")) || {};
          const newUser = {
            ...stored,
            firstName: employeeData.firstName || stored.firstName,
            lastName: employeeData.lastName || stored.lastName,
            fullName: employeeData.firstName ? `${employeeData.firstName} ${employeeData.lastName}` : (stored.fullName || "Reporting Manager"),
            designation: employeeData.designation || stored.designation || "Reporting Manager"
          };
          setUser(newUser);
          localStorage.setItem("user", JSON.stringify(newUser));

          fetchLeaveData(employeeData.id);
          fetchTimesheetData(employeeData.id);
        } else {
          const userData = JSON.parse(localStorage.getItem("user")) || {};
          if (userData.id) {
            setEmployeeId(userData.id);
            fetchLeaveData(userData.id);
            fetchTimesheetData(userData.id);
          } else {
            setError("Could not load employee information");
          }
        }
      } else {
        setError("Failed to fetch employee profile");
      }
    } catch {
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
      setProfileResolved(true);
    }
  };

  const fetchLeaveData = async (employeeId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const balanceResponse = await fetch(`http://localhost:8080/api/leaves/balance/${employeeId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      if (balanceResponse.ok) {
        const balanceData = await balanceResponse.json();
        setLeaveBalance(balanceData.data);
      }
      const allLeavesResponse = await fetch(`http://localhost:8080/api/leaves/employee/${employeeId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      if (allLeavesResponse.ok) {
        const allLeavesData = await allLeavesResponse.json();
        let allLeaves = allLeavesData.data || [];
        allLeaves = allLeaves.sort((a, b) => {
          const dateA = a.submittedAt || a.startDate;
          const dateB = b.submittedAt || b.startDate;
          return new Date(dateB) - new Date(dateA);
        });
        setRecentLeaves(allLeaves);
      }
      setError("");
    } finally {
      setLoading(false);
    }
  };

  const groupIntoWeeksSummary = (data) => {
    const weeksMap = {};

    const getSaturday = (dateStr) => {
      const d = new Date(dateStr);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 6 ? 0 : -1);
      const sat = new Date(d.setDate(diff));
      sat.setHours(0, 0, 0, 0);
      return sat;
    };

    const formatShortDate = (date) => {
      return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).toUpperCase();
    };

    data.forEach(entry => {
      const sat = getSaturday(entry.date);
      const weekKey = sat.toISOString().split('T')[0];

      if (!weeksMap[weekKey]) {
        const fri = new Date(sat);
        fri.setDate(sat.getDate() + 6);
        weeksMap[weekKey] = {
          weekKey,
          start: sat,
          end: fri,
          startDateStr: formatShortDate(sat),
          endDateStr: formatShortDate(fri),
          totalHours: 0,
          status: 'APPROVED',
          entries: []
        };
      }

      const week = weeksMap[weekKey];
      week.entries.push(entry);
      week.totalHours += entry.totalHours || 0;

      if (entry.status === 'PENDING') week.status = 'PENDING';
      else if (entry.status === 'REJECTED' && week.status !== 'PENDING') week.status = 'REJECTED';
    });

    return Object.values(weeksMap).sort((a, b) => b.start - a.start).slice(0, 5);
  };

  const fetchTimesheetData = async (id) => {
    if (!id) return;
    try {
      setTsLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:8080/api/timesheets?employeeId=${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: "include"
      });
      if (response.ok) {
        const result = await response.json();
        const data = result.data || [];
        const grouped = groupIntoWeeksSummary(data);
        setRecentTimesheets(grouped);
      }
    } catch (err) {
      console.error("Error fetching timesheet data:", err);
    } finally {
      setTsLoading(false);
    }
  };

  const handleRefreshData = () => {
    if (employeeId) {
      fetchLeaveData(employeeId);
      fetchTimesheetData(employeeId);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      navigate("/");
    }
  };

  const handleRecallLeave = () => {
    if (window.confirm('Are you sure you want to recall this leave request?')) {
      alert('Leave request recalled successfully! (Demo)');
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'APPROVED':
        return 'bg-emerald-500 text-white';
      case 'PENDING':
        return 'bg-yellow-400 text-slate-900';
      case 'REJECTED':
        return 'bg-red-600 text-white';
      default:
        return 'bg-gray-400 text-white';
    }
  };

  const formatDate = (dateString) => {
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

  // Add Team button to navItems
  const navItems = [
    {
      tab: "dashboard",
      label: "Dashboard",
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
        </svg>
      )
    },
    {
      tab: "team",
      label: "My Team",
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
        </svg>
      ),
      to: "/reporting-team"
    },
    {
      tab: "timesheet",
      label: "Timesheet",
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
      )
    },
    {
      tab: "leave",
      label: "Leave Request",
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
      )
    }
  ];

  return (
    <div className="flex min-h-screen bg-bg-slate font-brand text-brand-blue">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        handleLogout={handleLogout}
        navItems={navItems}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Conditional Header */}
        {activeTab === 'dashboard' ? (
          <header className="bg-white px-8 py-6 flex items-center justify-between shadow-sm z-10 border-b border-brand-blue/5">
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 bg-brand-blue/5 rounded-2xl flex items-center justify-center border border-brand-blue/10 shadow-sm overflow-hidden">
                {user.photoPath ? (
                  <img src={user.photoPath} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-7 h-7 text-brand-blue/20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-black text-brand-blue tracking-tight">
                  Welcome back, {(user.firstName) ? user.firstName : "Manager"}!
                </h1>
                <p className="text-[10px] text-brand-blue/40 uppercase font-black tracking-[0.2em] mt-0.5">
                  {user.designation || "Reporting Manager"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTab("profile")}
                className="px-6 py-2 bg-brand-yellow text-brand-blue font-black rounded-xl text-[11px] uppercase tracking-widest shadow-lg shadow-brand-yellow/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                My Profile
              </button>
            </div>
          </header>
        ) : (
          <header className="bg-brand-blue text-white p-6 md:px-10 flex items-center justify-between shadow-lg z-10">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-brand-yellow rounded-full flex items-center justify-center text-brand-blue shadow-inner border-2 border-white/20 overflow-hidden">
                {user.photoPath ? (
                  <img src={user.photoPath} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-9 h-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">
                  {user.fullName || "Reporting Manager"}
                </h1>
                <p className="text-xs text-white/50 uppercase tracking-[0.2em] mt-1 font-bold">
                  {activeTab === 'team' ? 'Team Leadership Hub' : activeTab === 'profile' ? 'Profile Management' : activeTab === 'timesheet' ? 'Resource Timesheets' : 'Leave Administration'}
                </p>
              </div>
            </div>
            {activeTab !== 'profile' && (
              <button
                onClick={() => setActiveTab("profile")}
                className="btn-primary flex items-center gap-2 text-sm"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                VIEW PROFILE
              </button>
            )}
          </header>
        )}

        {/* Content Area */}
        <div className={`flex-1 ${activeTab === 'profile' ? 'p-2 md:p-6' : 'p-4 md:p-10'} flex flex-col ${activeTab === 'profile' ? 'gap-2' : 'space-y-8'}`}>
          {activeTab === 'dashboard' && (
            <>
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium">
                  {error}
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {loading ? (
                  <div className="col-span-full text-center text-brand-blue/30 py-10 animate-pulse font-bold uppercase tracking-widest text-xs">Loading leave data...</div>
                ) : leaveBalance ? (
                  [
                    {
                      label: "Total Leaves",
                      value: String((leaveBalance.casualLeavesRemaining || 0) + (leaveBalance.sickLeavesRemaining || 0) + (leaveBalance.earnedLeavesRemaining || 0)).padStart(2, '0'),
                      color: "text-brand-blue"
                    },
                    {
                      label: "Casual Leaves",
                      value: String(leaveBalance.casualLeavesRemaining || 0).padStart(2, '0'),
                      color: "text-brand-yellow"
                    },
                    {
                      label: "Sick Leaves",
                      value: String(leaveBalance.sickLeavesRemaining || 0).padStart(2, '0'),
                      color: "text-red-500"
                    },
                    {
                      label: "Earned Leaves",
                      value: String(leaveBalance.earnedLeavesRemaining || 0).padStart(2, '0'),
                      color: "text-emerald-500"
                    },
                  ].map((stat, index) => (
                    <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-brand-blue/5 card-hover flex flex-col items-center">
                      <div className="text-brand-blue/40 text-[10px] font-bold uppercase tracking-widest mb-2">{stat.label}</div>
                      <div className={`text-4xl font-black ${stat.color}`}>{stat.value}</div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center text-brand-blue/30 py-10 font-bold uppercase tracking-widest text-xs">No leave balance found</div>
                )}
              </div>

              {/* Time Sheet Table */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-brand-blue/5 card-hover">
                <div className="px-6 py-4 border-b border-brand-blue/5 bg-brand-blue">
                  <h2 className="text-xs font-bold text-white uppercase tracking-[0.2em]">Time sheet</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead className="bg-bg-slate">
                      <tr className="text-brand-blue/40 font-bold uppercase tracking-widest text-[9px]">
                        <th className="p-4 px-6 border-b border-brand-blue/5">Week Period</th>
                        <th className="p-4 px-6 border-b border-brand-blue/5">Status</th>
                        <th className="p-4 px-6 border-b border-brand-blue/5 text-center">Entries</th>
                        <th className="p-4 px-6 border-b border-brand-blue/5 text-right whitespace-nowrap">Total Hours</th>
                        <th className="p-4 px-6 border-b border-brand-blue/5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-blue/5">
                      {tsLoading ? (
                        <tr>
                          <td colSpan="5" className="p-8 text-center text-brand-blue/30 font-bold uppercase tracking-widest text-[10px]">Loading weekly history...</td>
                        </tr>
                      ) : recentTimesheets.length > 0 ? (
                        recentTimesheets.map((week) => (
                          <tr key={week.weekKey} className="hover:bg-bg-slate transition-colors font-medium">
                            <td className="p-4 px-6">
                              <div className="flex flex-col">
                                <span className="font-bold text-brand-blue uppercase text-xs">Week of {week.startDateStr}</span>
                                <span className="text-[10px] text-brand-blue/40 font-bold">{week.startDateStr} — {week.endDateStr}</span>
                              </div>
                            </td>
                            <td className="p-4 px-6">
                              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${week.status === 'APPROVED' ? 'bg-emerald-500 text-white' : week.status === 'REJECTED' ? 'bg-red-600 text-white' : 'bg-yellow-400 text-slate-900'}`}>
                                {week.status}
                              </span>
                            </td>
                            <td className="p-4 px-6 text-center text-brand-blue/60 font-bold text-xs">{week.entries.length} Days</td>
                            <td className="p-4 px-6 text-right font-black text-brand-blue text-xs">{week.totalHours.toFixed(1)}</td>
                            <td className="p-4 px-6 text-right">
                              <button
                                onClick={() => setActiveTab("timesheet")}
                                className="text-[10px] font-black text-brand-blue/40 hover:text-brand-blue uppercase tracking-widest transition-colors"
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="p-8 text-center text-brand-blue/30 font-bold uppercase tracking-widest text-[10px]">No recent timesheets found</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recent Leave History Table */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-brand-blue/5 card-hover">
                <div className="px-6 py-4 border-b border-brand-blue/5 bg-brand-blue">
                  <h2 className="text-xs font-bold text-white uppercase tracking-[0.2em]">Recent Leave History</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead className="bg-bg-slate">
                      <tr className="text-brand-blue/40 font-bold uppercase tracking-widest text-[9px]">
                        <th className="p-4 px-6 border-b border-brand-blue/5">Type</th>
                        <th className="p-4 px-6 border-b border-brand-blue/5">Reason</th>
                        <th className="p-4 px-6 border-b border-brand-blue/5">Dates</th>
                        <th className="p-4 px-6 border-b border-brand-blue/5">Status</th>
                        <th className="p-4 px-6 border-b border-brand-blue/5">Approved By</th>
                        <th className="p-4 px-6 border-b border-brand-blue/5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-blue/5">
                      {loading ? (
                        <tr>
                          <td colSpan="6" className="p-8 text-center text-brand-blue/30 font-bold uppercase tracking-widest text-[10px]">Loading leave history...</td>
                        </tr>
                      ) : recentLeaves.length > 0 ? (
                        recentLeaves.map((leave) => (
                          <tr key={leave.id} className="hover:bg-bg-slate transition-colors font-medium">
                            <td className="p-4 px-6 font-bold text-brand-blue uppercase text-xs">{leave.leaveType}</td>
                            <td className="p-4 px-6 text-brand-blue/60 text-xs italic truncate max-w-[150px]">{leave.reason || "-"}</td>
                            <td className="p-4 px-6 text-brand-blue/70">
                              {formatDate(leave.startDate)} → {formatDate(leave.endDate)}
                            </td>
                            <td className="p-4 px-6">
                              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.15em] ${getStatusColor(leave.status)}`}>
                                {leave.status}
                              </span>
                            </td>
                            <td className="p-4 px-6">
                              {leave.approvedBy ? (
                                <div className="space-y-0.5">
                                  <p className="font-bold text-brand-blue text-xs uppercase">{leave.approvedBy}</p>
                                  {leave.reviewedAt && (
                                    <p className="text-[10px] text-brand-blue/40 font-bold">{formatDate(leave.reviewedAt)}</p>
                                  )}
                                </div>
                              ) : (
                                <span className="text-brand-blue/30 text-xs italic">Pending review</span>
                              )}
                            </td>
                            <td className="p-4 px-6 text-right">
                              {leave.status === 'PENDING' && (
                                <button
                                  onClick={() => handleRecallLeave(leave.id)}
                                  className="like-btn px-4 py-1.5 bg-red-50 text-red-500 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                >
                                  Recall
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="p-8 text-center text-brand-blue/30 font-bold uppercase tracking-widest text-[10px]">No leave history found</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {activeTab === 'timesheet' && (
            <PersonalTimesheetContent employeeId={employeeId} user={user} profileResolved={profileResolved} />
          )}

          {activeTab === 'leave' && (
            <LeaveRequestPage
              employeeId={employeeId}
              leaveBalance={leaveBalance}
              onLeaveRequestSuccess={handleRefreshData}
            />
          )}

          {/* Team tab handled by navItem onClick, no need for tab content here */}

          {activeTab === 'profile' && (
            <EmployeeOwnProfile hideSidebar={true} />
          )}


        </div>
      </main>
    </div>
  );
};

export default ReportingManagerDashboard;
