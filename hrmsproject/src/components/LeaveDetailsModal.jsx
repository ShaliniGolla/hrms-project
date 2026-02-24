import React from 'react';

const LeaveDetailsModal = ({ isOpen, onClose, leave }) => {
    if (!isOpen || !leave) return null;

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB') + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getStatusStyle = (status) => {
        switch (status?.toUpperCase()) {
            case 'APPROVED': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'PENDING': return 'bg-brand-yellow/10 text-brand-yellow-dark border-brand-yellow/20';
            case 'REJECTED': return 'bg-red-50 text-red-600 border-red-100';
            default: return 'bg-gray-50 text-gray-600 border-gray-100';
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-brand-blue/40 backdrop-blur-sm" onClick={onClose}></div>

            <div className="relative bg-white w-full max-w-lg rounded-[2rem] shadow-2xl border border-brand-blue/5 overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-brand-blue p-6 md:px-10 flex justify-between items-center text-white">
                    <div>
                        <h3 className="text-xl font-black tracking-tight uppercase">Leave Details</h3>
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mt-1">Application Information</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-8 md:px-10 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {/* Status Badge */}
                    <div className="flex justify-between items-center bg-bg-slate p-5 rounded-2xl border border-brand-blue/5 shadow-inner">
                        <span className="text-[10px] font-black text-brand-blue/40 uppercase tracking-widest">Current Status</span>
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${getStatusStyle(leave.status)}`}>
                            {leave.status}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-brand-blue/30 uppercase tracking-[0.2em]">Leave Type</label>
                            <p className="text-sm font-black text-brand-blue uppercase">{leave.leaveType}</p>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-brand-blue/30 uppercase tracking-[0.2em]">Total Duration</label>
                            <div className="flex items-baseline gap-1">
                                <span className="text-xl font-black text-brand-blue">{(leave.daysCount || 0).toFixed(1)}</span>
                                <span className="text-[10px] font-bold text-brand-blue/40 uppercase">Days</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 pt-4 border-t border-brand-blue/5">
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-brand-blue/30 uppercase tracking-[0.2em]">Start Date</label>
                            <p className="text-[11px] font-bold text-brand-blue/70">{formatDate(leave.startDate)}</p>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-brand-blue/30 uppercase tracking-[0.2em]">End Date</label>
                            <p className="text-[11px] font-bold text-brand-blue/70">{formatDate(leave.endDate)}</p>
                        </div>
                    </div>

                    {/* Daily Breakdown */}
                    {leave.sessionData && Object.keys(leave.sessionData).length > 0 && (
                        <div className="bg-bg-slate/40 rounded-2xl p-4 border border-brand-blue/5">
                            <label className="text-[9px] font-black text-brand-blue/30 uppercase tracking-[0.2em] mb-3 block">Daily Breakdown</label>
                            <div className="space-y-2">
                                {Object.entries(leave.sessionData).map(([date, session]) => (
                                    <div key={date} className="flex justify-between items-center px-3 py-2 bg-white rounded-xl border border-brand-blue/5 shadow-sm">
                                        <span className="text-[10px] font-bold text-brand-blue/60">{formatDate(date)}</span>
                                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${session === 'FULL' ? 'bg-brand-blue/5 text-brand-blue' :
                                                session === 'MORNING' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'
                                            }`}>{session === 'FULL' ? 'Full Day' : session}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Reason */}
                    <div className="bg-bg-slate p-5 rounded-2xl border border-brand-blue/5 shadow-inner">
                        <label className="text-[9px] font-black text-brand-blue/30 uppercase tracking-[0.2em] mb-2 block">Reason</label>
                        <p className="text-xs font-bold text-brand-blue/60 leading-relaxed italic">
                            {leave.reason ? `"${leave.reason}"` : "No reason provided."}
                        </p>
                    </div>

                    {/* Approval Info */}
                    {leave.status !== 'PENDING' && (
                        <div className="bg-indigo-50/30 p-5 rounded-2xl border border-indigo-100/50">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-indigo-600/40 uppercase tracking-[0.2em]">Processed By</label>
                                    <p className="text-[10px] font-black text-indigo-900">{leave.approvedBy || "System"}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-indigo-600/40 uppercase tracking-[0.2em]">Reviewed At</label>
                                    <p className="text-[10px] font-black text-indigo-900">{formatDateTime(leave.reviewedAt)}</p>
                                </div>
                            </div>
                            {leave.status === 'REJECTED' && leave.rejectionReason && (
                                <div className="mt-4 pt-4 border-t border-indigo-100/50">
                                    <label className="text-[9px] font-black text-red-500/50 uppercase tracking-[0.2em] mb-1 block">Rejection Note</label>
                                    <p className="text-[10px] font-bold text-red-600 italic">"{leave.rejectionReason}"</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Remaining Balances Section */}
                    <div className="bg-emerald-50/30 p-6 rounded-2xl border border-emerald-100/50">
                        <h4 className="text-[10px] font-black text-emerald-600/60 uppercase tracking-[0.2em] mb-4">Post-Request Balances</h4>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { label: 'Casual', value: leave.casualLeavesRemaining },
                                { label: 'Sick', value: leave.sickLeavesRemaining },
                                { label: 'Earned', value: leave.earnedLeavesRemaining }
                            ].map((bal, idx) => (
                                <div key={idx} className="bg-white p-3 rounded-xl border border-emerald-100 flex flex-col items-center">
                                    <span className="text-[8px] font-black text-emerald-600/40 uppercase tracking-widest">{bal.label}</span>
                                    <span className="text-sm font-black text-emerald-800 mt-0.5">{(bal.value || 0).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LeaveDetailsModal;
