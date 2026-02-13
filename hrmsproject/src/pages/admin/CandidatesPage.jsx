import React, { useEffect, useState } from "react";
import AdminSidebar from "../../components/AdminSidebar";
import { useNavigate } from "react-router-dom";
import useEmployees from "../../hooks/useEmployees";

export default function CandidatesPage() {
  const { employees, loading, error, refresh } = useEmployees();
  const [localEmployees, setLocalEmployees] = useState([]);
  const [assignmentsMap, setAssignmentsMap] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [toast, setToast] = useState(null);
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

  const handleDelete = async (empId, e) => {
    e && e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this employee?")) return;
    try {
      const res = await fetch(`http://localhost:8080/api/employees/${empId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to delete");
      }
      setLocalEmployees((prev) => prev.filter((p) => p.id !== empId));
      showToast("Employee deleted successfully", "success");
    } catch (err) {
      console.error(err);
      showToast(err.message || "Failed to delete employee", "error");
    }
  };

  return (
    <div className="flex h-screen w-screen bg-[#e3edf9] flex-col md:flex-row overflow-hidden font-brand text-brand-blue">
      {/* Sidebar */}
      <AdminSidebar
        activeTab="candidates"
        setActiveTab={() => { }}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Premium Header */}
        <header className="bg-brand-blue text-white p-6 md:px-10 flex items-center justify-between shadow-lg z-10">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-brand-yellow rounded-full flex items-center justify-center text-brand-blue shadow-inner border-2 border-white/20 overflow-hidden text-xl font-bold">
              {user.photoPath ? (
                <img src={user.photoPath} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                (user.firstName?.[0] || user.fullName?.[0]) || "A"
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Candidates Directory</h1>
              <p className="text-xs text-white/50 uppercase tracking-[0.2em] mt-1 font-bold">
                Resource Infrastructure Audit
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
                placeholder="Search resources..."
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
          </div>
        </header>

        <div className="flex-1 p-3 md:p-6 space-y-4 overflow-y-auto flex flex-col">
          {/* Table Container */}
          <div className="bg-white rounded-[32px] shadow-2xl shadow-brand-blue/5 border border-brand-blue/5 overflow-hidden flex flex-col">
            <div className="p-5 border-b border-brand-blue/5 flex items-center justify-between bg-bg-slate/30">
              <div>
                <h2 className="text-2xl font-black text-brand-blue tracking-tight">Employee Registry</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-brand-blue/5 text-brand-blue px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                  {filteredEmployees.length} Total Records
                </span>
              </div>
            </div>

            <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-210px)] scrollbar-hide">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-32 space-y-4 opacity-30">
                  <div className="w-12 h-12 border-4 border-brand-blue border-t-transparent rounded-full animate-spin" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Synchronizing Database...</p>
                </div>
              ) : error ? (
                <div className="py-20 text-center">
                  <p className="text-red-500 font-bold">{error}</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse border-spacing-0">
                  <thead>
                    <tr className="bg-brand-blue/[0.02]">
                      <th className="py-5 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-brand-blue/40 border-b border-brand-blue/5">EMP ID</th>
                      <th className="py-5 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-brand-blue/40 border-b border-brand-blue/5">Member Identity</th>
                      <th className="py-5 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-brand-blue/40 border-b border-brand-blue/5">Professional Role</th>
                      <th className="py-5 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-brand-blue/40 border-b border-brand-blue/5">Hierarchy Lead</th>
                      <th className="py-5 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-brand-blue/40 border-b border-brand-blue/5">HR Liaison</th>
                      <th className="py-5 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-brand-blue/40 border-b border-brand-blue/5">Communication</th>
                      <th className="py-5 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-brand-blue/40 border-b border-brand-blue/5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-blue/5">
                    {filteredEmployees.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-20 text-center italic text-brand-blue/20 font-bold uppercase tracking-widest text-xs">
                          No matching personnel found in directory
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
                            <span className="text-xs font-black text-brand-blue/30 group-hover:text-brand-blue transition-colors">
                              {emp.oryfolksId || "PENDING"}
                            </span>
                          </td>
                          <td className="py-5 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 bg-brand-blue/5 rounded-xl flex items-center justify-center text-[11px] font-black text-brand-blue group-hover:bg-brand-blue group-hover:text-white transition-all shadow-sm">
                                {(emp.firstName?.[0] || "U")}
                              </div>
                              <span className="text-sm font-bold text-brand-blue tracking-tight">
                                {`${emp.firstName || ""} ${emp.lastName || ""}`}
                              </span>
                            </div>
                          </td>
                          <td className="py-5 px-6">
                            <span className="inline-flex px-3 py-1 bg-brand-yellow/10 text-brand-blue text-[9px] font-black uppercase tracking-widest rounded-full border border-brand-yellow/20">
                              {emp.role || 'Personnel'}
                            </span>
                          </td>
                          <td className="py-5 px-6">
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-brand-blue/60 tabular-nums uppercase tracking-tight">
                                {assignmentsMap[emp.id]?.managerName || 'Unassigned'}
                              </span>
                              {assignmentsMap[emp.id]?.managerName && (
                                <span className="text-[9px] font-bold text-brand-blue/20 uppercase tracking-widest">Structural Lead</span>
                              )}
                            </div>
                          </td>
                          <td className="py-5 px-6">
                            <span className="text-xs font-bold text-brand-blue/60 tabular-nums">
                              {assignmentsMap[emp.id]?.hrName || '–'}
                            </span>
                          </td>
                          <td className="py-5 px-6">
                            <span className="text-xs font-bold text-brand-blue/40 group-hover:text-brand-blue/70 transition-colors tabular-nums underline decoration-brand-blue/5 decoration-2 underline-offset-4">
                              {emp.corporateEmail || "Await Provision"}
                            </span>
                          </td>
                          <td className="py-5 px-8 text-center">
                            <button
                              onClick={(e) => handleDelete(emp.id, e)}
                              className="p-2.5 bg-red-50 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                              title="Terminate Record"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
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
      </main>

      {toast && (
        <div className={`fixed top-6 right-6 z-[100] px-6 py-3 rounded-2xl shadow-2xl font-black text-[10px] uppercase tracking-widest animate-in slide-in-from-right duration-300 ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
