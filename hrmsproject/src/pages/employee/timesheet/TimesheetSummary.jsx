import React from 'react';

const TimesheetSummary = ({ weeks, onSelectWeek }) => {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Search/Header section */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex flex-col gap-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Guidelines</p>
                    <p className="text-sm text-slate-600">Please follow basic troubleshooting if you face any discrepancies in accessing the page.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-500">Search By</span>
                        <select className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all">
                            <option>Status</option>
                            <option>Date Range</option>
                        </select>
                    </div>
                    <button className="bg-emerald-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/20 active:scale-95">
                        Search
                    </button>
                    <button className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Summary List */}
            <div className="space-y-4 max-h-[480px] overflow-y-auto pr-2 custom-scrollbar flex-1">
                {weeks.map((week, index) => (
                    <div
                        key={index}
                        className="group bg-white rounded-xl shadow-sm border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all duration-300 overflow-hidden cursor-pointer"
                        onClick={() => onSelectWeek(week)}
                    >
                        <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-100">
                            {/* Week Info */}
                            <div className="p-5 flex-1 min-w-[250px] relative">
                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${week.status === 'Approved' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                                <h3 className="text-indigo-600 font-bold hover:underline">
                                    {week.startDate} To {week.endDate}
                                </h3>
                                <p className={`text-xs font-bold mt-2 ${week.status === 'Approved' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                    {week.status}
                                </p>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 flex-[3]">
                                <div className="p-5 flex flex-col items-center justify-center text-center">
                                    <span className="text-lg font-bold text-slate-700">{week.billableHrs.toFixed(2)}</span>
                                    <span className="text-[10px] uppercase font-bold text-slate-400">Billable Project Hrs</span>
                                </div>
                                <div className="p-5 flex flex-col items-center justify-center text-center border-l md:border-l-0 border-slate-100">
                                    <span className="text-lg font-bold text-slate-700">{week.nonBillableHrs.toFixed(2)}</span>
                                    <span className="text-[10px] uppercase font-bold text-slate-400">Non-Billable Project Hrs</span>
                                </div>
                                <div className="p-5 flex flex-col items-center justify-center text-center border-t md:border-t-0 md:border-l border-slate-100">
                                    <span className="text-lg font-bold text-slate-700">{week.timeOffHrs.toFixed(2)}</span>
                                    <span className="text-[10px] uppercase font-bold text-slate-400">Time off/Holiday Hrs</span>
                                </div>
                                <div className="p-5 flex flex-col items-center justify-center text-center border-t md:border-t-0 border-l border-slate-100">
                                    <span className="text-lg font-bold text-slate-700">
                                        {(week.billableHrs + week.nonBillableHrs + week.timeOffHrs).toFixed(2)}
                                    </span>
                                    <span className="text-[10px] uppercase font-bold text-slate-400">Total Hours</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {weeks.length === 0 && (
                    <div className="bg-white p-20 rounded-2xl border-2 border-dashed border-slate-200 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h4 className="text-lg font-bold text-slate-400">No timesheets found</h4>
                        <p className="text-slate-400 mt-1">Start by filling your first weekly timesheet</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TimesheetSummary;
