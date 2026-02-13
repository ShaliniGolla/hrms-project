import React, { useState, useEffect } from "react";

export default function AddEmployeeModal({ open, onClose, onEmployeeCreated }) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // User creation popup state
    const [showUserPopup, setShowUserPopup] = useState(false);
    const [userCreateLoading, setUserCreateLoading] = useState(false);
    const [userCreateError, setUserCreateError] = useState("");
    const [userCreated, setUserCreated] = useState(false);
    const [createdEmployee, setCreatedEmployee] = useState(null);

    const [userForm, setUserForm] = useState({
        username: "", // This will be the Company ID
        name: "",
        email: "",
    });

    const [formData, setFormData] = useState({
        // Part 1: Personal
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        dateOfBirth: "",
        gender: "",
        // Part 2: Company
        oryfolksId: "",
        designation: "",
        corporateEmail: "",
        joiningDate: ""
    });

    useEffect(() => {
        if (open) {
            setStep(1);
            setError("");
            setFormData({
                firstName: "",
                lastName: "",
                email: "",
                phoneNumber: "",
                dateOfBirth: "",
                gender: "",
                oryfolksId: "OF-",
                designation: "",
                corporateEmail: "",
                joiningDate: ""
            });
            setShowUserPopup(false);
            setUserCreated(false);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [open]);

    const handleNext = () => {
        if (step === 1) {
            if (!formData.firstName || !formData.lastName || !formData.email || !formData.phoneNumber || !formData.dateOfBirth || !formData.gender) {
                setError("Please fill in all personal details");
                return;
            }

            // Personal Email Validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email)) {
                setError("Please enter a valid personal email address");
                return;
            }

            setError("");
            setStep(2);
        }
    };

    const handlePrev = () => {
        setStep(1);
    };

    const handleSubmit = async () => {
        if (!formData.oryfolksId || !formData.designation || !formData.corporateEmail || !formData.joiningDate) {
            setError("Please fill in all company details");
            return;
        }

        // Specifically ensure we ONLY use corporate email for user account creation
        const fullName = `${formData.firstName} ${formData.lastName}`;
        const companyId = formData.oryfolksId;
        const companyEmail = `${formData.corporateEmail}@oryfolks.com`;

        setUserForm({
            username: companyId,
            name: fullName,
            email: companyEmail
        });

        setShowUserPopup(true);
        setError("");
    };

    const handleCreateUser = async () => {
        setUserCreateLoading(true);
        setUserCreateError("");

        try {
            // 1. Create Employee and User Account in one atomic call
            const employeeData = {
                ...formData,
                corporateEmail: `${formData.corporateEmail}@oryfolks.com`,
                createAccount: true,
                active: true,
                bloodGroup: "Unknown",
                maritalStatus: "Single",
                presentAddress: "To be updated",
                permanentAddress: "To be updated",
                emergencyContactName: "To be updated",
                emergencyRelationship: "To be updated",
                emergencyPhone: "0000000000"
            };

            const response = await fetch("http://localhost:8080/api/employees", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(employeeData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to create employee and account");
            }

            setUserCreated(true);
            setTimeout(() => {
                onClose();
                if (onEmployeeCreated) onEmployeeCreated();
            }, 2000);

        } catch (err) {
            setUserCreateError(err.message || "Failed to complete setup");
        } finally {
            setUserCreateLoading(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-brand-blue/60 backdrop-blur-sm transition-opacity" onClick={showUserPopup ? null : onClose} />

            <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-8 py-6 bg-gradient-to-r from-brand-blue to-brand-blue/90 border-b border-brand-blue/10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl">
                                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="8.5" cy="7" r="4"></circle>
                                    <line x1="20" y1="8" x2="20" y2="14"></line>
                                    <line x1="23" y1="11" x2="17" y2="11"></line>
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">Add New Employee</h2>
                                <p className="text-white/60 text-xs font-medium mt-0.5">
                                    Step {step} of 2 • {step === 1 ? "Personal Information" : "Company Details"}
                                </p>
                            </div>
                        </div>
                        {!showUserPopup && (
                            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-all text-white/80 hover:text-white">
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        )}
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-6 flex gap-2">
                        <div className={`h-1 flex-1 rounded-full transition-all ${step >= 1 ? 'bg-brand-yellow' : 'bg-white/20'}`}></div>
                        <div className={`h-1 flex-1 rounded-full transition-all ${step >= 2 ? 'bg-brand-yellow' : 'bg-white/20'}`}></div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg flex items-center gap-3">
                            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                            <span className="text-sm font-medium">{error}</span>
                        </div>
                    )}

                    {step === 1 ? (
                        <div className="space-y-6">
                            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                                <h3 className="text-lg font-bold text-brand-blue mb-4 flex items-center gap-2">
                                    <div className="w-8 h-8 bg-brand-blue/10 rounded-lg flex items-center justify-center">
                                        <svg className="w-4 h-4 text-brand-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                    </div>
                                    Personal Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-2">First Name *</label>
                                        <input
                                            type="text"
                                            value={formData.firstName}
                                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-medium text-brand-blue focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all outline-none"
                                            placeholder="John"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-2">Last Name *</label>
                                        <input
                                            type="text"
                                            value={formData.lastName}
                                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-medium text-brand-blue focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all outline-none"
                                            placeholder="Doe"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-gray-600 mb-2">Personal Email *</label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-medium text-brand-blue focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all outline-none"
                                            placeholder="john.doe@example.com"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-2">Phone Number *</label>
                                        <input
                                            type="text"
                                            value={formData.phoneNumber}
                                            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-medium text-brand-blue focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all outline-none"
                                            placeholder="10 digit number"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-2">Date of Birth *</label>
                                        <input
                                            type="date"
                                            value={formData.dateOfBirth}
                                            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-medium text-brand-blue focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-2">Gender *</label>
                                        <select
                                            value={formData.gender}
                                            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-medium text-brand-blue focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all outline-none"
                                        >
                                            <option value="">Select Gender</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                                <h3 className="text-lg font-bold text-brand-blue mb-4 flex items-center gap-2">
                                    <div className="w-8 h-8 bg-brand-blue/10 rounded-lg flex items-center justify-center">
                                        <svg className="w-4 h-4 text-brand-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                                    </div>
                                    Company Details
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-2">Company ID *</label>
                                        <input
                                            type="text"
                                            value={formData.oryfolksId}
                                            onChange={(e) => {
                                                const val = e.target.value.toUpperCase();
                                                if (val.startsWith("OF-")) {
                                                    setFormData({ ...formData, oryfolksId: val });
                                                } else if (val === "OF" || val === "O") {
                                                    // Allow deletion if they really want to clear it, but typically we enforce structure.
                                                    // Better UX: Don't allow removing 'OF-'
                                                    setFormData({ ...formData, oryfolksId: "OF-" });
                                                } else {
                                                    // If they paste something without OF-, prepend it? Or just reset.
                                                    // Simple enforcement:
                                                    setFormData({ ...formData, oryfolksId: "OF-" + val.replace(/^OF-/, '') });
                                                }
                                            }}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-medium text-brand-blue focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all outline-none"
                                            placeholder="OF-1001"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-2">Designation *</label>
                                        <input
                                            type="text"
                                            value={formData.designation}
                                            onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-medium text-brand-blue focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all outline-none"
                                            placeholder="Software Engineer"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-2">Corporate Email *</label>
                                        <div className="flex">
                                            <input
                                                type="text"
                                                value={formData.corporateEmail}
                                                onChange={(e) => setFormData({ ...formData, corporateEmail: e.target.value })}
                                                className="flex-1 bg-gray-50 border border-gray-200 rounded-l-lg px-4 py-2.5 text-sm font-medium text-brand-blue focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all outline-none"
                                                placeholder="john.doe"
                                            />
                                            <span className="inline-flex items-center px-3 rounded-r-lg border border-l-0 border-gray-200 bg-gray-100 text-gray-500 text-sm font-bold">
                                                @oryfolks.com
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-2">Joining Date *</label>
                                        <input
                                            type="date"
                                            value={formData.joiningDate}
                                            onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-medium text-brand-blue focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-8 py-5 bg-white border-t border-gray-200 flex justify-between items-center">
                    {step === 2 ? (
                        <button
                            onClick={handlePrev}
                            className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:text-brand-blue hover:bg-gray-50 rounded-lg transition-all flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                            Back
                        </button>
                    ) : (
                        <button
                            onClick={onClose}
                            className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                            Cancel
                        </button>
                    )}

                    {step === 1 ? (
                        <button
                            onClick={handleNext}
                            className="px-8 py-2.5 bg-brand-blue text-white rounded-lg font-bold text-sm hover:bg-brand-blue/90 transition-all flex items-center gap-2 shadow-lg shadow-brand-blue/20"
                        >
                            Continue
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="px-8 py-2.5 bg-brand-yellow text-brand-blue rounded-lg font-bold text-sm hover:bg-brand-yellow/90 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-yellow/20"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" opacity="0.25"></circle><path d="M4 12a8 8 0 018-8" opacity="0.75"></path></svg>
                                    Creating...
                                </>
                            ) : (
                                <>
                                    Create Employee
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
                                </>
                            )}
                        </button>
                    )}
                </div>

                {/* ================= USER CREATION POPUP ================= */}
                {showUserPopup && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-brand-blue/90 backdrop-blur-sm p-4">
                        <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
                            {/* Popup Header */}
                            <div className="px-6 py-5 bg-gradient-to-r from-brand-blue to-brand-blue/90">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                        <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">Setup Access</h3>
                                        <p className="text-white/60 text-xs font-medium">Create login credentials for {userForm.name}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Popup Content */}
                            <div className="p-6 space-y-5">
                                {userCreateError && (
                                    <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg">
                                        <p className="text-sm font-medium">{userCreateError}</p>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-2">Username (Company ID)</label>
                                    <input
                                        type="text"
                                        value={userForm.username}
                                        readOnly
                                        className="w-full bg-gray-100 border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-500 cursor-not-allowed outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-2">Corporate Email</label>
                                    <input
                                        type="email"
                                        value={userForm.email || ''}
                                        readOnly
                                        className="w-full bg-gray-100 border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-500 cursor-not-allowed outline-none"
                                    />
                                </div>

                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                        <span className="text-xs font-bold text-amber-900">Default Password</span>
                                    </div>
                                    <code className="px-2.5 py-1 bg-white border border-amber-300 rounded text-xs font-bold text-amber-900 font-mono">emp123</code>
                                </div>

                                {userCreated ? (
                                    <div className="bg-emerald-500 text-white rounded-lg p-4 flex items-center gap-3">
                                        <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"></path></svg>
                                        <span className="text-sm font-bold">Account Created Successfully</span>
                                    </div>
                                ) : (
                                    <div className="space-y-3 pt-2">
                                        <button
                                            onClick={handleCreateUser}
                                            disabled={userCreateLoading}
                                            className="w-full py-3 bg-brand-blue text-white rounded-lg font-bold text-sm hover:bg-brand-blue/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-blue/20"
                                        >
                                            {userCreateLoading ? "Creating Account..." : "Confirm & Create Account"}
                                        </button>

                                        <button
                                            onClick={() => {
                                                setShowUserPopup(false);
                                                setUserCreateError("");
                                            }}
                                            className="w-full py-2 text-xs font-bold text-gray-500 hover:text-brand-blue transition-all flex items-center justify-center gap-1"
                                        >
                                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                                            Back to Company Details
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
