import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from '../../assets/ORYFOLKS-logo.png';
import Sidebar from "../../components/Sidebar";

export default function EmployeeOwnProfile({ hideSidebar = false }) {
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState("personal");
  const [user, setUser] = useState({});
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [fetchingBalance, setFetchingBalance] = useState(false);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user")) || {};
    setUser(userData);
    fetchEmpData();
  }, []);

  useEffect(() => {
    const fetchLeaveBalance = async () => {
      if (activeSection === 'leave_balance' && employee?.id && !leaveBalance) {
        setFetchingBalance(true);
        try {
          const res = await fetch(`http://localhost:8080/api/leaves/balance/${employee.id}`, { credentials: "include" });
          if (res.ok) {
            const json = await res.json();
            setLeaveBalance(json.data);
          }
        } catch (err) {
          console.error("Failed to fetch leave balance:", err);
        } finally {
          setFetchingBalance(false);
        }
      }
    };
    fetchLeaveBalance();
  }, [activeSection, employee?.id, leaveBalance]);

  const fetchEmpData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://localhost:8080/me/employee", {
        credentials: "include"
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to load your profile");
      }

      const json = await res.json();
      const data = json.data || json || {};
      setEmployee(data);

      // Populate form
      setForm({
        role: data.designation || "",
        companyId: data.oryfolksId || "",
        companyMail: data.corporateEmail || "",
        joiningDate: data.joiningDate || "",
        personalEmail: data.email || "",
        mobile: data.phoneNumber || "",
        alternateMobile: data.alternatePhone || "",
        dob: data.dateOfBirth || "",
        gender: data.gender || "",
        maritalStatus: data.maritalStatus || "",
        bloodGroup: data.bloodGroup || "",
        currentAddress: data.presentAddress || "",
        permanentAddress: data.permanentAddress || "",
        aadhar: data.addressProof === 'Aadhar' ? (data.addressProofNumber || '') : '',
        pan: data.addressProof === 'PAN' ? (data.addressProofNumber || '') : '',
        passport: data.passportNo || "",
        emergencyContactName: data.emergencyContactName || "",
        emergencyRelationship: data.emergencyRelationship || "",
        emergencyPhone: data.emergencyPhone || "",
        emergencyAddress: data.emergencyAddress || "",
        education: data.educationList || [],
        employmentHistory: (data.experienceList || []).map(exp => ({
          ...exp,
          startDate: exp.startDate ? convertDateToMonth(exp.startDate) : '',
          endDate: exp.endDate ? convertDateToMonth(exp.endDate) : ''
        })),
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        photoUrl: data.photoPath || "",
      });

      if (data.documentList) {
        const files = {
          edu_10th: null,
          edu_12th: null,
          edu_grad: null,
          educational: [],
          course: [],
          technical: [],
          employment: []
        };

        data.documentList.forEach(doc => {
          const fileData = {
            id: doc.id,
            name: doc.fileName,
            preview: doc.fileUrl,
            type: doc.contentType,
            label: doc.documentName,
            size: (doc.fileSize / 1024).toFixed(2) + ' KB',
            date: new Date(doc.uploadedAt).toLocaleDateString()
          };

          if (doc.documentType === 'EDU_10TH') files.edu_10th = fileData;
          else if (doc.documentType === 'EDU_12TH') files.edu_12th = fileData;
          else if (doc.documentType === 'GRADUATION') files.edu_grad = fileData;
          else if (doc.documentType === 'OTHER') files.educational.push(fileData);
          else if (doc.documentType === 'TECHNICAL') files.technical.push(fileData);
          else if (doc.documentType === 'EMPLOYMENT') files.employment.push(fileData);
        });
        setUploadedFiles(files);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load your profile");
    } finally {
      setLoading(false);
    }
  };

  const sections = [
    {
      id: "personal",
      label: "Personal Details",
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      )
    },
    {
      id: "emergency",
      label: "Emergency contact",
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
        </svg>
      )
    },
    {
      id: "education",
      label: "Education details",
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 10L12 5L2 10L12 15L22 10Z"></path>
          <path d="M6 12V17C6 17 8 20 12 20C16 20 18 17 18 17V12"></path>
        </svg>
      )
    },
    {
      id: "employment",
      label: "Employment history",
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
        </svg>
      )
    },
    {
      id: "documents",
      label: "Documents",
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
      )
    },
    {
      id: "leave_balance",
      label: "Leave Balance",
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
      )
    },
  ];

  const [uploadedFiles, setUploadedFiles] = useState({
    edu_10th: null,
    edu_12th: null,
    edu_grad: null,
    educational: [],
    course: [],
    technical: [],
    employment: []
  });

  const [otherEduLabel, setOtherEduLabel] = useState("");

  const convertDateToMonth = (dateValue) => {
    if (!dateValue) return '';
    if (dateValue.match(/^\d{4}-\d{2}$/)) return dateValue;
    if (dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) return dateValue.substring(0, 7);
    return dateValue;
  };

  const convertMonthToDate = (monthValue) => {
    if (!monthValue || !monthValue.trim()) return null;
    if (monthValue.match(/^\d{4}-\d{2}-\d{2}$/)) return monthValue;
    if (monthValue.match(/^\d{4}-\d{2}$/)) return monthValue + "-01";
    return null;
  };

  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      if (employee?.id) formData.append('employeeId', employee.id);

      try {
        const res = await fetch("http://localhost:8080/api/employees/upload-photo", {
          method: "POST",
          body: formData,
          credentials: "include"
        });

        if (!res.ok) throw new Error("Photo upload failed");

        const json = await res.json();
        const photoPath = json.data;
        setForm(f => ({ ...f, photoUrl: photoPath }));
        setEmployee(p => ({ ...p, photoPath }));
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const handleEditToggle = async () => {
    if (editing) {
      try {
        setLoading(true);
        const payload = {
          email: form.personalEmail || form.companyMail || employee?.email || "",
          firstName: form.firstName || employee?.firstName || "",
          lastName: form.lastName || employee?.lastName || "",
          phoneNumber: form.mobile || form.phoneNumber || "",
          alternatePhone: form.alternateMobile || form.alternatePhone || "",
          dateOfBirth: form.dob || form.dateOfBirth || null,
          gender: form.gender || null,
          maritalStatus: form.maritalStatus || null,
          bloodGroup: form.bloodGroup || null,
          presentAddress: form.currentAddress || form.presentAddress || null,
          permanentAddress: form.permanentAddress || null,
          addressProof: form.aadhar ? 'Aadhar' : form.pan ? 'PAN' : form.addressProof || null,
          addressProofNumber: form.aadhar ? form.aadhar : form.pan ? form.pan : form.addressProofNumber || null,
          passportNo: form.passport || null,
          emergencyContactName: form.emergencyContactName || null,
          emergencyRelationship: form.emergencyRelationship || null,
          emergencyPhone: form.emergencyPhone || null,
          emergencyAddress: form.emergencyAddress || null,
          educationList: Array.isArray(form.education) ? form.education : [],
          experienceList: Array.isArray(form.employmentHistory)
            ? form.employmentHistory.map(exp => ({
              ...exp,
              startDate: convertMonthToDate(exp.startDate),
              endDate: convertMonthToDate(exp.endDate)
            }))
            : [],
          photoPath: form.photoUrl || null,
          designation: form.role || null,
          corporateEmail: form.companyMail || null,
        };

        const res = await fetch(`http://localhost:8080/api/employees/${employee.id}`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(json.message || "Failed to save");
        }

        const json = await res.json();
        const updated = json.data || json || payload;
        setEmployee((p) => ({ ...p, ...updated }));
        setEditing(false);
      } catch (err) {
        alert(err.message);
      } finally {
        setLoading(false);
      }
    } else {
      setEditing(true);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleEducationChange = (index, field, value) => {
    const education = [...(form.education || [])];
    education[index] = { ...education[index], [field]: value };
    setForm({ ...form, education });
  };

  const addEducation = () => {
    setForm({
      ...form,
      education: [...(form.education || []), { institutionName: "", degreeLevel: "", startYear: "", endYear: "" }]
    });
  };

  const removeEducation = (index) => {
    const education = [...(form.education || [])];
    education.splice(index, 1);
    setForm({ ...form, education });
  };

  const handleEmploymentChange = (index, field, value) => {
    const employmentHistory = [...(form.employmentHistory || [])];
    employmentHistory[index] = { ...employmentHistory[index], [field]: value };
    setForm({ ...form, employmentHistory });
  };

  const addEmployment = () => {
    setForm({
      ...form,
      employmentHistory: [...(form.employmentHistory || []), {
        employerName: "", businessType: "", designation: "", startDate: "", endDate: "",
        employerAddress: "", reportingManagerName: "", reportingManagerEmail: ""
      }]
    });
  };

  const removeEmployment = (index) => {
    const employmentHistory = [...(form.employmentHistory || [])];
    employmentHistory.splice(index, 1);
    setForm({ ...form, employmentHistory });
  };

  const handleFileUpload = async (category, event, isFixed = false) => {
    const file = event.target.files[0];
    if (file) {
      let finalLabel = "";
      let docType = "";

      if (isFixed) {
        if (category === 'edu_10th') { finalLabel = '10th Standard'; docType = 'EDU_10TH'; }
        else if (category === 'edu_12th') { finalLabel = '12th / Diploma'; docType = 'EDU_12TH'; }
        else if (category === 'edu_grad') { finalLabel = 'Graduation'; docType = 'GRADUATION'; }
      } else {
        if (category === 'educational') {
          if (!otherEduLabel.trim()) { alert("Please enter the Degree Name before uploading."); return; }
          finalLabel = otherEduLabel;
          docType = 'OTHER';
        } else if (category === 'technical') {
          const label = window.prompt("Please enter the name for this Technical Certification:");
          if (!label || !label.trim()) return;
          finalLabel = label.trim();
          docType = 'TECHNICAL';
        } else if (category === 'employment') {
          const label = window.prompt("Please enter the name for this Employment Certification:");
          if (!label || !label.trim()) return;
          finalLabel = label.trim();
          docType = 'EMPLOYMENT';
        }
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', docType);
      formData.append('documentName', finalLabel);
      if (employee?.id) formData.append('employeeId', employee.id);

      try {
        const res = await fetch("http://localhost:8080/api/documents/upload", {
          method: "POST",
          body: formData,
          credentials: "include"
        });

        if (!res.ok) throw new Error("Upload failed");

        const json = await res.json();
        const savedDoc = json.data;

        const newFile = {
          id: savedDoc.id,
          name: savedDoc.fileName,
          size: (savedDoc.fileSize / 1024).toFixed(2) + ' KB',
          date: new Date(savedDoc.uploadedAt).toLocaleDateString(),
          type: savedDoc.contentType,
          preview: savedDoc.fileUrl,
          label: savedDoc.documentName
        };

        if (isFixed) {
          setUploadedFiles(prev => ({ ...prev, [category]: newFile }));
        } else {
          setUploadedFiles(prev => ({ ...prev, [category]: [...prev[category], newFile] }));
          if (category === 'educational') setOtherEduLabel("");
        }
      } catch (err) {
        alert(err.message);
      }
      event.target.value = null;
    }
  };

  const removeFile = async (category, index = -1) => {
    const fileToRemove = index === -1 ? uploadedFiles[category] : uploadedFiles[category][index];
    if (!fileToRemove || !fileToRemove.id) return;
    if (!window.confirm("Are you sure you want to delete this document?")) return;

    try {
      const res = await fetch(`http://localhost:8080/api/documents/${fileToRemove.id}`, {
        method: "DELETE",
        credentials: "include"
      });

      if (!res.ok) throw new Error("Delete failed");

      if (index === -1) {
        setUploadedFiles(prev => ({ ...prev, [category]: null }));
      } else {
        setUploadedFiles(prev => ({ ...prev, [category]: prev[category].filter((_, i) => i !== index) }));
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const navItems = user.role === "REPORTING_MANAGER" ? [
    { tab: "dashboard", label: "Dashboard", to: "/reporting-dashboard", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
    { tab: "team", label: "My Team", to: "/reporting-team", icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" /></svg> },
    { tab: "profile", label: "My Profile", to: "/employee/profile", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
  ] : [
    { tab: "dashboard", label: "Dashboard", to: user.role === 'HR' ? "/hr" : "/employee", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
    { tab: "profile", label: "My Profile", to: "/employee/profile", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
    { tab: "timesheet", label: "Time Sheet", to: "/employee/timesheet", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  ];

  if (user.role === 'HR') {
    navItems.push({
      tab: "actions",
      label: "Actions",
      to: "/hr/actions",
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12" y2="16"></line>
        </svg>
      ),
    });
  }

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      navigate("/login");
    }
  };

  return (
    <div className={hideSidebar ? "w-full" : "flex h-screen w-screen bg-[#e3edf9] overflow-hidden"}>
      {!hideSidebar && (
        <Sidebar
          activeTab="profile"
          navItems={navItems}
          handleLogout={handleLogout}
        />
      )}

      <main className={hideSidebar ? "flex-1 overflow-y-auto" : "flex-1 overflow-y-auto p-4 md:p-8"}>
        <div className="max-w-6xl mx-auto space-y-6">
          <header className="flex justify-end p-2">
            <div className="flex items-center gap-3">
              <button
                onClick={handleEditToggle}
                className={`px-6 py-2 ${editing ? 'bg-green-500 text-white' : 'bg-brand-yellow text-brand-blue'} font-bold rounded-xl shadow-lg hover:opacity-90 transition-all flex items-center gap-2 whitespace-nowrap`}
              >
                {loading ? "..." : (editing ? "Save Profile" : "Edit Profile")}
              </button>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <aside className="lg:col-span-1 space-y-2">
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-brand-blue/5 sticky top-0">
                <div className="flex flex-col gap-1">
                  {sections.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setActiveSection(s.id)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${activeSection === s.id
                        ? 'bg-brand-yellow text-brand-blue shadow-md'
                        : 'text-brand-blue/40 hover:bg-gray-50 hover:text-brand-blue'
                        }`}
                    >
                      {s.icon}
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </aside>

            <div className="lg:col-span-3">
              <div className="bg-white rounded-3xl shadow-xl border border-brand-blue/5 overflow-hidden min-h-[600px]">
                {loading && !editing ? (
                  <div className="p-20 flex flex-col items-center justify-center space-y-4">
                    <div className="w-12 h-12 border-4 border-brand-yellow border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-brand-blue/40 font-bold uppercase tracking-widest text-xs">Loading Profile...</p>
                  </div>
                ) : (
                  <div className="p-8 md:p-10">
                    {activeSection === 'personal' && (
                      <div className="space-y-8">
                        <div className="flex flex-col md:flex-row items-center gap-8 pb-8 border-b border-gray-100">
                          <div className="w-32 h-32 bg-brand-blue/5 rounded-full flex items-center justify-center border-4 border-white shadow-xl overflow-hidden relative group">
                            {form.photoUrl || employee?.photoPath ? (
                              <img src={form.photoUrl || employee.photoPath} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                              <svg className="w-16 h-16 text-brand-blue/20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                              </svg>
                            )}
                            {editing && (
                              <label className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-white text-[10px] font-bold uppercase">Change</span>
                                <input type="file" className="hidden" onChange={handlePhotoUpload} accept="image/*" />
                              </label>
                            )}
                          </div>
                          <div className="text-center md:text-left">
                            <h2 className="text-2xl font-bold text-brand-blue">{employee?.firstName} {employee?.lastName}</h2>
                            <p className="text-brand-blue/40 font-bold uppercase tracking-widest text-xs mt-1">{form.role || "Ory Folks Team"}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-brand-blue/40 uppercase tracking-widest ml-1">Full Name</label>
                            <div className="flex gap-2">
                              <input name="firstName" value={form.firstName || ''} onChange={handleChange} disabled={!editing} className={`w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-brand-blue focus:ring-2 focus:ring-brand-yellow/50 transition-all ${!editing ? 'cursor-not-allowed opacity-80' : ''}`} placeholder="First Name" />
                              <input name="lastName" value={form.lastName || ''} onChange={handleChange} disabled={!editing} className={`w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-brand-blue focus:ring-2 focus:ring-brand-yellow/50 transition-all ${!editing ? 'cursor-not-allowed opacity-80' : ''}`} placeholder="Last Name" />
                            </div>
                          </div>
                          {[
                            { label: 'Company ID', name: 'companyId', disabled: true },
                            { label: 'Corporate Email', name: 'companyMail', disabled: true },
                            { label: 'Joining Date', name: 'joiningDate', type: 'date', disabled: true },
                            { label: 'Personal Email', name: 'personalEmail' },
                            { label: 'Mobile No', name: 'mobile' },
                            { label: 'Alternate Mobile', name: 'alternateMobile' },
                            { label: 'Date of Birth', name: 'dob', type: 'date' },
                            { label: 'Gender', name: 'gender' },
                            { label: 'Marital Status', name: 'maritalStatus' },
                            { label: 'Blood Group', name: 'bloodGroup' },
                            { label: 'Aadhar No', name: 'aadhar' },
                            { label: 'PAN No', name: 'pan' },
                            { label: 'Passport No', name: 'passport' },
                          ].map((field) => (
                            <div key={field.name} className="space-y-2">
                              <label className="text-xs font-bold text-brand-blue/40 uppercase tracking-widest ml-1">{field.label}</label>
                              <input
                                type={field.type || "text"}
                                name={field.name}
                                value={form[field.name] || ''}
                                onChange={handleChange}
                                disabled={!editing || field.disabled}
                                className={`w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-brand-blue focus:ring-2 focus:ring-brand-yellow/50 transition-all ${(!editing || field.disabled) ? 'cursor-not-allowed opacity-80' : ''}`}
                              />
                            </div>
                          ))}
                          <div className="md:col-span-2 space-y-2">
                            <label className="text-xs font-bold text-brand-blue/40 uppercase tracking-widest ml-1">Current Address</label>
                            <textarea name="currentAddress" value={form.currentAddress || ''} onChange={handleChange} disabled={!editing} rows="2" className={`w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-brand-blue focus:ring-2 focus:ring-brand-yellow/50 transition-all ${!editing ? 'cursor-not-allowed opacity-80' : ''}`} />
                          </div>
                        </div>
                      </div>
                    )}

                    {activeSection === 'emergency' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[
                          { label: 'Contact Name', name: 'emergencyContactName' },
                          { label: 'Relationship', name: 'emergencyRelationship' },
                          { label: 'Phone Number', name: 'emergencyPhone' },
                        ].map((field) => (
                          <div key={field.name} className="space-y-2">
                            <label className="text-xs font-bold text-brand-blue/40 uppercase tracking-widest ml-1">{field.label}</label>
                            <input
                              name={field.name}
                              value={form[field.name] || ''}
                              onChange={handleChange}
                              disabled={!editing}
                              className={`w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-brand-blue focus:ring-2 focus:ring-brand-yellow/50 transition-all ${!editing ? 'cursor-not-allowed opacity-80' : ''}`}
                            />
                          </div>
                        ))}
                        <div className="md:col-span-2 space-y-2">
                          <label className="text-xs font-bold text-brand-blue/40 uppercase tracking-widest ml-1">Address</label>
                          <textarea name="emergencyAddress" value={form.emergencyAddress || ''} onChange={handleChange} disabled={!editing} rows="3" className={`w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-brand-blue focus:ring-2 focus:ring-brand-yellow/50 transition-all ${!editing ? 'cursor-not-allowed opacity-80' : ''}`} />
                        </div>
                      </div>
                    )}

                    {activeSection === 'education' && (
                      <div className="space-y-6">
                        <div className="flex justify-between items-center">
                          <h3 className="text-xl font-bold text-brand-blue">Educational Qualifications</h3>
                          {editing && (
                            <button onClick={addEducation} className="px-4 py-1.5 bg-brand-blue text-white rounded-lg text-xs font-bold hover:bg-brand-blue-hover transition-all">+ Add New</button>
                          )}
                        </div>
                        <div className="space-y-4">
                          {(form.education || []).map((edu, idx) => (
                            <div key={idx} className="bg-gray-50 p-6 rounded-2xl relative border border-brand-blue/5">
                              {editing && <button onClick={() => removeEducation(idx)} className="absolute top-4 right-4 text-red-400 hover:text-red-500 font-bold text-xs uppercase transition-all">Remove</button>}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-brand-blue/30 uppercase tracking-widest">Institution</label>
                                  <input value={edu.institutionName || ''} onChange={(e) => handleEducationChange(idx, 'institutionName', e.target.value)} disabled={!editing} className="w-full bg-white border-none rounded-lg px-3 py-2 text-sm font-bold text-brand-blue" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-brand-blue/30 uppercase tracking-widest">Degree</label>
                                  <input value={edu.degreeLevel || ''} onChange={(e) => handleEducationChange(idx, 'degreeLevel', e.target.value)} disabled={!editing} className="w-full bg-white border-none rounded-lg px-3 py-2 text-sm font-bold text-brand-blue" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-brand-blue/30 uppercase tracking-widest">Start Year</label>
                                  <input type="number" value={edu.startYear || ''} onChange={(e) => handleEducationChange(idx, 'startYear', e.target.value)} disabled={!editing} className="w-full bg-white border-none rounded-lg px-3 py-2 text-sm font-bold text-brand-blue" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-brand-blue/30 uppercase tracking-widest">End Year</label>
                                  <input type="number" value={edu.endYear || ''} onChange={(e) => handleEducationChange(idx, 'endYear', e.target.value)} disabled={!editing} className="w-full bg-white border-none rounded-lg px-3 py-2 text-sm font-bold text-brand-blue" />
                                </div>
                              </div>
                            </div>
                          ))}
                          {(!form.education || form.education.length === 0) && (
                            <div className="text-center py-20 text-brand-blue/20 font-bold uppercase tracking-widest">No education details added</div>
                          )}
                        </div>
                      </div>
                    )}

                    {activeSection === 'employment' && (
                      <div className="space-y-6">
                        <div className="flex justify-between items-center">
                          <h3 className="text-xl font-bold text-brand-blue">Work Experience</h3>
                          {editing && (
                            <button onClick={addEmployment} className="px-4 py-1.5 bg-brand-blue text-white rounded-lg text-xs font-bold hover:bg-brand-blue-hover transition-all">+ Add Gap / Job</button>
                          )}
                        </div>
                        <div className="space-y-4">
                          {(form.employmentHistory || []).map((exp, idx) => (
                            <div key={idx} className="bg-gray-50 p-6 rounded-2xl relative border border-brand-blue/5">
                              {editing && <button onClick={() => removeEmployment(idx)} className="absolute top-4 right-4 text-red-400 hover:text-red-500 font-bold text-xs uppercase transition-all">Remove</button>}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2 space-y-1">
                                  <label className="text-[10px] font-bold text-brand-blue/30 uppercase tracking-widest">Company Name</label>
                                  <input value={exp.employerName || ''} onChange={(e) => handleEmploymentChange(idx, 'employerName', e.target.value)} disabled={!editing} className="w-full bg-white border-none rounded-lg px-3 py-2 text-sm font-bold text-brand-blue" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-brand-blue/30 uppercase tracking-widest">Designation</label>
                                  <input value={exp.designation || ''} onChange={(e) => handleEmploymentChange(idx, 'designation', e.target.value)} disabled={!editing} className="w-full bg-white border-none rounded-lg px-3 py-2 text-sm font-bold text-brand-blue" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-brand-blue/30 uppercase tracking-widest">Business Type</label>
                                  <input value={exp.businessType || ''} onChange={(e) => handleEmploymentChange(idx, 'businessType', e.target.value)} disabled={!editing} className="w-full bg-white border-none rounded-lg px-3 py-2 text-sm font-bold text-brand-blue" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-brand-blue/30 uppercase tracking-widest">Start Date</label>
                                  <input type="month" value={exp.startDate || ''} onChange={(e) => handleEmploymentChange(idx, 'startDate', e.target.value)} disabled={!editing} className="w-full bg-white border-none rounded-lg px-3 py-2 text-sm font-bold text-brand-blue" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-brand-blue/30 uppercase tracking-widest">End Date</label>
                                  <input type="month" value={exp.endDate || ''} onChange={(e) => handleEmploymentChange(idx, 'endDate', e.target.value)} disabled={!editing} className="w-full bg-white border-none rounded-lg px-3 py-2 text-sm font-bold text-brand-blue" />
                                </div>
                              </div>
                            </div>
                          ))}
                          {(!form.employmentHistory || form.employmentHistory.length === 0) && (
                            <div className="text-center py-20 text-brand-blue/20 font-bold uppercase tracking-widest">No work history added</div>
                          )}
                        </div>
                      </div>
                    )}

                    {activeSection === 'documents' && (
                      <div className="space-y-8">
                        <div className="bg-gray-50 rounded-2xl p-6 border border-brand-blue/5">
                          <div className="mb-6">
                            <h3 className="text-xl font-bold text-brand-blue">Educational Certifications</h3>
                            <p className="text-xs text-brand-blue/40 font-medium">Your uploaded academic records</p>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                              { id: 'edu_10th', label: '10th Standard' },
                              { id: 'edu_12th', label: '12th / Diploma' },
                              { id: 'edu_grad', label: 'Graduation' }
                            ].map((edu) => (
                              <div key={edu.id} className="bg-white p-4 rounded-xl border border-brand-blue/5 flex flex-col gap-3 shadow-sm relative group">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-bold text-brand-blue">{edu.label}</span>
                                  {!uploadedFiles[edu.id] ? (
                                    <label className="cursor-pointer text-brand-blue hover:text-brand-yellow transition-all">
                                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                        <polyline points="17 8 12 3 7 8"></polyline>
                                        <line x1="12" y1="3" x2="12" y2="15"></line>
                                      </svg>
                                      <input type="file" className="hidden" onChange={(e) => handleFileUpload(edu.id, e, true)} accept=".pdf,.jpg,.jpeg,.png" />
                                    </label>
                                  ) : (
                                    <button onClick={() => removeFile(edu.id)} className="text-red-500 hover:bg-red-50 p-1 rounded-lg">
                                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="3 6 5 6 21 6"></polyline>
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                      </svg>
                                    </button>
                                  )}
                                </div>
                                <div className="h-[100px] flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden border border-dashed border-brand-blue/10 relative cursor-pointer" onClick={() => uploadedFiles[edu.id] && window.open(uploadedFiles[edu.id].preview, '_blank')}>
                                  {uploadedFiles[edu.id] ? (
                                    <>
                                      {uploadedFiles[edu.id].type.startsWith('image/') ? (
                                        <img src={uploadedFiles[edu.id].preview} alt={edu.label} className="w-full h-full object-cover" />
                                      ) : (
                                        <div className="flex flex-col items-center justify-center text-brand-blue/40">
                                          <svg className="w-8 h-8 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                            <polyline points="14 2 14 8 20 8"></polyline>
                                          </svg>
                                          <span className="text-[9px] font-bold text-center px-2 break-all line-clamp-2">{uploadedFiles[edu.id].name}</span>
                                        </div>
                                      )}
                                      <div className="absolute inset-0 bg-brand-blue/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold uppercase tracking-widest">VIEW</div>
                                    </>
                                  ) : (
                                    <span className="text-[10px] text-brand-blue/20 font-bold uppercase tracking-widest italic">Not Uploaded</span>
                                  )}
                                </div>
                              </div>
                            ))}
                            <div className="bg-white p-4 rounded-xl border border-brand-blue/5 flex flex-col gap-3 shadow-sm">
                              <span className="text-sm font-bold text-brand-blue">Others</span>
                              <div className="flex gap-2">
                                <input placeholder="Degree Name" className="flex-1 text-[11px] p-2 bg-gray-50 rounded-lg outline-none" value={otherEduLabel} onChange={(e) => setOtherEduLabel(e.target.value)} />
                                <label className="cursor-pointer bg-brand-blue text-white p-2 rounded-lg hover:bg-brand-blue-hover transition-all">
                                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                  <input type="file" className="hidden" onChange={(e) => handleFileUpload('educational', e)} accept=".pdf,.jpg,.jpeg,.png" />
                                </label>
                              </div>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {uploadedFiles.educational.map((file, idx) => (
                                  <div key={file.id} className="group relative w-12 h-12 rounded bg-gray-100 border border-brand-blue/5 flex items-center justify-center cursor-pointer" onClick={() => window.open(file.preview, '_blank')}>
                                    <span className="text-[8px] font-bold text-brand-blue/40">{file.label.substring(0, 3)}...</span>
                                    <button onClick={(e) => { e.stopPropagation(); removeFile('educational', idx); }} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"><svg className="w-2 h-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        {['technical', 'employment'].map((cat) => (
                          <div key={cat} className="bg-white rounded-2xl p-6 border border-brand-blue/5 shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                              <h3 className="text-xl font-bold text-brand-blue capitalize">{cat} Certifications</h3>
                              <label className="cursor-pointer bg-brand-blue text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-brand-blue-hover transition-all flex items-center gap-2">
                                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                Upload New
                                <input type="file" className="hidden" onChange={(e) => handleFileUpload(cat, e)} accept=".pdf,.jpg,.jpeg,.png" />
                              </label>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                              {uploadedFiles[cat].map((file, idx) => (
                                <div key={file.id} className="relative group aspect-square rounded-xl bg-gray-50 border border-brand-blue/5 overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-all" onClick={() => window.open(file.preview, '_blank')}>
                                  {file.type.startsWith('image/') ? (
                                    <img src={file.preview} alt={file.label} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center p-4">
                                      <svg className="w-10 h-10 text-brand-blue/20 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                                      <span className="text-[10px] font-bold text-brand-blue text-center line-clamp-2">{file.label}</span>
                                    </div>
                                  )}
                                  <div className="absolute inset-0 bg-brand-blue/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4">
                                    <div className="flex gap-2">
                                      <button onClick={(e) => { e.stopPropagation(); removeFile(cat, idx); }} className="bg-red-500/80 hover:bg-red-500 text-white p-2 rounded-lg transition-colors"><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
                                      <button className="bg-white text-brand-blue p-2 rounded-lg transition-colors"><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg></button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                              {uploadedFiles[cat].length === 0 && (
                                <div className="col-span-full h-24 flex items-center justify-center border-2 border-dashed border-brand-blue/5 rounded-xl">
                                  <p className="text-[10px] text-brand-blue/10 font-bold uppercase tracking-widest">No certifications</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {activeSection === 'leave_balance' && (
                      <div className="space-y-8">
                        <div className="mb-6">
                          <h3 className="text-xl font-bold text-brand-blue">Leave Balance</h3>
                          <p className="text-xs text-brand-blue/40 font-medium">Your currently available leaves</p>
                        </div>

                        {fetchingBalance ? (
                          <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue"></div>
                          </div>
                        ) : leaveBalance ? (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                              { label: 'Casual Leaves', total: leaveBalance.casualLeavesTotal, used: leaveBalance.casualLeavesUsed, color: 'bg-blue-500' },
                              { label: 'Sick Leaves', total: leaveBalance.sickLeavesTotal, used: leaveBalance.sickLeavesUsed, color: 'bg-green-500' },
                              { label: 'Earned Leaves', total: leaveBalance.earnedLeavesTotal, used: leaveBalance.earnedLeavesUsed, color: 'bg-purple-500' }
                            ].map((leave) => (
                              <div key={leave.label} className="bg-gray-50 rounded-2xl p-6 border border-brand-blue/5 shadow-sm space-y-4">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-bold text-brand-blue">{leave.label}</span>
                                  <div className={`${leave.color} w-3 h-3 rounded-full shadow-sm`}></div>
                                </div>
                                <div className="flex items-end justify-between">
                                  <div>
                                    <span className="text-3xl font-bold text-brand-blue">{leave.total - leave.used}</span>
                                    <span className="text-xs font-bold text-brand-blue/40 ml-1">Days left</span>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-[10px] font-bold text-brand-blue/30 uppercase tracking-widest">Total: {leave.total}</p>
                                    <p className="text-[10px] font-bold text-brand-blue/30 uppercase tracking-widest">Used: {leave.used}</p>
                                  </div>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className={`${leave.color} h-full transition-all duration-500`}
                                    style={{ width: `${leave.total > 0 ? Math.min(100, (leave.used / leave.total) * 100) : 0}%` }}
                                  ></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="bg-gray-50 rounded-2xl p-12 text-center border border-dashed border-brand-blue/10">
                            <p className="text-brand-blue/40 font-bold uppercase tracking-widest text-xs">No leave balance data found</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
