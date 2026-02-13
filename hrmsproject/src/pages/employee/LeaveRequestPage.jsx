import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const LeaveRequestPage = ({ employeeId, leaveBalance, onLeaveRequestSuccess }) => {
  const [formData, setFormData] = useState({
    leaveType: '',
    startDate: '',
    endDate: '',
    reason: '',
  });
  const [blockedDates, setBlockedDates] = useState([]);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch all leaves for this employee
  const fetchLeaveHistory = async () => {
    if (!employeeId) return;
    setHistoryLoading(true);
    try {
      const response = await fetch(`http://localhost:8080/api/leaves/employee/${employeeId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      const leaves = (data && data.data) ? data.data : [];
      setLeaveHistory(leaves);

      // Block all dates in approved or pending leaves
      let blocked = [];
      leaves.forEach(lv => {
        if (["APPROVED", "PENDING"].includes(lv.status)) {
          let d = new Date(lv.startDate);
          let end = new Date(lv.endDate);
          while (d <= end) {
            blocked.push(d.toISOString().slice(0, 10));
            d.setDate(d.getDate() + 1);
          }
        }
      });
      setBlockedDates(blocked);
    } catch (err) {
      console.error("Error fetching leave history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveHistory();
  }, [employeeId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Calculate leave days, skipping weekends and blocked days
  const calculateLeaveDays = (start, end, ignoreBlockedDates = false) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return 0;

    let days = 0;
    let d = new Date(startDate);
    while (d <= endDate) {
      const day = d.getDay();
      const iso = d.toISOString().slice(0, 10);
      if (day !== 0 && day !== 6 && (ignoreBlockedDates || !blockedDates.includes(iso))) {
        days++;
      }
      d.setDate(d.getDate() + 1);
    }
    return days;
  };

  const handleRequest = async (e) => {
    if (e) e.preventDefault();

    if (!formData.leaveType || !formData.startDate || !formData.endDate || !formData.reason) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!employeeId) {
      toast.error('Employee ID not found. Please login again.');
      return;
    }

    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      toast.error('Start date cannot be after end date');
      return;
    }

    // Calculate days requested
    const daysRequested = calculateLeaveDays(formData.startDate, formData.endDate);

    // Check balance
    if (!leaveBalance) {
      toast.error('Unable to check leave balance');
      return;
    }

    const leaveTypeKey = formData.leaveType.toLowerCase();
    const availableKey = `${leaveTypeKey}LeavesRemaining`;
    const availableLeaves = leaveBalance[availableKey] || 0;

    if (availableLeaves < daysRequested) {
      toast.error(`Insufficient ${formData.leaveType} leaves. Available: ${availableLeaves}, Requested: ${daysRequested}`);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        employeeId: parseInt(employeeId),
        leaveType: formData.leaveType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        reason: formData.reason,
      };

      const response = await fetch('http://localhost:8080/api/leaves', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Leave request submitted successfully!');
        setFormData({
          leaveType: '',
          startDate: '',
          endDate: '',
          reason: '',
        });
        setIsPopupOpen(false);
        fetchLeaveHistory(); // Refresh history
        if (onLeaveRequestSuccess) {
          onLeaveRequestSuccess();
        }
      } else {
        toast.error(data.message || 'Failed to submit leave request');
      }
    } catch (err) {
      toast.error('Error submitting leave request: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB'); // DD/MM/YYYY
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'APPROVED':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'PENDING':
        return 'bg-brand-yellow/10 text-brand-yellow border-brand-yellow/20';
      case 'REJECTED':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      default:
        return 'bg-gray-400/10 text-gray-500 border-gray-400/20';
    }
  };

  return (
    <div className="space-y-8 font-brand">
      {/* Header with Title and New Request Button */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-xl font-black text-brand-blue uppercase tracking-widest">Leave History</h2>

        <button
          onClick={() => setIsPopupOpen(true)}
          className="px-6 py-2.5 bg-brand-blue text-white rounded-xl font-bold flex items-center gap-2 hover:bg-brand-blue-hover transition-all shadow-md active:scale-95"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>New Request</span>
        </button>
      </div>

      {/* Leave History Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-brand-blue/5 card-hover">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-0 text-sm">
            <thead className="bg-brand-blue">
              <tr className="text-white/40 font-bold uppercase tracking-widest text-[10px]">
                <th className="p-4 px-6 border-b border-white/5">Request Date</th>
                <th className="p-4 px-6 border-b border-white/5">Leave Type</th>
                <th className="p-4 px-6 border-b border-white/5">Reason</th>
                <th className="p-4 px-6 border-b border-white/5">Start Date</th>
                <th className="p-4 px-6 border-b border-white/5">End Date</th>
                <th className="p-4 px-6 border-b border-white/5 text-center">Days</th>
                <th className="p-4 px-6 border-b border-white/5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-blue/5">
              {historyLoading ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-brand-blue/30 font-bold uppercase tracking-widest text-xs animate-pulse">
                    Loading leave history...
                  </td>
                </tr>
              ) : leaveHistory.length > 0 ? (
                leaveHistory.map((leave) => {
                  const daysNum = calculateLeaveDays(leave.startDate, leave.endDate, true);
                  return (
                    <tr key={leave.id} className="hover:bg-bg-slate transition-colors">
                      <td className="p-4 px-6 font-bold text-brand-blue">{formatDate(leave.submittedAt || leave.createdAt || leave.startDate)}</td>
                      <td className="p-4 px-6 font-bold text-brand-blue uppercase text-xs">{leave.leaveType}</td>
                      <td className="p-4 px-6 text-brand-blue/60 italic truncate max-w-xs">{leave.reason}</td>
                      <td className="p-4 px-6 text-brand-blue/70">{formatDate(leave.startDate)}</td>
                      <td className="p-4 px-6 text-brand-blue/70">{formatDate(leave.endDate)}</td>
                      <td className="p-4 px-6 text-center font-black text-brand-blue">{daysNum}</td>
                      <td className="p-4 px-6 text-center">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${getStatusColor(leave.status)}`}>
                          {leave.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="p-12 text-center text-brand-blue/20">
                    <p className="font-bold uppercase tracking-widest text-[10px] italic">No leave history found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Request Modal */}
      {isPopupOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
          <div className="absolute inset-0 bg-brand-blue/80 backdrop-blur-md" onClick={() => setIsPopupOpen(false)}></div>

          <div className="relative w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl flex flex-col max-h-[90vh] border border-brand-blue/10 animate-in fade-in zoom-in duration-300">
            {/* Modal Header */}
            <div className="bg-brand-blue px-6 py-6 flex justify-between items-center rounded-t-[2rem]">
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-wider">New Leave Request</h3>
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">Submit your leave application</p>
              </div>
              <button
                onClick={() => setIsPopupOpen(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-brand-yellow hover:text-brand-blue transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 md:p-10 min-h-0">
              <form id="leaveForm" onSubmit={handleRequest} className="space-y-6">
                {/* Balance Info */}
                {leaveBalance && (
                  <div className="p-4 bg-brand-yellow/10 border border-brand-yellow/20 rounded-2xl mb-8">
                    <div className="grid grid-cols-3 gap-4 text-[10px] font-black uppercase tracking-widest text-brand-blue text-center">
                      <div>
                        <span className="opacity-40 block mb-1">Casual</span>
                        <span className="text-lg">{leaveBalance.casualLeavesRemaining}</span>
                      </div>
                      <div>
                        <span className="opacity-40 block mb-1 text-red-500/50">Sick</span>
                        <span className="text-lg text-red-500">{leaveBalance.sickLeavesRemaining}</span>
                      </div>
                      <div>
                        <span className="opacity-40 block mb-1 text-emerald-500/50">Earned</span>
                        <span className="text-lg text-emerald-500">{leaveBalance.earnedLeavesRemaining}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Leave Type */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-brand-blue/40 uppercase tracking-widest block ml-1">Leave Type</label>
                    <select
                      name="leaveType"
                      value={formData.leaveType}
                      onChange={handleInputChange}
                      className="w-full px-5 py-4 bg-bg-slate border-2 border-transparent focus:border-brand-yellow rounded-2xl text-sm font-bold text-brand-blue outline-none transition-all shadow-sm appearance-none"
                    >
                      <option value="">Select Type</option>
                      <option value="SICK">Sick Leave</option>
                      <option value="CASUAL">Casual Leave</option>
                      <option value="EARNED">Earned Leave</option>
                    </select>
                  </div>

                  {/* Days Display (read-only placeholder) */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-brand-blue/40 uppercase tracking-widest block ml-1">Selected Days</label>
                    <div className="w-full px-5 py-4 bg-bg-slate border-2 border-transparent rounded-2xl text-sm font-bold text-brand-blue shadow-sm">
                      {formData.startDate && formData.endDate ? calculateLeaveDays(formData.startDate, formData.endDate) : 0} Days
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Start Date */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-brand-blue/40 uppercase tracking-widest block ml-1">Start Date</label>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      min={new Date().toISOString().slice(0, 10)}
                      onBlur={e => {
                        const d = new Date(e.target.value);
                        const iso = e.target.value;
                        if (iso && (d.getDay() === 0 || d.getDay() === 6 || blockedDates.includes(iso))) {
                          toast.error('Start date cannot be a weekend or already requested/approved leave.');
                          setFormData(f => ({ ...f, startDate: '' }));
                        }
                      }}
                      className="w-full px-5 py-4 bg-bg-slate border-2 border-transparent focus:border-brand-yellow rounded-2xl text-sm font-bold text-brand-blue outline-none transition-all shadow-sm"
                    />
                  </div>

                  {/* End Date */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-brand-blue/40 uppercase tracking-widest block ml-1">End Date</label>
                    <input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleInputChange}
                      min={formData.startDate || new Date().toISOString().slice(0, 10)}
                      onBlur={e => {
                        const d = new Date(e.target.value);
                        const iso = e.target.value;
                        if (iso && (d.getDay() === 0 || d.getDay() === 6 || blockedDates.includes(iso))) {
                          toast.error('End date cannot be a weekend or already requested/approved leave.');
                          setFormData(f => ({ ...f, endDate: '' }));
                        }
                      }}
                      className="w-full px-5 py-4 bg-bg-slate border-2 border-transparent focus:border-brand-yellow rounded-2xl text-sm font-bold text-brand-blue outline-none transition-all shadow-sm"
                    />
                  </div>
                </div>

                {/* Reason */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-brand-blue/40 uppercase tracking-widest block ml-1">Reason for Leave</label>
                  <textarea
                    name="reason"
                    value={formData.reason}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-5 py-4 bg-bg-slate border-2 border-transparent focus:border-brand-yellow rounded-2xl text-sm font-bold text-brand-blue placeholder:text-brand-blue/20 outline-none transition-all shadow-sm resize-none"
                    placeholder="e.g. Family emergency, personal work..."
                  />
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="bg-white p-6 md:px-10 border-t border-brand-blue/5 rounded-b-[2rem]">
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setIsPopupOpen(false)}
                  className="px-6 py-4 bg-bg-slate border border-brand-blue/5 text-brand-blue/40 font-black rounded-2xl hover:bg-brand-blue hover:text-white transition-all uppercase tracking-widest text-[11px] shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="leaveForm"
                  disabled={loading}
                  className="bg-brand-yellow text-brand-blue font-black py-4 px-6 rounded-2xl hover:shadow-xl hover:shadow-brand-yellow/30 transition-all active:scale-95 uppercase tracking-widest text-[11px] disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveRequestPage;

