import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AdminSidebar from "../../components/AdminSidebar";
import EmployeeSelectorModal from "../../components/EmployeeSelectorModal";
import AddEmployeeModal from "../../components/AddEmployeeModal";
import HRSelectorModal from "../../components/HRSelectorModal";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, Label } from 'recharts';

// HR Team Display Component
function HRTeamDisplay() {
  const [hrUsers, setHrUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHRTeam = async () => {
      try {
        setLoading(true);

        // Fetch all users
        const usersRes = await fetch("http://localhost:8080/api/users", { credentials: "include" });
        const usersData = await usersRes.json();
        const hrUsersList = Array.isArray(usersData) ? usersData.filter(u => u.role === 'HR') : [];

        // Fetch all employees
        const empRes = await fetch("http://localhost:8080/api/employees", { credentials: "include" });
        const empData = await empRes.json();
        const employeesList = Array.isArray(empData.data) ? empData.data : [];

        // Match HR users with their employee profiles
        const hrTeam = hrUsersList.map(user => {
          const employee = employeesList.find(emp => emp.userId === user.id);
          return {
            ...user,
            officeId: employee?.officeId || 'N/A',
            firstName: employee?.firstName || 'N/A',
            lastName: employee?.lastName || '',
            phoneNumber: employee?.phoneNumber || 'N/A',
            designation: employee?.designation || 'HR',
            corporateEmail: employee?.corporateEmail || user.email,
          };
        });

        setHrUsers(hrTeam);
      } catch (error) {
        console.error("Error fetching HR team:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHRTeam();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4 opacity-30">
        <div className="w-10 h-10 border-4 border-brand-blue border-t-transparent rounded-full animate-spin" />
        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-brand-blue">Synchronizing Team Data</p>
      </div>
    );
  }

  if (hrUsers.length === 0) {
    return (
      <div className="bg-white/50 backdrop-blur-md rounded-[32px] p-20 text-center border border-dashed border-brand-blue/20 shadow-xl shadow-brand-blue/5">
        <div className="w-16 h-16 bg-brand-blue/5 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-brand-blue/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-black text-brand-blue tracking-tight">Personnel Registry Empty</h3>
        <p className="text-[10px] text-brand-blue/30 mt-2 font-black uppercase tracking-[0.2em]">Administrative provision required</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {hrUsers.map((hr) => (
        <div key={hr.id} className="group relative bg-white rounded-2xl p-5 shadow-xl shadow-brand-blue/5 border border-brand-blue/[0.03] hover:border-brand-blue/10 transition-all duration-300">
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-brand-blue rounded-full flex items-center justify-center text-white font-black text-sm shadow-md shadow-brand-blue/10 mb-3 group-hover:scale-105 transition-transform">
              {hr.firstName?.[0]}{hr.lastName?.[0]}
            </div>

            <h3 className="font-extrabold text-sm text-brand-blue tracking-tight leading-tight truncate w-full">
              {hr.firstName} {hr.lastName}
            </h3>
            <span className="mt-1.5 px-3 py-1 bg-brand-yellow/10 text-brand-blue text-[8px] font-black uppercase tracking-widest rounded-full border border-brand-yellow/20">
              {hr.designation}
            </span>

            <div className="mt-4 w-full space-y-2">
              <div className="flex items-center gap-2.5 p-2 bg-bg-slate/30 rounded-xl group-hover:bg-bg-slate/50 transition-colors">
                <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center text-brand-blue/40 shadow-sm flex-shrink-0">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-[10px] font-bold text-brand-blue/60 truncate tracking-tight">{hr.corporateEmail}</p>
              </div>

              <div className="flex items-center gap-2.5 p-2 bg-bg-slate/30 rounded-xl group-hover:bg-bg-slate/50 transition-colors">
                <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center text-brand-blue/40 shadow-sm flex-shrink-0">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <p className="text-[10px] font-black text-brand-blue/20 uppercase tracking-[0.2em]">{hr.officeId}</p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.tab || "dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingLeaveId, setRejectingLeaveId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false);
  const [isHRModalOpen, setIsHRModalOpen] = useState(false);
  const [hrTeamMembers, setHrTeamMembers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [leaveSearch, setLeaveSearch] = useState("");
  const [leaveRoleFilter, setLeaveRoleFilter] = useState("ALL");

  const [stats, setStats] = useState({
    totalEmployees: 0,
    hrUsers: 0,
    pendingLeaves: 0,
    reportingManagers: 0,
  });

  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState({});
  const [hoveredLeaveData, setHoveredLeaveData] = useState(null);

  const fetchCalendarData = async (date) => {
    try {
      const year = date.getFullYear();
      const month = date.getMonth();
      const formatDateLocal = (d) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      };

      const start = formatDateLocal(new Date(year, month, 1));
      const end = formatDateLocal(new Date(year, month + 1, 0));

      const res = await fetch(`http://localhost:8080/api/attendance/calendar?start=${start}&end=${end}`, { credentials: "include" });
      const data = await res.json();
      if (data.status === "success") {
        setCalendarData(data.data.dailyLeaves || {});
      }
    } catch (error) {
      console.error("Error fetching calendar data:", error);
    }
  };

  useEffect(() => {
    fetchCalendarData(currentDate);
  }, [currentDate]);

  const changeMonth = (offset) => {
    const nextDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1);
    setCurrentDate(nextDate);
  };

  const navigate = useNavigate();

  // Get current user ID from localStorage
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user")) || {};
    setCurrentUserId(userData.id || userData.userId);
  }, []);

  // Update activeTab if location state changes
  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
    }
  }, [location.state]);

  // Fetch leave requests from backend
  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8080/api/leaves", {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (response.ok) {
        const data = await response.json();
        const allLeaves = data.data || [];

        // Sort: pending on top, then by date desc
        const sorted = [...allLeaves].sort((a, b) => {
          if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
          if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;
          const dateA = new Date(a.startDate);
          const dateB = new Date(b.startDate);
          return dateB - dateA;
        });

        setLeaveRequests(sorted);
        const pending = allLeaves.filter(leave => leave.status === 'PENDING');
        setPendingLeaves(pending);

        setStats((prev) => ({
          ...prev,
          pendingLeaves: pending.length,
        }));
      }
    } catch (error) {
      console.error("Error fetching leave requests:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats from backend
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch total employees
        const empRes = await fetch("http://localhost:8080/api/employees", { credentials: "include" });
        console.log("Employees response status:", empRes.status);
        const empData = empRes.ok ? await empRes.json() : {};
        console.log("Employees response:", empData);
        const employees = Array.isArray(empData.data) ? empData.data : [];
        setEmployees(employees);
        console.log("Employees array:", employees);
        // Filter out System Admin
        const activeEmployees = employees.filter(emp => {
          const isSystemAdmin = (emp.role === 'ADMIN') || (emp.firstName === 'System' && emp.lastName === 'Admin');
          return !isSystemAdmin;
        });
        const totalEmployees = activeEmployees.length;

        // Fetch users to count HR and Reporting Managers
        const usersRes = await fetch("http://localhost:8080/api/users", { credentials: "include" });
        console.log("Users response status:", usersRes.status);
        const usersData = usersRes.ok ? await usersRes.json() : {};
        console.log("Users response:", usersData);
        const users = Array.isArray(usersData) ? usersData : [];
        console.log("Users array:", users);
        const hrUsers = users.filter((u) => u.role === "HR").length;
        const reportingManagers = users.filter((u) => u.role === "REPORTING_MANAGER").length;

        console.log("Stats - totalEmployees:", totalEmployees, "hrUsers:", hrUsers, "reportingManagers:", reportingManagers);

        setStats((prev) => ({
          ...prev,
          totalEmployees,
          hrUsers,
          reportingManagers,
        }));
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchStats();
    fetchLeaveRequests();
  }, []);

  const refreshData = async () => {
    // Re-run the logic from useEffect
    try {
      const empRes = await fetch("http://localhost:8080/api/employees", { credentials: "include" });
      const empData = empRes.ok ? await empRes.json() : {};
      const employees = Array.isArray(empData.data) ? empData.data : [];
      const activeEmployees = employees.filter(emp => {
        const isSystemAdmin = (emp.role === 'ADMIN') || (emp.firstName === 'System' && emp.lastName === 'Admin');
        return !isSystemAdmin;
      });

      const usersRes = await fetch("http://localhost:8080/api/users", { credentials: "include" });
      const usersData = usersRes.ok ? await usersRes.json() : {};
      const users = Array.isArray(usersData) ? usersData : [];
      const hrUsers = users.filter((u) => u.role === "HR").length;
      const reportingManagers = users.filter((u) => u.role === "REPORTING_MANAGER").length;

      setStats({
        totalEmployees: activeEmployees.length,
        hrUsers,
        pendingLeaves: pendingLeaves.length,
        reportingManagers,
      });
    } catch (err) {
      console.error("Refresh failed", err);
    }
  };

  const handleQuickAction = (action) => {
    if (action === "add-employee") {
      setIsAddEmployeeModalOpen(true);
    } else if (action === "create-hr") {
      setIsHRModalOpen(true);
    }
  };

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenReportingManagerModal = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleAddEmployeeModalClose = () => {
    setIsAddEmployeeModalOpen(false);
  };

  const handleAddReportingManagers = (selectedEmployees) => {
    // modal already persists the payload; just ensure modal is closed
    setIsModalOpen(false);
  };

  const handleHRModalClose = () => {
    setIsHRModalOpen(false);
  };

  const handleCreateHRUser = async (employee) => {
    setIsHRModalOpen(false);
    await refreshData();
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      navigate("/login");
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
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB') + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const calculateLeaveDays = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;

    let days = 0;
    let d = new Date(start);
    while (d <= end) {
      const day = d.getDay();
      if (day !== 0 && day !== 6) { // Skip Sat/Sun (0=Sun, 6=Sat)
        days++;
      }
      d.setDate(d.getDate() + 1);
    }
    return days;
  };

  const handleApprove = async (leaveId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:8080/api/leaves/${leaveId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ approverId: currentUserId })
      });

      if (response.ok) {
        alert('Leave approved successfully!');
        fetchLeaveRequests();
      } else {
        const error = await response.json();
        alert('Failed to approve leave: ' + (error.message || 'Unknown error'));
      }
    } catch (error) {
      console.error("Error approving leave:", error);
      alert('Error approving leave');
    }
  };

  const handleRejectClick = (leaveId) => {
    setRejectingLeaveId(leaveId);
    setRejectReason("");
    setShowRejectModal(true);
  };

  const handleRejectConfirm = async () => {
    if (!rejectReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:8080/api/leaves/${rejectingLeaveId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          approverId: currentUserId,
          reason: rejectReason
        })
      });

      if (response.ok) {
        alert('Leave rejected successfully!');
        setShowRejectModal(false);
        setRejectingLeaveId(null);
        setRejectReason("");
        fetchLeaveRequests();
      } else {
        const error = await response.json();
        alert('Failed to reject leave: ' + (error.message || 'Unknown error'));
      }
    } catch (error) {
      console.error("Error rejecting leave:", error);
      alert('Error rejecting leave');
    }
  };

  return (
    <>
      <div className="flex h-screen w-screen bg-[#e3edf9] flex-col md:flex-row overflow-hidden">

        {/* ================= SIDEBAR ================= */}
        <AdminSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onLogout={handleLogout}
        />

        {/* ================= MAIN CONTENT ================= */}
        <main className="flex-1 p-4 h-full overflow-hidden">

          {/* DASHBOARD */}
          {activeTab === "dashboard" && (
            <div className="flex flex-col gap-4 h-full overflow-hidden">

              {/* TOP SECTION (30%) - Quick Actions Vertical */}
              <div className="h-[30%] bg-white/40 backdrop-blur-md rounded-[32px] px-10 py-6 border border-white/50 shadow-xl shadow-brand-blue/5 overflow-hidden flex flex-col justify-center gap-6">
                <div className="flex flex-col shrink-0">
                  <h3 className="text-brand-blue text-2xl font-black leading-tight tracking-tight">Quick Actions</h3>
                  <p className="text-brand-blue/20 text-[9px] font-bold uppercase tracking-[0.2em] mt-1">Administrative provision tools</p>
                </div>

                <div className="grid grid-cols-3 gap-4 w-full">
                  <button
                    onClick={() => handleQuickAction("add-employee")}
                    className="group bg-white/90 hover:bg-brand-blue p-4 rounded-2xl flex items-center gap-4 transition-all duration-300 shadow-sm hover:shadow-xl border border-brand-blue/10 flex-1"
                  >
                    <div className="w-12 h-12 rounded-xl bg-brand-blue/5 flex items-center justify-center text-brand-blue group-hover:bg-white/10 group-hover:text-white transition-colors">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-black text-brand-blue uppercase tracking-widest group-hover:text-white leading-none">Add Employee</p>
                      <p className="text-[10px] font-bold text-brand-blue/30 uppercase tracking-widest mt-1.5 group-hover:text-white/40">New Entry</p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleQuickAction("create-hr")}
                    className="group bg-white/90 hover:bg-emerald-500 p-4 rounded-2xl flex items-center gap-4 transition-all duration-300 shadow-sm hover:shadow-xl border border-emerald-500/10 flex-1"
                  >
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/5 flex items-center justify-center text-emerald-500 group-hover:bg-white/10 group-hover:text-white transition-colors">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-black text-brand-blue uppercase tracking-widest group-hover:text-white leading-none">Add HR</p>
                      <p className="text-[10px] font-bold text-brand-blue/30 uppercase tracking-widest mt-1.5 group-hover:text-white/40">Access Level</p>
                    </div>
                  </button>

                  <button
                    onClick={handleOpenReportingManagerModal}
                    className="group bg-white/90 hover:bg-indigo-500 p-4 rounded-2xl flex items-center gap-4 transition-all duration-300 shadow-sm hover:shadow-xl border border-indigo-500/10 flex-1"
                  >
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/5 flex items-center justify-center text-indigo-500 group-hover:bg-white/10 group-hover:text-white transition-colors">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-black text-brand-blue uppercase tracking-widest group-hover:text-white leading-none">Add Reporting Manager</p>
                      <p className="text-[10px] font-bold text-brand-blue/30 uppercase tracking-widest mt-1.5 group-hover:text-white/40">Team Oversight</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* BOTTOM SECTION (70%) - Analytics & Calendar */}
              <div className="h-[70%] grid grid-cols-1 lg:grid-cols-2 gap-4 pb-2 overflow-hidden">

                {/* Pie Chart Card */}
                <div className="bg-white rounded-[32px] p-6 shadow-2xl shadow-brand-blue/5 border border-brand-blue/5 flex flex-col items-center justify-between relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-brand-blue/[0.01] rounded-bl-full pointer-events-none" />

                  <div className="w-full mb-2">
                    <h2 className="text-xl font-black text-brand-blue tracking-tight">Workforce Pulse</h2>
                    <p className="text-[9px] font-black text-brand-blue/30 uppercase tracking-[0.2em] mt-0.5">Real-time Personnel Distribution</p>
                  </div>

                  <div className="w-full flex-1 flex flex-row items-center gap-4 min-h-0">
                    <div className="flex-1 h-full relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          return (
                          <>
                            <Pie
                              data={(() => {
                                const now = new Date();
                                const isFutureMonth = currentDate.getFullYear() > now.getFullYear() ||
                                  (currentDate.getFullYear() === now.getFullYear() && currentDate.getMonth() > now.getMonth());

                                return [
                                  { name: 'HRs', value: isFutureMonth ? 0 : stats.hrUsers, color: '#1E3A8A' },
                                  { name: 'Managers', value: isFutureMonth ? 0 : stats.reportingManagers, color: '#FACC15' },
                                  { name: 'Employees', value: isFutureMonth ? 0 : Math.max(0, stats.totalEmployees - stats.hrUsers - stats.reportingManagers), color: '#1F2937' },
                                ];
                              })()}
                              innerRadius={0}
                              outerRadius="75%"
                              paddingAngle={0}
                              dataKey="value"
                              stroke="#fff"
                              strokeWidth={3}
                              labelLine={false}
                              label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name, value }) => {
                                if (value === 0) return null;
                                const radius = 55; // Slightly inward for smaller pie
                                const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                                const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                                if (percent < 0.05) return null;
                                return (
                                  <text
                                    x={x}
                                    y={y}
                                    fill="white"
                                    textAnchor="middle"
                                    dominantBaseline="central"
                                    style={{ fontSize: '12px', fontWeight: '900', fontFamily: 'Inter', textShadow: '0 2px 4px rgba(0,0,0,0.4)' }}
                                  >
                                    {`${(percent * 100).toFixed(0)}%`}
                                  </text>
                                );
                              }}
                            >
                              {[
                                { color: '#1E3A8A' },
                                { color: '#FACC15' },
                                { color: '#1F2937' },
                              ].map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                          </>
                          );
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#fff',
                              borderRadius: '20px',
                              border: 'none',
                              boxShadow: '0 25px 50px -12px rgba(30, 58, 138, 0.25)',
                              padding: '15px 20px',
                              fontWeight: '800'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Side Legend */}
                    <div className="flex flex-col gap-3 pr-10 shrink-0 min-w-[120px]">
                      {(() => {
                        const now = new Date();
                        const isFutureMonth = currentDate.getFullYear() > now.getFullYear() ||
                          (currentDate.getFullYear() === now.getFullYear() && currentDate.getMonth() > now.getMonth());

                        return [
                          { label: 'HRs', value: isFutureMonth ? 0 : stats.hrUsers, color: 'bg-[#1E3A8A]', textColor: 'text-[#1E3A8A]' },
                          { label: 'Managers', value: isFutureMonth ? 0 : stats.reportingManagers, color: 'bg-[#FACC15]', textColor: 'text-[#FACC15]' },
                          { label: 'Employees', value: isFutureMonth ? 0 : Math.max(0, stats.totalEmployees - stats.hrUsers - stats.reportingManagers), color: 'bg-[#1F2937]', textColor: 'text-[#1F2937]' },
                        ];
                      })().map((item, idx) => (
                        <div key={idx} className="bg-bg-slate/30 p-2.5 rounded-2xl flex flex-col items-start border border-brand-blue/[0.03] transition-all hover:bg-white hover:shadow-lg hover:shadow-brand-blue/5">
                          <div className="flex items-center gap-2 mb-1">
                            <div className={`w-2 h-2 rounded-full ${item.color}`} />
                            <span className={`text-[8px] font-black uppercase tracking-widest ${item.textColor}`}>{item.label}</span>
                          </div>
                          <span className="text-sm font-black text-brand-blue ml-4">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Calendar Card */}
                <div className="bg-white rounded-[32px] shadow-2xl shadow-brand-blue/5 border border-brand-blue/5 overflow-hidden flex flex-col h-full">
                  <div className="p-4 border-b border-brand-blue/5 flex items-center justify-between bg-gradient-to-r from-bg-slate/30 to-white">
                    <div>
                      <h2 className="text-lg font-black text-brand-blue tracking-tight">Absence Monitor</h2>
                      <p className="text-[9px] font-black text-brand-blue/30 uppercase tracking-[0.1em] mt-0.5">Leave Flow Management</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 bg-bg-slate/50 p-1 rounded-lg border border-brand-blue/5">
                        <button
                          onClick={() => changeMonth(-1)}
                          className="w-6 h-6 rounded-md bg-white border border-brand-blue/5 flex items-center justify-center text-brand-blue hover:bg-brand-blue hover:text-white transition-all shadow-sm active:scale-95"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <div className="px-2 text-[8px] font-black text-brand-blue uppercase tracking-widest min-w-[80px] text-center">
                          {currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </div>
                        <button
                          onClick={() => changeMonth(1)}
                          className="w-6 h-6 rounded-md bg-white border border-brand-blue/5 flex items-center justify-center text-brand-blue hover:bg-brand-blue hover:text-white transition-all shadow-sm active:scale-95"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M9 5l7 7-7 7" /></svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col overflow-hidden">
                    <div className="grid grid-cols-5 gap-2 mb-2">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(day => (
                        <div key={day} className="text-center text-[9px] font-black text-brand-blue uppercase tracking-[0.15em]">
                          {day}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-5 gap-2 flex-1 overflow-y-auto pr-1 scrollbar-hide">
                      {(() => {
                        const year = currentDate.getFullYear();
                        const month = currentDate.getMonth();
                        const firstDay = new Date(year, month, 1).getDay();
                        const daysInMonth = new Date(year, month + 1, 0).getDate();
                        const startingPadding = firstDay === 0 ? 6 : firstDay - 1;
                        const cells = [];
                        for (let i = 0; i < startingPadding; i++) {
                          const padDate = new Date(year, month, 1 - (startingPadding - i));
                          if (padDate.getDay() !== 0 && padDate.getDay() !== 6) {
                            cells.push(<div key={`pad-${i}`} className="h-12 rounded-xl bg-bg-slate/5 border border-dashed border-brand-blue/5 opacity-10" />);
                          }
                        }
                        for (let day = 1; day <= daysInMonth; day++) {
                          const dateObj = new Date(year, month, day);
                          if (dateObj.getDay() === 0 || dateObj.getDay() === 6) continue;
                          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                          const isToday = new Date().toISOString().split('T')[0] === dateStr;
                          const onLeave = calendarData[dateStr] || [];
                          const leaveCount = onLeave.length;
                          cells.push(
                            <div
                              key={day}
                              onMouseEnter={(e) => {
                                if (leaveCount > 0) {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  setHoveredLeaveData({ data: onLeave, rect });
                                }
                              }}
                              onMouseLeave={() => setHoveredLeaveData(null)}
                              className={`h-12 rounded-xl border transition-all p-1.5 flex flex-col items-center justify-center relative group ${isToday ? "bg-brand-blue/5 border-brand-blue ring-2 ring-brand-blue/10 shadow-lg z-10" : ""} ${leaveCount > 0 ? "bg-white border-brand-yellow/50 shadow-lg cursor-pointer" : "bg-bg-slate/30 border-transparent hover:bg-white hover:border-brand-blue/10"}`}
                            >
                              <span className={`text-xs font-black ${isToday ? "text-brand-blue" : leaveCount > 0 ? "text-brand-blue" : "text-brand-blue/60"}`}>{day}</span>
                              {leaveCount > 0 && (
                                <div className="absolute top-1 right-1">
                                  <div className="w-1 h-1 rounded-full bg-brand-yellow animate-pulse" />
                                </div>
                              )}
                              {leaveCount > 0 && (
                                <div className="mt-0.5 px-1 py-0 bg-brand-blue/5 rounded">
                                  <span className="text-[6px] font-black text-brand-blue">{leaveCount} LEAVE</span>
                                </div>
                              )}
                            </div>
                          );
                        }
                        return cells;
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "leave-requests" && (
            <div className="flex flex-col gap-6 h-full overflow-y-auto pr-2 scrollbar-hide">
              {/* Header with Search and Role Filter */}
              <div className="bg-white rounded-[24px] p-6 shadow-xl border border-brand-blue/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-brand-blue tracking-tight">Leave Records</h2>
                  <p className="text-[10px] font-black text-brand-blue/30 uppercase tracking-[0.2em] mt-1">Enterprise Personnel Management</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Search */}
                  <div className="relative group w-full sm:w-64">
                    <input
                      type="text"
                      placeholder="Search member..."
                      value={leaveSearch}
                      onChange={(e) => setLeaveSearch(e.target.value)}
                      className="w-full h-[47px] bg-bg-slate/50 border-2 border-transparent focus:border-brand-yellow rounded-2xl px-5 pl-10 text-sm font-bold text-brand-blue outline-none transition-all"
                    />
                    <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-brand-blue/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>

                  {/* Role Filter */}
                  <div className="flex bg-bg-slate/50 p-1.5 rounded-2xl w-full sm:w-auto overflow-x-auto scrollbar-hide">
                    {["ALL", "HR", "OTHERS"].map((role) => (
                      <button
                        key={role}
                        onClick={() => setLeaveRoleFilter(role)}
                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${leaveRoleFilter === role
                          ? "bg-brand-blue text-white shadow-lg active"
                          : "text-brand-blue/40 hover:text-brand-blue hover:bg-white"
                          }`}
                      >
                        {role === "OTHERS" ? "OTHER DEPARTMENTS" : role}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Leave Table Container */}
              <div className="bg-white rounded-[32px] shadow-2xl shadow-brand-blue/5 border border-brand-blue/5 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse border-spacing-0">
                    <thead>
                      <tr className="bg-brand-blue/[0.02]">
                        <th className="py-5 px-8 text-[11px] font-black uppercase tracking-[0.15em] text-brand-blue/40 border-b border-brand-blue/5">Record ID</th>
                        <th className="py-5 px-6 text-[11px] font-black uppercase tracking-[0.15em] text-brand-blue/40 border-b border-brand-blue/5">Requester Identity</th>
                        <th className="py-5 px-6 text-[11px] font-black uppercase tracking-[0.15em] text-brand-blue/40 border-b border-brand-blue/5">Leave Category</th>
                        <th className="py-5 px-6 text-[11px] font-black uppercase tracking-[0.15em] text-brand-blue/40 border-b border-brand-blue/5">Reason</th>
                        <th className="py-5 px-6 text-[11px] font-black uppercase tracking-[0.15em] text-brand-blue/40 border-b border-brand-blue/5 text-center">Duration</th>
                        <th className="py-5 px-6 text-[11px] font-black uppercase tracking-[0.15em] text-brand-blue/40 border-b border-brand-blue/5 text-center">Status</th>
                        <th className="py-5 px-8 text-[11px] font-black uppercase tracking-[0.15em] text-brand-blue/40 border-b border-brand-blue/5 text-right">Decision Control</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-blue/5">
                      {loading ? (
                        <tr>
                          <td colSpan={7} className="py-20 text-center text-brand-blue/30 font-bold uppercase tracking-widest text-xs animate-pulse">Syncing Personnel Records...</td>
                        </tr>
                      ) : (() => {
                        const filtered = leaveRequests.filter(lv => {
                          const matchesSearch = !leaveSearch || (lv.employeeName && lv.employeeName.toLowerCase().includes(leaveSearch.toLowerCase()));

                          if (leaveRoleFilter === "ALL") return matchesSearch;

                          // Find employee for role check
                          const emp = employees.find(e => e.id === lv.employeeId || e.fullName === lv.employeeName);
                          const isHR = emp?.role === "HR";

                          if (leaveRoleFilter === "HR") return matchesSearch && isHR;
                          if (leaveRoleFilter === "OTHERS") return matchesSearch && !isHR;

                          return matchesSearch;
                        });

                        if (filtered.length === 0) {
                          return (
                            <tr>
                              <td colSpan={7} className="py-32 text-center italic text-brand-blue/20 font-bold uppercase tracking-widest text-xs">
                                No leave transactions recorded in audit
                              </td>
                            </tr>
                          );
                        }

                        return filtered.map((leave) => (
                          <tr key={leave.id} className="group hover:bg-bg-slate/40 transition-all duration-300">
                            <td className="py-5 px-8">
                              <span className="text-[10px] font-black text-brand-blue/40 uppercase tracking-widest">#{leave.id}</span>
                            </td>
                            <td className="py-5 px-6">
                              <div className="flex flex-col">
                                <span className="text-sm font-black text-brand-blue tracking-tight uppercase">{leave.employeeName}</span>
                                <span className="text-[8px] font-black text-brand-blue/20 uppercase tracking-[0.2em] mt-0.5">ID: {(() => {
                                  const emp = employees.find(e => e.id === leave.employeeId || e.fullName === leave.employeeName);
                                  return emp?.officeId || leave.employeeId;
                                })()}</span>
                              </div>
                            </td>
                            <td className="py-5 px-6">
                              <span className="px-3 py-1 bg-brand-blue/5 text-brand-blue text-[9px] font-black uppercase tracking-widest rounded-lg border border-brand-blue/10">
                                {leave.leaveType}
                              </span>
                            </td>
                            <td className="py-5 px-6">
                              <div className="flex flex-col bg-bg-slate/50 p-2 rounded-xl border border-brand-blue/[0.03] max-w-[150px]">
                                <span className="text-[9px] font-black text-brand-blue tracking-tight">{leave.reason || "-"}</span>
                              </div>
                            </td>
                            <td className="py-5 px-6 text-center">
                              <div className="flex flex-col items-center">
                                <span className="text-[10px] font-black text-brand-blue">{formatDate(leave.startDate)}</span>
                                <span className="text-[8px] font-black text-brand-blue/20 uppercase my-0.5">through</span>
                                <span className="text-[10px] font-black text-brand-blue">{formatDate(leave.endDate)}</span>
                                <span className="mt-1.5 px-2 py-0.5 bg-brand-yellow text-brand-blue text-[8px] font-black rounded-md">{calculateLeaveDays(leave.startDate, leave.endDate)} Days</span>
                              </div>
                            </td>
                            <td className="py-5 px-6 text-center">
                              <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm transition-all ${leave.status === 'PENDING'
                                ? 'bg-brand-yellow/10 text-brand-yellow-dark border-brand-yellow/20'
                                : leave.status === 'APPROVED'
                                  ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                  : 'bg-red-50 text-red-600 border-red-100'
                                }`}>
                                {leave.status}
                              </span>
                            </td>
                            <td className="py-5 px-8 text-right">
                              {leave.status === 'PENDING' ? (
                                <div className="flex justify-end gap-2 scale-90 md:scale-100 origin-right transition-all">
                                  <button
                                    onClick={() => handleApprove(leave.id)}
                                    className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-md active:scale-95 flex items-center gap-2"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleRejectClick(leave.id)}
                                    className="px-4 py-2 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-md active:scale-95 flex items-center gap-2"
                                  >
                                    Reject
                                  </button>
                                </div>
                              ) : (
                                <div className="flex flex-col items-end text-right">
                                  <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm transition-all ${leave.status === 'APPROVED'
                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                    : 'bg-red-50 text-red-600 border-red-100'
                                    }`}>
                                    {leave.status}
                                  </span>
                                  <div className="mt-2 flex flex-col items-end">
                                    <span className="text-[8px] font-black text-brand-blue/30 uppercase tracking-widest">
                                      By: {leave.approvedBy || "System"}
                                    </span>
                                    <span className="text-[8px] font-bold text-brand-blue/20 uppercase tracking-widest leading-none mt-0.5">
                                      {formatDateTime(leave.reviewedAt)}
                                    </span>
                                  </div>
                                  {leave.status === 'REJECTED' && leave.rejectionReason && (
                                    <span className="text-[9px] text-red-400 font-bold truncate max-w-[150px] mt-1">{leave.rejectionReason}</span>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "hr-team" && (
            <div className="flex flex-col gap-8 h-full overflow-y-auto pr-2 scrollbar-hide">
              <div className="bg-white rounded-[32px] p-8 shadow-2xl shadow-brand-blue/5 border border-brand-blue/[0.02]">
                <h2 className="text-2xl font-black text-brand-blue tracking-tight">HR Operations Registry</h2>
                <p className="text-[10px] font-black text-brand-blue/20 uppercase tracking-[0.4em] mt-1.5 leading-none">Global Personnel Access Control</p>
              </div>
              <HRTeamDisplay />
            </div>
          )}

          {activeTab === "settings" && (
            <div className="flex flex-col gap-6 h-full overflow-y-auto pr-2 scrollbar-hide pb-10">
              {/* Settings Header */}
              <div className="bg-white rounded-[32px] p-8 shadow-2xl shadow-brand-blue/5 border border-brand-blue/[0.02]">
                <h2 className="text-2xl font-black text-brand-blue tracking-tight">System Control Center</h2>
                <p className="text-[10px] font-black text-brand-blue/20 uppercase tracking-[0.4em] mt-1.5 leading-none">Global Infrastructure & Policy Management</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* System Health Column */}
                <div className="lg:col-span-1 space-y-6">
                  <div className="bg-brand-blue rounded-[32px] p-6 shadow-2xl shadow-brand-blue/20 text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full transition-transform group-hover:scale-150 duration-700" />
                    <h3 className="text-xs font-black uppercase tracking-widest opacity-60 mb-4">Core Integrity</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold opacity-80">Server Latency</span>
                        <span className="text-sm font-black text-brand-yellow">14ms</span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-yellow w-[92%] animate-pulse" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold opacity-80">Database Health</span>
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-[11px] font-black uppercase">Optimal</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-[32px] p-6 shadow-xl border border-brand-blue/5">
                    <h3 className="text-[10px] font-black text-brand-blue/30 uppercase tracking-[0.2em] mb-4">Storage Metrics</h3>
                    <div className="flex items-end gap-2 mb-2">
                      <span className="text-2xl font-black text-brand-blue">1.2</span>
                      <span className="text-xs font-bold text-brand-blue/40 pb-1">TB Used</span>
                    </div>
                    <div className="w-full h-2 bg-bg-slate rounded-full overflow-hidden">
                      <div className="h-full bg-brand-blue w-[64%] rounded-full shadow-[0_0_15px_rgba(30,58,138,0.3)]" />
                    </div>
                  </div>
                </div>

                {/* Main Settings Panel */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white rounded-[32px] p-8 shadow-xl border border-brand-blue/5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Security Hub */}
                      <div className="space-y-6">
                        <h4 className="flex items-center gap-2 text-sm font-black text-brand-blue uppercase tracking-widest">
                          <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500">
                            <ShieldCheck size={18} />
                          </div>
                          Security Hub
                        </h4>
                        <div className="space-y-4">
                          {[
                            { label: "Biometric 2FA", desc: "Require fingerprint for HR actions", enabled: true },
                            { label: "IP Restriction", desc: "Whitlelist corporate network IPs", enabled: false },
                            { label: "Audit Logging", desc: "Trace all personnel record changes", enabled: true },
                          ].map((item, i) => (
                            <div key={i} className="flex items-center justify-between group p-3 rounded-2xl hover:bg-bg-slate/50 transition-all border border-transparent hover:border-brand-blue/5">
                              <div>
                                <p className="text-[11px] font-black text-brand-blue uppercase tracking-tight">{item.label}</p>
                                <p className="text-[9px] font-bold text-brand-blue/30 mt-0.5">{item.desc}</p>
                              </div>
                              <button className={`w-10 h-5 rounded-full transition-all flex items-center px-1 ${item.enabled ? 'bg-emerald-500 justify-end' : 'bg-bg-slate justify-start'}`}>
                                <div className="w-3.5 h-3.5 bg-white rounded-full shadow-sm" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Workspace Preferences */}
                      <div className="space-y-6">
                        <h4 className="flex items-center gap-2 text-sm font-black text-brand-blue uppercase tracking-widest">
                          <div className="w-8 h-8 rounded-lg bg-brand-blue/5 flex items-center justify-center text-brand-blue">
                            <Settings2 size={18} />
                          </div>
                          Workspace
                        </h4>
                        <div className="space-y-4">
                          <div className="p-4 bg-bg-slate/30 rounded-2xl border border-brand-blue/5">
                            <p className="text-[10px] font-black text-brand-blue/40 uppercase mb-3">Enterprise Theme</p>
                            <div className="flex gap-2">
                              {['#1E3A8A', '#10B981', '#6366F1', '#F59E0B'].map(color => (
                                <button key={color} className="w-8 h-8 rounded-xl ring-2 ring-white shadow-md active:scale-95 transition-transform" style={{ backgroundColor: color }} />
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center justify-between p-3">
                            <div>
                              <p className="text-[11px] font-black text-brand-blue uppercase">Global Maintenance</p>
                              <p className="text-[9px] font-bold text-brand-blue/30 mt-0.5">Toggle portal access for employees</p>
                            </div>
                            <button className="w-10 h-5 bg-bg-slate rounded-full px-1 flex items-center">
                              <div className="w-3.5 h-3.5 bg-white rounded-full" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* System Actions Footer */}
                  <div className="flex gap-4">
                    <button className="flex-1 bg-brand-blue text-white py-4 rounded-[20px] text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-brand-blue/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                      Synchronize Cloud Records
                    </button>
                    <button className="px-8 bg-white border border-brand-blue/10 text-brand-blue/40 py-4 rounded-[20px] text-xs font-black uppercase tracking-widest hover:text-brand-blue transition-all group">
                      Export Audit Trail
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CANDIDATES TAB (Placeholder) */}
          {activeTab === "candidates" && (
            <div className="bg-white rounded-2xl p-10 text-xl font-bold text-center">
              CANDIDATES PAGE
            </div>
          )}
        </main >
      </div >

      {/* Reject Reason Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Reject Leave Request</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-red-500"
              rows="4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectingLeaveId(null);
                  setRejectReason("");
                }}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      <EmployeeSelectorModal
        open={isModalOpen}
        onClose={handleModalClose}
        onSave={handleAddReportingManagers}
      />

      <AddEmployeeModal
        open={isAddEmployeeModalOpen}
        onClose={handleAddEmployeeModalClose}
        onEmployeeCreated={refreshData}
      />

      <HRSelectorModal
        open={isHRModalOpen}
        onClose={handleHRModalClose}
        onSave={handleCreateHRUser}
      />
      {/* OPTIONAL: Render Tooltip via Portal or Fixed Position at the root level */}
      {hoveredLeaveData && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            top: hoveredLeaveData.rect.top - 10,
            left: hoveredLeaveData.rect.left + hoveredLeaveData.rect.width / 2,
            transform: "translate(-50%, -100%)",
          }}
        >
          <div className="w-48 bg-brand-blue rounded-2xl p-4 shadow-2xl relative">
            {/* Arrow */}
            <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-brand-blue rotate-45 transform origin-center" />

            <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-2 text-center">Personnel Out Today</p>
            <div className="space-y-1.5">
              {hoveredLeaveData.data.map((name, idx) => (
                <div key={idx} className="flex items-center gap-2 px-2 py-1 bg-white/5 rounded-lg">
                  <div className="w-1 h-1 rounded-full bg-brand-yellow" />
                  <span className="text-[9px] font-bold text-white whitespace-nowrap">{name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

