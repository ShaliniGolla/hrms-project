import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import AddEmployeeModal from "../../components/AddEmployeeModal";
import EmployeeSelectorModal from "../../components/EmployeeSelectorModal";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const HrActions = () => {
	const navigate = useNavigate();
	const [activeTab, setActiveTab] = useState("dashboard");
	const [user, setUser] = useState({});

	// Stats State
	const [stats, setStats] = useState({
		totalEmployees: 0,
		hrUsers: 0,
		reportingManagers: 0,
		pendingLeaves: 0,
	});

	const [loading, setLoading] = useState(false);

	// Modals State
	const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false);
	const [isModalOpen, setIsModalOpen] = useState(false);

	// Calendar State
	const [currentDate, setCurrentDate] = useState(new Date());
	const [calendarData, setCalendarData] = useState({});
	const [hoveredLeaveData, setHoveredLeaveData] = useState(null);

	// Fetch User Data
	useEffect(() => {
		const userData = JSON.parse(localStorage.getItem("user")) || {};
		setUser(userData);
		fetchDashboardData();
	}, []);

	// Fetch Calendar Data
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

	const fetchDashboardData = async () => {
		setLoading(true);
		try {
			const token = localStorage.getItem("token");

			// 1. Fetch Employees
			const empRes = await fetch("http://localhost:8080/api/employees", { credentials: "include" });
			const empData = empRes.ok ? await empRes.json() : {};
			const employees = Array.isArray(empData.data) ? empData.data : [];
			const activeEmployees = employees.filter(emp => {
				const isSystemAdmin = (emp.role === 'ADMIN') || (emp.firstName === 'System' && emp.lastName === 'Admin');
				return !isSystemAdmin;
			});

			// 2. Fetch Users to count HR & Reporting Managers
			const usersRes = await fetch("http://localhost:8080/api/users", { credentials: "include" });
			const usersData = usersRes.ok ? await usersRes.json() : {};
			const users = Array.isArray(usersData) ? usersData : [];
			const hrUsers = users.filter((u) => u.role === "HR").length;
			const reportingManagers = users.filter((u) => u.role === "REPORTING_MANAGER").length;

			setStats({
				totalEmployees: activeEmployees.length,
				hrUsers,
				reportingManagers,
				pendingLeaves: 0, // HR Actions dashboard doesn't need to show pending leaves count in the chart logic primarily, or we can fetch if needed
			});

		} catch (error) {
			console.error("Error fetching dashboard data:", error);
		} finally {
			setLoading(false);
		}
	};

	const refreshData = () => fetchDashboardData();

	const handleQuickAction = (action) => {
		if (action === "add-employee") {
			setIsAddEmployeeModalOpen(true);
		}
	};

	const handleOpenReportingManagerModal = () => {
		setIsModalOpen(true);
	};

	const handleModalClose = () => {
		setIsModalOpen(false);
	};

	const handleAddReportingManagers = (selectedEmployees) => {
		setIsModalOpen(false);
		refreshData();
	};

	const handleLogout = () => {
		if (window.confirm("Are you sure you want to logout?")) {
			localStorage.removeItem("user");
			localStorage.removeItem("token");
			navigate("/login");
		}
	};

	const navItems = [
		{ tab: "dashboard", label: "Dashboard", to: "/hr/actions", icon: (<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>) },
		{ tab: "candidates", label: "Candidates", to: "/hr/actions/candidates", icon: (<svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" /></svg>) },
		{ tab: "managers", label: "Reporting Managers", to: "/hr/actions/reporting-managers", icon: (<svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M9 7a4 4 0 118 0 4 4 0 01-8 0zM3 20a6 6 0 0112 0v1H3v-1zM17 13a4 4 0 110 8" /></svg>) },
		{ tab: "leaves", label: "Leaves", to: "/hr/actions/leaves", icon: (<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>) },
		{ tab: "timesheet", label: "Timesheet", to: "/hr/actions/timesheet", icon: (<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>) },
	];

	return (
		<div className="flex h-screen w-screen bg-[#e3edf9] flex-col md:flex-row overflow-hidden">
			<Sidebar activeTab={activeTab} setActiveTab={setActiveTab} handleLogout={handleLogout} navItems={navItems} />

			<div className="flex-1 p-4 h-full overflow-hidden flex flex-col gap-4">
				{/* Header Back Button & Title */}
				{/* <div className="flex justify-between items-center bg-white/40 backdrop-blur-md rounded-[20px] p-4 border border-white/50 shadow-sm">
					<div className="text-left">
						<h1 className="text-xl font-black text-brand-blue tracking-tight">Quick Actions</h1>
						<p className="text-[9px] font-black text-brand-blue/30 uppercase tracking-[0.2em] mt-0.5">Administrative Controls</p>
					</div>
					<button onClick={() => navigate("/hr")} className="px-6 py-2 bg-brand-blue text-white font-bold rounded-xl text-[11px] uppercase tracking-widest shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2">
						<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
						Back to My Dashboard
					</button>
				</div> */}

				{/* MAIN CONTENT - REPLICATED FROM ADMIN DASHBOARD */}
				<div className="flex flex-col gap-4 h-full overflow-hidden">

					{/* TOP SECTION (30%) - Quick Actions Vertical */}
					<div className="h-[30%] bg-white/40 backdrop-blur-md rounded-[32px] p-6 border border-white/50 shadow-xl shadow-brand-blue/5 overflow-hidden flex flex-col justify-center gap-4">

						{/* Header Row within Quick Actions */}
						<div className="flex justify-between items-center shrink-0">
							<div className="flex flex-col">
								<h3 className="text-brand-blue text-xl font-black leading-tight tracking-tight">Quick Actions</h3>
								<p className="text-brand-blue/20 text-[9px] font-bold uppercase tracking-[0.2em] mt-0.5">Administrative provision tools</p>
							</div>
							<button onClick={() => navigate("/hr")} className="px-5 py-2 bg-brand-blue text-white font-bold rounded-xl text-[10px] uppercase tracking-widest shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2">
								<svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
								Back to My Dashboard
							</button>
						</div>

						{/* Action Buttons Grid */}
						<div className="w-full">
							<div className="grid grid-cols-2 gap-4 w-full">
								<button
									onClick={() => handleQuickAction("add-employee")}
									className="group bg-white/90 hover:bg-brand-blue p-3 rounded-2xl flex items-center gap-3 transition-all duration-300 shadow-sm hover:shadow-xl border border-brand-blue/10"
								>
									<div className="w-10 h-10 rounded-xl bg-brand-blue/5 flex items-center justify-center text-brand-blue group-hover:bg-white/10 group-hover:text-white transition-colors">
										<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
											<path d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
										</svg>
									</div>
									<div className="text-left">
										<p className="text-[11px] font-black text-brand-blue uppercase tracking-widest group-hover:text-white leading-none">Add Employee</p>
										<p className="text-[9px] font-bold text-brand-blue/30 uppercase tracking-widest mt-1 group-hover:text-white/40">New Entry</p>
									</div>
								</button>

								<button
									onClick={handleOpenReportingManagerModal}
									className="group bg-white/90 hover:bg-indigo-500 p-3 rounded-2xl flex items-center gap-3 transition-all duration-300 shadow-sm hover:shadow-xl border border-indigo-500/10"
								>
									<div className="w-10 h-10 rounded-xl bg-indigo-500/5 flex items-center justify-center text-indigo-500 group-hover:bg-white/10 group-hover:text-white transition-colors">
										<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
											<path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
										</svg>
									</div>
									<div className="text-left">
										<p className="text-[11px] font-black text-brand-blue uppercase tracking-widest group-hover:text-white leading-none">Add Reporting Manager</p>
										<p className="text-[9px] font-bold text-brand-blue/30 uppercase tracking-widest mt-1 group-hover:text-white/40">Team Oversight</p>
									</div>
								</button>
							</div>
						</div>
					</div>

					{/* BOTTOM SECTION (70%) - Analytics & Calendar */}
					<div className="h-[70%] min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-4 pb-2">

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
			</div>

			<EmployeeSelectorModal
				open={isModalOpen}
				onClose={handleModalClose}
				onSave={handleAddReportingManagers}
			/>

			<AddEmployeeModal
				open={isAddEmployeeModalOpen}
				onClose={() => setIsAddEmployeeModalOpen(false)}
				onEmployeeCreated={refreshData}
			/>

			{/* Render Tooltip via Fixed Position */}
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

		</div>
	);
};

export default HrActions;

