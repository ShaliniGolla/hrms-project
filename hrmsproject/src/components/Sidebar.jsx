
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../assets/ORYFOLKS-logo.png';


const Sidebar = ({ activeTab, setActiveTab, handleLogout, navItems }) => {
	const navigate = useNavigate();
	const NavButton = ({ tab, label, icon, onClick, to }) => (
		<button
			type="button"
			onClick={e => {
				e.stopPropagation();
				if (to) {
					navigate(to);
				} else if (onClick) {
					onClick();
				} else {
					setActiveTab(tab);
				}
			}}
			className={`btn-sidebar w-full flex items-center gap-3 mb-2 ${activeTab === tab
				? 'btn-sidebar-active'
				: 'text-white/60 hover:text-brand-yellow transition-colors'
				}`}
		>
			{icon}
			<span className="font-semibold">{label}</span>
		</button>
	);

	return (
		<aside className="w-64 bg-brand-blue text-white flex flex-col hidden md:flex h-screen sticky top-0 shadow-xl overflow-hidden">

			   {/* Logo Section */}
			   <div className="p-8 border-b border-white/5 flex flex-col items-center">
				   <img src={Logo} alt="ORYFOLKS Logo" className="h-12 mb-2 object-contain" />
			   </div>

			{/* Navigation */}
			<nav className="flex-1 px-4 py-8 space-y-2">
				{navItems.map((item) => (
					<NavButton
						key={item.tab}
						tab={item.tab}
						label={item.label}
						icon={item.icon}
						onClick={item.onClick}
						to={item.to}
					/>
				))}
			</nav>

			{/* Logout Button */}
			<div className="p-4 border-t border-white/5">
				<button
					onClick={handleLogout}
					className="w-full flex items-center justify-center gap-2 py-3 bg-brand-yellow/10 border border-brand-yellow/20 text-brand-yellow rounded-xl text-sm font-bold hover:bg-brand-yellow hover:text-brand-blue transition-all active:scale-[0.98]"
				>
					<svg
						className="w-4 h-4"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
						<polyline points="16 17 21 12 16 7"></polyline>
						<line x1="21" y1="12" x2="9" y2="12"></line>
					</svg>
					<span>LOGOUT</span>
				</button>
			</div>
		</aside>
	);
};

export default Sidebar;
