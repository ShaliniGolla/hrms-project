import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from '../assets/ORYFOLKS-logo.png';
import {
  LayoutDashboard,
  Users,
  UsersRound,
  ShieldCheck,
  CalendarDays,
  Settings2,
  LogOut,
  Clock
} from 'lucide-react';

export default function AdminSidebar({ activeTab, setActiveTab, onLogout }) {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const user = JSON.parse(localStorage.getItem("user")) || {};
  const isManager = user.role === "REPORTING_MANAGER";

  const handleTabClick = (tab) => {
    if (setActiveTab) setActiveTab(tab);
    if (tab === "dashboard" || tab === "hr-team" || tab === "leave-requests" || tab === "settings") {
      navigate(isManager ? "/reporting-dashboard" : "/admin", { state: { tab } });
    }
    else if (tab === "candidates" || tab === "team") navigate(isManager ? "/reporting-team" : "/admin/candidates");
    else if (tab === "reporting-managers") navigate("/admin/reporting-managers");
    else if (tab === "timesheets") navigate("/admin/timesheets");
    setMobileOpen(false);
  };

  const navLinks = isManager
    ? [
      { id: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
      { id: "team", label: "My Team", Icon: Users }
    ]
    : [
      { id: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
      { id: "candidates", label: "Candidates", Icon: Users },
      { id: "reporting-managers", label: "Managers", Icon: UsersRound },
      { id: "hr-team", label: "HR Team", Icon: ShieldCheck },
      { id: "leave-requests", label: "Leaves", Icon: CalendarDays },
      { id: "timesheets", label: "Timesheets", Icon: Clock },
      { id: "settings", label: "Settings", Icon: Settings2 }
    ];

  // Mobile hamburger (fixed) — hide when drawer open
  return (
    <>
      <button
        className={`md:hidden fixed top-4 left-4 z-50 bg-brand-yellow text-brand-blue rounded-md p-2 ${mobileOpen ? 'hidden' : 'block shadow-md'}`}
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
      >
        ☰
      </button>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="w-[277px] bg-brand-blue text-white h-full p-6 shadow-2xl">
            <button
              className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-colors"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
            >
              ✕
            </button>
            <div className="text-center mb-4 pt-4">
              <img src={Logo} alt="ORYFOLKS Logo" className="h-16 w-16 mx-auto mb-2 rounded-full object-contain bg-white p-1" />
              <h1 className="text-xl font-bold">
                {(JSON.parse(localStorage.getItem("user"))?.firstName)
                  ? `${JSON.parse(localStorage.getItem("user")).firstName} ${JSON.parse(localStorage.getItem("user")).lastName}`
                  : "Admin User"}
              </h1>
              <p className="text-sm opacity-60 uppercase tracking-widest mt-1">
                {JSON.parse(localStorage.getItem("user"))?.designation || JSON.parse(localStorage.getItem("user"))?.role || 'Administrator'}
              </p>
            </div>

            <nav className="flex flex-col gap-2">
              {navLinks.map(({ id, label, Icon }) => (
                <div
                  key={id}
                  onClick={() => handleTabClick(id)}
                  className={`btn-sidebar flex items-center gap-3 transition-colors ${activeTab === id
                    ? 'btn-sidebar-active'
                    : 'text-white/60 hover:text-brand-yellow'
                    }`}
                >
                  <Icon size={18} className={activeTab === id ? 'text-brand-blue' : 'inherit'} />
                  <span className="font-semibold">{label}</span>
                </div>
              ))}
            </nav>

            <div className="mt-auto pt-6">
              <button
                onClick={() => { onLogout(); setMobileOpen(false); }}
                className="w-full bg-brand-yellow/10 border border-brand-yellow/20 text-brand-yellow py-3 rounded-xl text-lg font-bold hover:bg-brand-yellow hover:text-brand-blue transition-all flex items-center justify-center gap-2"
              >
                <LogOut size={20} />
                Logout
              </button>
            </div>
          </div>
          <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      <aside className="hidden md:flex md:w-[277px] w-full bg-brand-blue text-white flex-col flex-shrink-0 shadow-xl z-20">
        <div className="p-6 text-center border-b border-white/5 flex flex-col items-center">
          <div className="flex flex-col items-center w-full">
            <img src={Logo} alt="ORYFOLKS Logo" className="h-11 mb-2 object-contain" />
            <h1 className="text-lg font-bold">
              {(JSON.parse(localStorage.getItem("user"))?.firstName)
                ? `${JSON.parse(localStorage.getItem("user")).firstName} ${JSON.parse(localStorage.getItem("user")).lastName}`
                : "Admin User"}
            </h1>
            <p className="text-[10px] opacity-40 uppercase tracking-[0.2em] mt-1 font-bold">
              {JSON.parse(localStorage.getItem("user"))?.designation || JSON.parse(localStorage.getItem("user"))?.role || 'Administrator'}
            </p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {navLinks.map(({ id, label, Icon }) => (
            <div
              key={id}
              onClick={() => handleTabClick(id)}
              className={`btn-sidebar flex items-center gap-3 transition-colors ${activeTab === id
                ? 'btn-sidebar-active'
                : 'text-white/60 hover:text-brand-yellow'
                }`}
            >
              <Icon size={18} className={activeTab === id ? 'text-brand-blue' : 'inherit'} />
              <span className="font-semibold tracking-tight">{label}</span>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button
            onClick={onLogout}
            className="w-full bg-brand-yellow/10 border border-brand-yellow/20 text-brand-yellow py-3 rounded-xl text-sm font-bold hover:bg-brand-yellow hover:text-brand-blue transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <LogOut size={16} />
            LOGOUT
          </button>
        </div>
      </aside>
    </>
  );
}


