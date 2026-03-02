import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const EMPTY_ARRAY = [];

const WeeklyTimesheetGrid = ({ weekData, onBack, onSave, employeeId, approvedLeaves = EMPTY_ARRAY, holidays = EMPTY_ARRAY, readOnly = false, onApprove, onReject }) => {
    // Dates for the week (7 days)
    const [dates, setDates] = useState([]);

    // Project rows
    const [projectRows, setProjectRows] = useState([
        { id: Date.now(), projectId: '', projectName: '', taskId: '', taskDesc: '', onsite: 'Offshore', billable: 'Billable', location: 'India', hours: Array.from({ length: 7 }, () => ({ value: '', id: null })), comment: '' }
    ]);

    // TruTime rows (Swipe)
    const [truTimeRows, setTruTimeRows] = useState({
        swipe: Array(7).fill({ value: '', id: null }),
    });

    // Holiday / Time off / Leave
    const [leaveRows, setLeaveRows] = useState({
        holiday: Array(7).fill({ value: '', id: null }),
        leaveS: Array(7).fill({ value: '', id: null }),
        leaveC: Array(7).fill({ value: '', id: null }),
        leaveE: Array(7).fill({ value: '', id: null })
    });

    useEffect(() => {
        if (weekData && weekData.start) {
            const dateList = [];
            let current = parseDateLocal(weekData.start);
            for (let i = 0; i < 7; i++) {
                dateList.push(new Date(current));
                current.setDate(current.getDate() + 1);
            }
            setDates(dateList);

            // Initialize local data structures
            const projects = {};
            const swipes = Array(7).fill(null).map(() => ({ value: '', id: null }));
            const holidayData = Array(7).fill(null).map(() => ({ value: '', id: null }));
            const leavesS = Array(7).fill(null).map(() => ({ value: '', id: null }));
            const leavesC = Array(7).fill(null).map(() => ({ value: '', id: null }));
            const leavesE = Array(7).fill(null).map(() => ({ value: '', id: null }));

            const weekDates = [];
            let d = parseDateLocal(weekData.start);
            for (let i = 0; i < 7; i++) {
                weekDates.push(getLocalDateStr(d));
                d.setDate(d.getDate() + 1);
            }

            // Populate existing data if available
            if (weekData.entries && weekData.entries.length > 0) {
                weekData.entries.forEach(entry => {
                    const entryDateStr = getLocalDateStr(entry.date);
                    const dayIdx = weekDates.indexOf(entryDateStr);

                    if (dayIdx !== -1) {
                        if (entry.category === 'PROJECT') {
                            // Use ALL identifying fields as the composite key so that rows
                            // with different projectId (or any other field) are NOT merged together.
                            const key = [
                                entry.project || '',
                                entry.projectName || '',
                                entry.task || '',
                                entry.taskDescription || '',
                                entry.onsiteOffshore || '',
                                String(entry.billable),
                                entry.billingLocation || '',
                                entry.notes || ''
                            ].join('||');
                            if (!projects[key]) {
                                projects[key] = {
                                    id: Date.now() + Math.random(),
                                    projectId: entry.project || '',
                                    projectName: entry.projectName || '',
                                    taskId: entry.task || '',
                                    taskDesc: entry.taskDescription || '',
                                    onsite: entry.onsiteOffshore || 'Offshore',
                                    billable: entry.billable ? 'Billable' : 'Non-Billable',
                                    location: entry.billingLocation || 'India',
                                    hours: Array.from({ length: 7 }, () => ({ value: '', id: null })),
                                    comment: entry.notes || ''
                                };
                            }
                            projects[key].hours[dayIdx] = { value: entry.totalHours.toString(), id: entry.id };
                        } else if (entry.category === 'TRUTIME') {
                            swipes[dayIdx] = { value: entry.totalHours.toString(), id: entry.id };
                        } else if (entry.category === 'HOLIDAY') {
                            holidayData[dayIdx] = { value: entry.totalHours.toString(), id: entry.id };
                        } else if (entry.category === 'LEAVE') {
                            if (entry.leaveType === 'S') leavesS[dayIdx] = { value: entry.totalHours.toString(), id: entry.id };
                            else if (entry.leaveType === 'C') leavesC[dayIdx] = { value: entry.totalHours.toString(), id: entry.id };
                            else if (entry.leaveType === 'E') leavesE[dayIdx] = { value: entry.totalHours.toString(), id: entry.id };
                        }
                    }
                });
            }

            // Auto-populate 4 or 8 hours for approved leaves
            weekDates.forEach((ds, dayIdx) => {
                const gridDate = parseDateLocal(ds);
                gridDate.setHours(0, 0, 0, 0);

                if (isWeekend(gridDate)) return; // Skip weekends

                approvedLeaves.forEach(leave => {
                    const start = parseDateLocal(leave.startDate);
                    const end = parseDateLocal(leave.endDate);
                    start.setHours(0, 0, 0, 0);
                    end.setHours(0, 0, 0, 0);

                    if (gridDate >= start && gridDate <= end) {
                        let hoursAuto = "8.00";
                        if (leave.sessionData && leave.sessionData[ds]) {
                            const session = leave.sessionData[ds];
                            if (session === 'MORNING' || session === 'AFTERNOON') {
                                hoursAuto = "4.00";
                            }
                        }

                        if (leave.leaveType === 'SICK' && !leavesS[dayIdx].value) {
                            leavesS[dayIdx] = { ...leavesS[dayIdx], value: hoursAuto };
                        } else if (leave.leaveType === 'CASUAL' && !leavesC[dayIdx].value) {
                            leavesC[dayIdx] = { ...leavesC[dayIdx], value: hoursAuto };
                        } else if (leave.leaveType === 'EARNED' && !leavesE[dayIdx].value) {
                            leavesE[dayIdx] = { ...leavesE[dayIdx], value: hoursAuto };
                        }
                    }
                });
            });

            // Auto-populate 8 hours for holidays
            weekDates.forEach((ds, dayIdx) => {
                const gridDate = parseDateLocal(ds);
                if (isWeekend(gridDate)) return; // Skip weekends

                if (holidays.some(h => getLocalDateStr(h.holidayDate) === ds) && !holidayData[dayIdx].value) {
                    holidayData[dayIdx] = { ...holidayData[dayIdx], value: '8.00' };
                }
            });

            const projectRowsList = Object.values(projects);
            if (projectRowsList.length > 0) setProjectRows(projectRowsList);
            else setProjectRows([{ id: Date.now(), projectId: '', projectName: '', taskId: '', taskDesc: '', onsite: 'Offshore', billable: 'Billable', location: 'India', hours: Array.from({ length: 7 }, () => ({ value: '', id: null })), comment: '' }]);

            setTruTimeRows({ swipe: swipes });
            setLeaveRows({
                holiday: holidayData,
                leaveS: leavesS,
                leaveC: leavesC,
                leaveE: leavesE
            });
        }
    }, [weekData, approvedLeaves, holidays]);

    const handleAddRow = () => {
        setProjectRows([...projectRows, { id: Date.now(), projectId: '', projectName: '', taskId: '', taskDesc: '', onsite: 'Offshore', billable: 'Billable', location: 'India', hours: Array.from({ length: 7 }, () => ({ value: '', id: null })), comment: '' }]);
    };

    const handleRowChange = (rowIndex, field, value) => {
        const updated = projectRows.map((row, idx) =>
            idx === rowIndex ? { ...row, [field]: value } : row
        );
        setProjectRows(updated);
    };

    const getLocalDateStr = (date) => {
        if (!date) return "";
        const d = date instanceof Date ? date : new Date(date);
        // If it was a string YYYY-MM-DD, new Date(string) creates UTC.
        // But getFullYear/getMonth/getDate are local.
        // If user is in UTC+5:30, UTC 00:00 is 05:30 same day. Correct.
        // If user is in UTC-5:00, UTC 00:00 is 19:00 previous day. Incorrect!
        // So we strictly use string splitting for YYYY-MM-DD strings.
        if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(date)) {
            return date.split('T')[0];
        }
        const year = d.getFullYear();
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const day = d.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const parseDateLocal = (d) => {
        if (!d) return new Date();
        if (d instanceof Date) return new Date(d);
        const s = d.toString().split('T')[0];
        const parts = s.split('-');
        if (parts.length === 3) {
            return new Date(parts[0], parts[1] - 1, parts[2]);
        }
        return new Date(d);
    };

    const isWeekend = (date) => {
        if (!date) return false;
        const day = date instanceof Date ? date.getDay() : new Date(date).getDay();
        return day === 0 || day === 6; // Sunday = 0, Saturday = 6
    };

    const isHolidayDay = (dayIdx) => {
        if (!dates[dayIdx]) return false;
        const ds = getLocalDateStr(dates[dayIdx]);
        return holidays.some(h => h.holidayDate === ds);
    };



    const handleHourChange = (rowIndex, dayIndex, value) => {
        // Validation removed to allow "two entries in single column" (e.g. 4h Leave + 4h Work)
        const updated = projectRows.map((row, rIdx) => {
            if (rIdx !== rowIndex) return row;
            const newHours = row.hours.map((h, dIdx) =>
                dIdx === dayIndex ? { ...h, value } : h
            );
            return { ...row, hours: newHours };
        });
        setProjectRows(updated);
    };

    const handleLeaveHourChange = (typeKey, dayIndex, value) => {
        const updated = { ...leaveRows, [typeKey]: [...leaveRows[typeKey]] };
        updated[typeKey][dayIndex] = { ...updated[typeKey][dayIndex], value };
        setLeaveRows(updated);
    };

    const calculateRowTotal = (hours) => {
        return hours.reduce((sum, h) => sum + (parseFloat(h.value) || 0), 0);
    };

    const getGrandTotal = () => {
        let total = 0;
        projectRows.forEach(row => total += calculateRowTotal(row.hours));
        leaveRows.holiday.forEach(h => total += (parseFloat(h.value) || 0));
        leaveRows.leaveS.forEach(h => total += (parseFloat(h.value) || 0));
        leaveRows.leaveC.forEach(h => total += (parseFloat(h.value) || 0));
        leaveRows.leaveE.forEach(h => total += (parseFloat(h.value) || 0));
        return total;
    };

    const getTruTimeTotal = () => {
        let total = 0;
        truTimeRows.swipe.forEach(h => total += (parseFloat(h.value) || 0));
        return total;
    };

    const handleSave = () => {
        // No restriction of 40 hours as per user request


        const payload = {
            employeeId,
            weekStart: getLocalDateStr(weekData.start),
            entries: []
        };

        projectRows.forEach(row => {
            row.hours.forEach((h, i) => {
                const val = parseFloat(h.value);
                if (val > 0) {
                    payload.entries.push({
                        id: h.id,
                        date: getLocalDateStr(dates[i]),
                        project: row.projectId,
                        projectName: row.projectName,
                        task: row.taskId,
                        taskDescription: row.taskDesc,
                        onsiteOffshore: row.onsite,
                        billingLocation: row.location,
                        billable: row.billable === 'Billable',
                        totalHours: val,
                        category: 'PROJECT',
                        notes: row.comment
                    });
                }
            });
        });

        truTimeRows.swipe.forEach((h, i) => {
            const val = parseFloat(h.value);
            if (val > 0) {
                payload.entries.push({
                    id: h.id,
                    date: getLocalDateStr(dates[i]),
                    totalHours: val,
                    category: 'TRUTIME',
                    projectName: 'TruTime Swipe'
                });
            }
        });

        leaveRows.holiday.forEach((h, i) => {
            const val = parseFloat(h.value);
            if (val > 0) {
                payload.entries.push({
                    id: h.id,
                    date: getLocalDateStr(dates[i]),
                    totalHours: val,
                    category: 'HOLIDAY',
                    projectName: 'Holiday'
                });
            }
        });

        const leaveTypes = ['S', 'C', 'E'];
        ['leaveS', 'leaveC', 'leaveE'].forEach((key, typeIdx) => {
            leaveRows[key].forEach((h, i) => {
                const val = parseFloat(h.value);
                if (val > 0) {
                    payload.entries.push({
                        id: h.id,
                        date: getLocalDateStr(dates[i]),
                        totalHours: val,
                        category: 'LEAVE',
                        leaveType: leaveTypes[typeIdx],
                        projectName: `Leave (${leaveTypes[typeIdx]})`
                    });
                }
            });
        });

        onSave(payload);
    };

    const formatDateHeader = (date) => {
        if (!date) return '';
        const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        return {
            day: date.getDate(),
            name: days[date.getDay()]
        };
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-w-6xl mx-auto w-full flex-1 animate-in fade-in zoom-in duration-300">
            {/* Header */}
            <div className="bg-slate-900 text-white px-8 py-2 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-1.5 hover:bg-white/10 rounded-full transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h2 className="text-base font-bold">Weekly Timesheet</h2>
                    <span className="bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full text-[10px] font-bold border border-indigo-500/30">
                        {weekData.startDate} - {weekData.endDate}
                    </span>
                </div>
                <div className="flex gap-3">
                    {!readOnly ? (
                        <button onClick={handleSave} className="px-5 py-2 bg-emerald-600 text-white rounded-lg text-[10px] font-bold hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/20 active:scale-95 tracking-widest uppercase">
                            SUBMIT WEEKLY SHEET
                        </button>
                    ) : (weekData.status === 'Pending' && onApprove && onReject && String(employeeId) !== String(JSON.parse(localStorage.getItem("user"))?.employeeId)) && (
                        <>
                            <button onClick={() => onApprove(weekData)} className="px-5 py-2 bg-emerald-600 text-white rounded-lg text-[10px] font-bold hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/20 active:scale-95 tracking-widest uppercase">
                                APPROVE WEEK
                            </button>
                            <button onClick={() => onReject(weekData)} className="px-5 py-2 bg-red-600 text-white rounded-lg text-[10px] font-bold hover:bg-red-500 transition-all shadow-lg shadow-red-600/20 active:scale-95 tracking-widest uppercase">
                                REJECT WEEK
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto min-h-0">
                <table className="w-full border-collapse">
                    <thead className="sticky top-0 z-20">
                        <tr className="bg-slate-800 text-white text-[10px] font-black uppercase tracking-wider">
                            <th className="p-1 border-r border-slate-700 text-left min-w-[70px]">Project ID</th>
                            <th className="p-1 border-r border-slate-700 text-left min-w-[100px]">Project Name</th>
                            <th className="p-1 border-r border-slate-700 text-left min-w-[70px]">Task ID</th>
                            <th className="p-1 border-r border-slate-700 text-left min-w-[100px]">Description</th>
                            <th className="p-1 border-r border-slate-700 text-center min-w-[70px]">On/Off</th>
                            <th className="p-1 border-r border-slate-700 text-center min-w-[80px]">Billable</th>
                            <th className="p-1 border-r border-slate-700 text-center min-w-[110px]">Location</th>
                            {dates.map((d, i) => {
                                const header = formatDateHeader(d);
                                const weekend = isWeekend(d);
                                return (
                                    <th key={i} className={`p-2 border-r border-slate-700 text-center min-w-[45px] ${weekend ? 'bg-slate-900/60' : ''}`}>
                                        <div className="font-bold">{header.day}</div>
                                        <div className="opacity-60 text-[8px]">{header.name}</div>
                                    </th>
                                );
                            })}
                            <th className="p-1 border-r border-slate-700 text-center min-w-[50px]">Total</th>
                            <th className="p-1 border-r border-slate-700 text-center min-w-[90px]">Comment</th>
                            <th className="p-1 text-center min-w-[45px]">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {/* Project Rows */}
                        {projectRows.map((row, index) => (
                            <tr key={row.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="p-0.5 border-r border-slate-100">
                                    <input type="text" value={row.projectId} onChange={(e) => handleRowChange(index, 'projectId', e.target.value)} className="w-full p-2 text-[11px] border border-transparent hover:border-slate-200 focus:border-indigo-500 rounded bg-transparent focus:bg-white outline-none" />
                                </td>
                                <td className="p-0.5 border-r border-slate-100">
                                    <input type="text" value={row.projectName} onChange={(e) => handleRowChange(index, 'projectName', e.target.value)} className="w-full p-2 text-[11px] border border-transparent hover:border-slate-200 focus:border-indigo-500 rounded bg-transparent focus:bg-white outline-none" />
                                </td>
                                <td className="p-0.5 border-r border-slate-100">
                                    <input type="text" value={row.taskId} onChange={(e) => handleRowChange(index, 'taskId', e.target.value)} className="w-full p-2 text-[11px] border border-transparent hover:border-slate-200 focus:border-indigo-500 rounded bg-transparent focus:bg-white outline-none" />
                                </td>
                                <td className="p-0.5 border-r border-slate-100">
                                    <input type="text" value={row.taskDesc} onChange={(e) => handleRowChange(index, 'taskDesc', e.target.value)} className="w-full p-2 text-[11px] border border-transparent hover:border-slate-200 focus:border-indigo-500 rounded bg-transparent focus:bg-white outline-none" />
                                </td>
                                <td className="p-0.5 border-r border-slate-100">
                                    <select value={row.onsite} onChange={(e) => handleRowChange(index, 'onsite', e.target.value)} className="w-full p-2 text-[11px] bg-transparent outline-none">
                                        <option>Onsite</option>
                                        <option>Offshore</option>
                                    </select>
                                </td>
                                <td className="p-0.5 border-r border-slate-100">
                                    <select value={row.billable} onChange={(e) => handleRowChange(index, 'billable', e.target.value)} className="w-full p-2 text-[11px] bg-transparent outline-none">
                                        <option>Billable</option>
                                        <option>Non-Billable</option>
                                    </select>
                                </td>
                                <td className="p-0.5 border-r border-slate-100">
                                    <select
                                        value={row.location}
                                        disabled={readOnly}
                                        onChange={(e) => handleRowChange(index, 'location', e.target.value)}
                                        className="w-full p-2 text-[11px] bg-transparent outline-none"
                                    >
                                        <option value="India">India</option>
                                        <option value="Japan">Japan</option>
                                        <option value="Singapore">Singapore</option>
                                    </select>
                                </td>
                                {row.hours.map((h, i) => {
                                    const weekend = isWeekend(dates[i]);
                                    return (
                                        <td key={i} className={`p-0.5 border-r border-slate-100 ${weekend ? 'bg-slate-100' : ''}`}>
                                            <input
                                                type="text"
                                                value={h.value}
                                                disabled={weekend || readOnly || isHolidayDay(i)}
                                                onChange={(e) => handleHourChange(index, i, e.target.value)}
                                                className={`w-full p-2 text-[11px] text-center border border-transparent hover:border-slate-200 focus:border-indigo-500 rounded bg-transparent focus:bg-white outline-none font-bold ${weekend || isHolidayDay(i) ? 'text-slate-400 cursor-not-allowed' : 'text-slate-700'}`}
                                            />
                                        </td>
                                    );
                                })}
                                <td className="p-0.5 border-r border-slate-100 text-center font-black text-slate-700 text-[11px]">
                                    {calculateRowTotal(row.hours).toFixed(2)}
                                </td>
                                <td className="p-0.5 border-r border-slate-100">
                                    <input type="text" value={row.comment} onChange={(e) => handleRowChange(index, 'comment', e.target.value)} className="w-full p-2 text-[11px] bg-transparent outline-none" />
                                </td>
                                <td className="p-0.5 text-center">
                                    <button onClick={() => setProjectRows(projectRows.filter((_, idx) => idx !== index))} className="p-1 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </td>
                            </tr>
                        ))}

                        {/* Special Rows Button */}
                        {!readOnly && (
                            <tr className="bg-slate-50/50">
                                <td colSpan="18" className="p-1.5 pl-4">
                                    <button onClick={handleAddRow} className="flex items-center gap-2 text-indigo-600 font-bold text-[10px] hover:text-indigo-700">
                                        <div className="w-4 h-4 bg-indigo-100 rounded-full flex items-center justify-center">
                                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 5v14M5 12h14" />
                                            </svg>
                                        </div>
                                        <span>ADD PROJECT ROW</span>
                                    </button>
                                </td>
                            </tr>
                        )}

                        {/* TruTime / Leave section */}
                        <tr className="bg-slate-100/50 text-[9px] font-black uppercase text-slate-500">
                            <td colSpan="7" className="p-2 pl-6 border-r border-slate-200">TruTime / Holiday / Leave</td>
                            <td colSpan="7" className="p-2 border-r border-slate-200"></td>
                            <td colSpan="3"></td>
                        </tr>

                        {/* Swipe Hours */}
                        <tr className="text-[11px]">
                            <td colSpan="7" className="p-2 pl-10 text-slate-500 border-r border-slate-200 italic font-medium">Swipe in hours</td>
                            {truTimeRows.swipe.map((h, i) => {
                                const weekend = isWeekend(dates[i]);
                                return (
                                    <td key={i} className={`p-0 border-r border-slate-100 h-8 ${weekend ? 'bg-slate-200' : 'bg-slate-50/30'}`}>
                                        <input
                                            type="text"
                                            value={h.value}
                                            disabled={weekend || readOnly || isHolidayDay(i)}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                const updated = { ...truTimeRows, swipe: [...truTimeRows.swipe] };
                                                updated.swipe[i] = { ...updated.swipe[i], value: val };
                                                setTruTimeRows(updated);
                                            }}
                                            className={`w-full h-full text-center outline-none bg-transparent font-bold ${weekend || isHolidayDay(i) ? 'text-slate-400 cursor-not-allowed' : 'text-slate-400'}`}
                                        />
                                    </td>
                                );
                            })}
                            <td className="text-center font-bold text-slate-400">{calculateRowTotal(truTimeRows.swipe).toFixed(2)}</td>
                            <td colSpan="2"></td>
                        </tr>

                        {/* Holiday Row */}
                        <tr className="text-[11px]">
                            <td colSpan="7" className="p-2 pl-10 text-slate-500 border-r border-slate-200 italic font-medium">Holiday (Public/National)</td>
                            {leaveRows.holiday.map((h, i) => {
                                const isHoliday = isHolidayDay(i);
                                return (
                                    <td key={i} className={`p-0 border-r border-slate-100 ${isHoliday ? 'bg-amber-100/50' : 'bg-amber-50/10'}`}>
                                        <input
                                            type="text"
                                            value={h.value}
                                            disabled={true}
                                            className={`w-full text-center h-full outline-none bg-transparent font-bold ${isHoliday ? 'text-amber-700' : 'text-amber-600/50'} cursor-not-allowed`}
                                        />
                                    </td>
                                );
                            })}
                            <td className="text-center font-bold text-amber-600">{calculateRowTotal(leaveRows.holiday).toFixed(2)}</td>
                            <td colSpan="2"></td>
                        </tr>

                        {/* Leave Rows S, C, E */}
                        {['S', 'C', 'E'].map((type, idx) => {
                            const key = `leave${type}`;
                            return (
                                <tr key={type} className="text-[11px]">
                                    <td colSpan="7" className="p-2 pl-10 text-slate-500 border-r border-slate-200 italic font-medium">Leave ({type})</td>
                                    {leaveRows[key].map((h, i) => {
                                        return (
                                            <td key={i} className={`p-0 border-r border-slate-100 bg-rose-50/10`}>
                                                <input
                                                    type="text"
                                                    value={h.value}
                                                    disabled={readOnly}
                                                    onChange={(e) => handleLeaveHourChange(key, i, e.target.value)}
                                                    className={`w-full text-center h-full outline-none bg-transparent font-bold text-rose-600 outline-none hover:bg-white/50 focus:bg-white transition-colors`}
                                                />
                                            </td>
                                        );
                                    })}
                                    <td className="text-center font-bold text-rose-600/50">{calculateRowTotal(leaveRows[key]).toFixed(2)}</td>
                                    <td colSpan="2"></td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Footer Summary */}
            <div className="bg-slate-900 text-white p-2 border-t border-slate-800 shrink-0">
                <div className="flex justify-end items-center max-w-6xl mx-auto px-8">
                    <div className="text-right">
                        <p className="text-[9px] uppercase font-black text-slate-500 tracking-wider">Total Hours</p>
                        <p className="text-xl font-black text-emerald-400">
                            {getGrandTotal().toFixed(2)}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WeeklyTimesheetGrid;
