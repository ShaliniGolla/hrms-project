import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import useEmployees from "../../hooks/useEmployees";

export default function HrCandidatesPage() {
  const { employees, loading, error } = useEmployees();
  const [localEmployees, setLocalEmployees] = useState([]);
  const [assignmentsMap, setAssignmentsMap] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState("candidates");
  const [user, setUser] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user")) || {};
    setUser(userData);
  }, []);

  useEffect(() => {
    setLocalEmployees(employees || []);
  }, [employees]);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const res = await fetch("http://localhost:8080/api/reporting-managers/assignments", { credentials: "include" });
        if (!res.ok) return;
        const list = await res.json();
        const map = {};
        (list || []).forEach((it) => {
          if (it && it.employeeId) {
            map[it.employeeId] = {
              managerName: it.reportingManagerName || null,
              managerEmail: it.reportingManagerEmail || null,
              managerRole: it.reportingManagerRole || null,
              hrName: it.hrName || null,
              hrRole: it.hrRole || null,
            };
          }
        });
        setAssignmentsMap(map);
      } catch (e) {
        console.error("Failed to load assignments", e);
      }
    };

    fetchAssignments();
  }, []);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      navigate("/login");
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredEmployees = (localEmployees || []).filter((emp) => {
    const fullName = `${emp.firstName || ""} ${emp.lastName || ""}`.toLowerCase();
    const email = (emp.email || "").toLowerCase();
    const id = emp.id ? String(emp.id) : "";
    const oryfolksId = emp.oryfolksId ? String(emp.oryfolksId).toLowerCase() : "";
    const corporateEmail = (emp.corporateEmail || "").toLowerCase();
    const term = searchTerm.toLowerCase();
    const isSystemAdmin = (emp.role === 'ADMIN') || (emp.firstName === 'System' && emp.lastName === 'Admin');
    if (isSystemAdmin) return false;

    return (
      id.includes(term) ||
      oryfolksId.includes(term) ||
      fullName.includes(term) ||
      email.includes(term) ||
      corporateEmail.includes(term)
    );
  });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
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
    <div className="flex h-screen bg-bg-slate font-brand text-brand-blue overflow-hidden">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        handleLogout={handleLogout}
        navItems={navItems}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Premium Header */}
        <header className="bg-brand-blue text-white p-6 md:px-10 flex items-center justify-between shadow-lg z-10">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-brand-yellow rounded-full flex items-center justify-center text-brand-blue shadow-inner border-2 border-white/20 overflow-hidden text-xl font-bold">
              {user.photoPath ? (
                <img src={user.photoPath} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                (user.firstName?.[0] || user.fullName?.[0]) || "H"
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Personnel Candidates</h1>
              <p className="text-xs text-white/50 uppercase tracking-[0.2em] font-bold mt-1">
                {user.designation || "Human Resources Operations"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Search Bar in Header Top Right */}
            <div className="hidden md:flex items-center bg-white/10 border border-white/20 rounded-2xl px-4 py-2 w-64 focus-within:w-80 focus-within:bg-white/20 transition-all duration-300">
              <svg className="w-4 h-4 text-white/40 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                className="bg-transparent border-none outline-none text-xs text-white placeholder-white/40 w-full font-bold"
                placeholder="Search candidates..."
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-3 md:p-6 flex flex-col space-y-4">
          <div className="bg-white rounded-[32px] shadow-2xl shadow-brand-blue/5 border border-brand-blue/5 overflow-hidden flex flex-col">
            <div className="p-5 border-b border-brand-blue/5 flex items-center justify-between bg-bg-slate/30">
              <div>
                <h2 className="text-2xl font-black text-brand-blue tracking-tight">Active Candidates</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-brand-blue/5 text-brand-blue px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                  {filteredEmployees.length} Resources
                </span>
              </div>
            </div>

            <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-210px)] scrollbar-hide">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-32 space-y-4 opacity-30">
                  <div className="w-12 h-12 border-4 border-brand-blue border-t-transparent rounded-full animate-spin" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-brand-blue">Syncing Database...</p>
                </div>
              ) : error ? (
                <div className="py-20 text-center">
                  <p className="text-red-500 font-bold">{error}</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse border-spacing-0">
                  <thead>
                    <tr className="bg-brand-blue/[0.02]">
                      <th className="py-5 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-brand-blue/40 border-b border-brand-blue/5">Record ID</th>
                      <th className="py-5 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-brand-blue/40 border-b border-brand-blue/5">Member Name</th>
                      <th className="py-5 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-brand-blue/40 border-b border-brand-blue/5">Corporate Role</th>
                      <th className="py-5 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-brand-blue/40 border-b border-brand-blue/5">Manager Liaison</th>
                      <th className="py-5 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-brand-blue/40 border-b border-brand-blue/5">HR Coordinator</th>
                      <th className="py-5 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-brand-blue/40 border-b border-brand-blue/5">Corporate Email</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-blue/5">
                    {filteredEmployees.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-20 text-center italic text-brand-blue/20 font-bold uppercase tracking-widest text-xs">
                          No personnel found matching search criteria
                        </td>
                      </tr>
                    ) : (
                      filteredEmployees.map((emp) => (
                        <tr
                          key={emp.id}
                          className="group hover:bg-bg-slate/50 transition-all cursor-pointer"
                          onClick={() => navigate(`/admin/employee/${emp.id}`, { state: emp })}
                        >
                          <td className="py-5 px-8">
                            <span className="text-xs font-black text-brand-blue/30 group-hover:text-brand-blue">
                              {emp.oryfolksId || "PENDING"}
                            </span>
                          </td>
                          <td className="py-5 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 bg-brand-blue/5 rounded-xl flex items-center justify-center text-[10px] font-black text-brand-blue group-hover:bg-brand-blue group-hover:text-white transition-all shadow-sm">
                                {(emp.firstName?.[0] || emp.lastName?.[0] || 'U')}
                              </div>
                              <span className="text-sm font-bold text-brand-blue tracking-tight">
                                {`${emp.firstName || ""} ${emp.lastName || ""}`}
                              </span>
                            </div>
                          </td>
                          <td className="py-5 px-6">
                            <span className="px-3 py-1 bg-brand-yellow/10 text-brand-blue text-[9px] font-black uppercase tracking-widest rounded-full border border-brand-yellow/20">
                              {emp.role || 'Personnel'}
                            </span>
                          </td>
                          <td className="py-5 px-6">
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-brand-blue/60 tabular-nums lowercase first-letter:uppercase">
                                {assignmentsMap[emp.id]?.managerName || 'Unassigned'}
                              </span>
                              <span className="text-[9px] font-black text-brand-blue/10 uppercase tracking-[0.1em]">Reporting Authority</span>
                            </div>
                          </td>
                          <td className="py-5 px-6 text-xs font-bold text-brand-blue/60">
                            {assignmentsMap[emp.id]?.hrName || '–'}
                          </td>
                          <td className="py-5 px-8">
                            <span className="text-xs font-bold text-brand-blue/40 group-hover:text-brand-blue transition-colors underline decoration-brand-blue/5 decoration-2 underline-offset-4 line-clamp-1">
                              {emp.corporateEmail || "await@provisioning.org"}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>

        </div>

        {toast && (
          <div className={`fixed top-6 right-6 z-50 px-6 py-3 rounded-2xl shadow-2xl font-black text-[10px] uppercase tracking-widest animate-in slide-in-from-right duration-300 ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
            {toast.message}
          </div>
        )}
      </main>
    </div>
  );
}
