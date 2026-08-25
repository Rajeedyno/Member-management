import React, { useState, useEffect, useCallback } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import StatusBadge from "../components/StatusBadge";
import {
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Building2,
  User,
  CreditCard,
  Calendar,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Send,
  HelpCircle,
  Hash
} from "lucide-react";
import confetti from "canvas-confetti";

export const MemberDashboard = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [applications, setApplications] = useState([]);
  const [activeMembership, setActiveMembership] = useState(null);
  const [membershipTypes, setMembershipTypes] = useState([]);

  // Form State
  const [showResubmitForm, setShowResubmitForm] = useState(false);
  const [applicantType, setApplicantType] = useState(user?.applicantType || "INDIVIDUAL");
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [companyName, setCompanyName] = useState(user?.fullName || "");
  const [nic, setNic] = useState("");
  const [registrationNo, setRegistrationNo] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [membershipTypeId, setMembershipTypeId] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [appRes, typesRes] = await Promise.all([
        api.get("/applications/my"),
        api.get("/membership-types")
      ]);

      if (appRes.success && appRes.data) {
        setApplications(appRes.data.applications || []);
        setActiveMembership(appRes.data.activeMembership || null);

        if (appRes.data.activeMembership) {
          try {
            confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
          } catch (e) {}
        }
      }

      if (typesRes.success && typesRes.data) {
        setMembershipTypes(typesRes.data);
      }
    } catch (err) {
      toastError(err.message || "Failed to load application status");
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Set default membership type when types or applicant type change
  useEffect(() => {
    const validTypes = membershipTypes.filter((t) => t.applicableTo === applicantType);
    if (validTypes.length > 0 && !validTypes.some((t) => t._id === membershipTypeId)) {
      setMembershipTypeId(validTypes[0]._id);
    }
  }, [applicantType, membershipTypes, membershipTypeId]);

  const latestApplication = applications.length > 0 ? applications[0] : null;
  const hasPending = latestApplication?.status === "PENDING";
  const isApproved = !!activeMembership || latestApplication?.status === "APPROVED";
  const isRejected = latestApplication?.status === "REJECTED";

  const handlePreFillFromRejected = () => {
    if (!latestApplication) return;
    setApplicantType(latestApplication.applicantType);
    setFullName(latestApplication.fullName || "");
    setCompanyName(latestApplication.companyName || "");
    setNic(latestApplication.nic || "");
    setRegistrationNo(latestApplication.registrationNo || "");
    setEmail(latestApplication.email || user?.email || "");
    setPhone(latestApplication.phone || "");
    setAddress(latestApplication.address || "");
    setMembershipTypeId(latestApplication.membershipTypeId?._id || latestApplication.membershipTypeId || "");
    setShowResubmitForm(true);
  };

  const validateForm = () => {
    const errors = {};
    if (applicantType === "INDIVIDUAL") {
      if (!fullName.trim() || fullName.trim().length < 3) errors.fullName = "Full name must be at least 3 characters";
      if (!nic.trim() || nic.trim().length < 9) errors.nic = "Valid NIC is required (e.g. 199012345678 or 901234567V)";
    } else {
      if (!companyName.trim() || companyName.trim().length < 3) errors.companyName = "Company name must be at least 3 characters";
      if (!registrationNo.trim()) errors.registrationNo = "Business Registration Number is required";
    }

    if (!email.trim() || !email.includes("@")) errors.email = "Valid email is required";

    // Sri Lankan phone regex
    const phoneRegex = /^(?:0|\+94)7[0-9]{8}$/;
    if (!phone.trim() || !phoneRegex.test(phone.trim())) {
      errors.phone = "Sri Lankan format required (e.g. 0771234567 or +94771234567)";
    }

    if (!address.trim() || address.trim().length < 5) errors.address = "Address must be at least 5 characters";
    if (address.length > 250) errors.address = "Address cannot exceed 250 characters";

    if (!membershipTypeId) errors.membershipTypeId = "Please select a membership type";

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitApplication = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      const payload = {
        applicantType,
        fullName: applicantType === "INDIVIDUAL" ? fullName.trim() : undefined,
        companyName: applicantType === "COMPANY" ? companyName.trim() : undefined,
        nic: applicantType === "INDIVIDUAL" ? nic.trim() : undefined,
        registrationNo: applicantType === "COMPANY" ? registrationNo.trim() : undefined,
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        address: address.trim(),
        membershipTypeId
      };

      const res = await api.post("/applications", payload);
      if (res.success) {
        success("Membership application submitted! It is now in PENDING status for staff review.");
        setShowResubmitForm(false);
        await fetchData();
      }
    } catch (err) {
      if (err.details && Array.isArray(err.details)) {
        const errorMap = {};
        err.details.forEach((d) => { errorMap[d.field] = d.message; });
        setFieldErrors(errorMap);
      }
      toastError(err.message || "Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-12 px-4 text-center">
        <div className="w-10 h-10 border-4 border-emerald-600/20 border-t-emerald-600 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-600">Loading your membership profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-emerald-950/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-700/80 border border-emerald-500/30 text-emerald-200">
                Member Portal (F-03, F-04, F-05)
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Hello, {user?.fullName}
            </h1>
            <p className="text-sm text-emerald-100/90 max-w-xl">
              Track your association membership status, digital credentials, and application history.
            </p>
          </div>

          <div className="bg-emerald-950/50 backdrop-blur-md rounded-2xl p-4 border border-emerald-600/30 flex items-center gap-3">
            <div className="text-right">
              <p className="text-[10px] uppercase font-bold tracking-wider text-emerald-300">Account Type</p>
              <p className="text-sm font-extrabold text-white">{user?.applicantType || "INDIVIDUAL"}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
              {user?.applicantType === "COMPANY" ? <Building2 className="w-5 h-5" /> : <User className="w-5 h-5" />}
            </div>
          </div>
        </div>
      </div>

      {/* CASE 1: ACTIVE MEMBERSHIP (F-07 & Digital Membership Card) */}
      {isApproved && activeMembership && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-bold text-slate-900">Active Membership Pass</h2>
            </div>
            <StatusBadge status="ACTIVE" />
          </div>

          {/* Realistic Association Digital Pass Card */}
          <div className="max-w-md mx-auto sm:max-w-lg bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-2xl shadow-emerald-950/40 border border-emerald-500/30 relative overflow-hidden">
            {/* Holographic accent shimmer */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-400/10 rounded-full blur-xl pointer-events-none" />

            <div className="relative z-10 flex items-start justify-between border-b border-emerald-800/60 pb-4 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold tracking-wide text-white">YARL VENTURES</h3>
                  <p className="text-[10px] text-emerald-300 font-medium tracking-wider">MEMBER CREDENTIAL</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {activeMembership?.membershipTypeId?.name || "Standard Member"}
                </span>
              </div>
            </div>

            <div className="relative z-10 space-y-4">
              <div>
                <p className="text-[10px] uppercase font-bold tracking-widest text-emerald-400">Unique Membership Number (BR-10)</p>
                <p className="text-xl sm:text-2xl font-mono font-extrabold text-white tracking-wider flex items-center gap-2 mt-0.5">
                  <Hash className="w-5 h-5 text-emerald-400" />
                  {activeMembership?.membershipNumber}
                </p>
              </div>

              <div>
                <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Member Name / Entity</p>
                <p className="text-base font-bold text-white tracking-wide truncate">
                  {user?.fullName}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-emerald-900/60">
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Valid From</p>
                  <p className="text-xs font-semibold text-emerald-200">
                    {new Date(activeMembership?.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Valid Until</p>
                  <p className="text-xs font-semibold text-emerald-200">
                    {new Date(activeMembership?.endDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CASE 2: PENDING APPLICATION BANNER (F-05) */}
      {hasPending && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-amber-900">Application Under Review (PENDING)</h3>
                <StatusBadge status="PENDING" />
              </div>
              <p className="text-sm text-amber-800 leading-relaxed">
                Your membership application submitted on{" "}
                <strong>{new Date(latestApplication.createdAt).toLocaleDateString()}</strong> is currently being reviewed by our staff.
              </p>
              <p className="text-xs text-amber-700">
                Per rule <strong>BR-03</strong>, you can hold only one pending application at a time. You will receive immediate access once an Officer or Chairman approves your submission.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-amber-200/80 text-xs text-slate-700 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <p className="text-slate-400 uppercase font-bold text-[10px]">Applicant Name</p>
              <p className="font-semibold text-slate-900">{latestApplication.fullName || latestApplication.companyName}</p>
            </div>
            <div>
              <p className="text-slate-400 uppercase font-bold text-[10px]">NIC / Business Reg</p>
              <p className="font-semibold text-slate-900">{latestApplication.nic || latestApplication.registrationNo}</p>
            </div>
            <div>
              <p className="text-slate-400 uppercase font-bold text-[10px]">Phone Number</p>
              <p className="font-semibold text-slate-900">{latestApplication.phone}</p>
            </div>
            <div>
              <p className="text-slate-400 uppercase font-bold text-[10px]">Selected Tier</p>
              <p className="font-semibold text-slate-900">{latestApplication.membershipTypeId?.name}</p>
            </div>
          </div>
        </div>
      )}

      {/* CASE 3: REJECTED APPLICATION BANNER & RESUBMISSION (F-05, F-08, BR-04) */}
      {isRejected && (
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 border border-rose-300 text-rose-800 flex items-center justify-center shrink-0">
              <XCircle className="w-6 h-6" />
            </div>
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-rose-900">Application Rejected (F-05)</h3>
                <StatusBadge status="REJECTED" />
              </div>
              <p className="text-sm text-rose-800 leading-relaxed">
                Your application could not be approved at this time.
              </p>

              {/* Documented Rejection Reason */}
              <div className="p-4 bg-white rounded-2xl border border-rose-200 shadow-inner">
                <p className="text-[11px] font-bold uppercase tracking-wider text-rose-600 mb-1">
                  Reason Recorded by Officer (F-08):
                </p>
                <p className="text-sm font-medium text-slate-900 italic">
                  "{latestApplication.rejectionReason || "Requirements not met"}"
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handlePreFillFromRejected}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-700/20 transition-all flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Correct & Resubmit Application (BR-04)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CASE 4: SUBMIT / RESUBMIT APPLICATION FORM (F-04, Section 7) */}
      {(!latestApplication || showResubmitForm) && !hasPending && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                {showResubmitForm ? "Resubmit Corrected Membership Application (BR-04)" : "Submit Membership Application (F-04)"}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Please complete the required association fields below. All inputs are validated strictly per Section 7.
              </p>
            </div>
            {showResubmitForm && (
              <button
                type="button"
                onClick={() => setShowResubmitForm(false)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg border hover:bg-slate-50"
              >
                Cancel
              </button>
            )}
          </div>

          <form onSubmit={handleSubmitApplication} className="space-y-6">
            {/* Applicant Type Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                1. Applicant Type *
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setApplicantType("INDIVIDUAL")}
                  className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                    applicantType === "INDIVIDUAL"
                      ? "bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-500/20"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <User className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold">Individual Applicant</p>
                    <p className="text-xs text-slate-500 mt-0.5">Professional, researcher, or practitioner</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setApplicantType("COMPANY")}
                  className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                    applicantType === "COMPANY"
                      ? "bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-500/20"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Building2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold">Company / Corporate Entity</p>
                    <p className="text-xs text-slate-500 mt-0.5">Registered private or public business entity</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Dynamic Name & ID Fields based on Applicant Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {applicantType === "INDIVIDUAL" ? (
                <>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Full Name (3 to 100 chars) *
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Sivanathan Mahendran"
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    {fieldErrors.fullName && <p className="text-xs text-rose-600 mt-1">{fieldErrors.fullName}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      National Identity Card (NIC) *
                    </label>
                    <input
                      type="text"
                      value={nic}
                      onChange={(e) => setNic(e.target.value)}
                      placeholder="e.g. 199012345678 or 901234567V"
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    {fieldErrors.nic && <p className="text-xs text-rose-600 mt-1">{fieldErrors.nic}</p>}
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Company Name (3 to 100 chars) *
                    </label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Lanka Innovations (Pvt) Ltd"
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    {fieldErrors.companyName && <p className="text-xs text-rose-600 mt-1">{fieldErrors.companyName}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Business Registration Number *
                    </label>
                    <input
                      type="text"
                      value={registrationNo}
                      onChange={(e) => setRegistrationNo(e.target.value)}
                      placeholder="e.g. PV-0091823"
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    {fieldErrors.registrationNo && <p className="text-xs text-rose-600 mt-1">{fieldErrors.registrationNo}</p>}
                  </div>
                </>
              )}
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Official Email Address *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@example.com"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {fieldErrors.email && <p className="text-xs text-rose-600 mt-1">{fieldErrors.email}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Phone (Sri Lankan format) *
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 0771234567 or +94771234567"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {fieldErrors.phone && <p className="text-xs text-rose-600 mt-1">{fieldErrors.phone}</p>}
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Postal Address (max 250 characters) *
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="No, Street, City, Postal Code"
                rows={2}
                maxLength={250}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>{fieldErrors.address ? <span className="text-rose-600">{fieldErrors.address}</span> : "Physical address in Sri Lanka"}</span>
                <span>{address.length}/250</span>
              </div>
            </div>

            {/* Membership Type Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Membership Type Tier *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {membershipTypes
                  .filter((t) => t.applicableTo === applicantType)
                  .map((type) => (
                    <button
                      key={type._id}
                      type="button"
                      onClick={() => setMembershipTypeId(type._id)}
                      className={`p-4 rounded-2xl border text-left transition-all ${
                        membershipTypeId === type._id
                          ? "bg-emerald-50 border-emerald-600 text-emerald-950 ring-2 ring-emerald-500/20"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{type.applicableTo}</p>
                      <h4 className="text-sm font-extrabold text-slate-900 mt-0.5">{type.name}</h4>
                      <p className="text-base font-extrabold text-emerald-700 mt-2">
                        LKR {type.annualFee?.toLocaleString()} <span className="text-xs font-normal text-slate-500">/ yr</span>
                      </p>
                    </button>
                  ))}
              </div>
              {fieldErrors.membershipTypeId && <p className="text-xs text-rose-600 mt-1">{fieldErrors.membershipTypeId}</p>}
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-700/20 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Application for Review
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Application History Log (BR-04: keep the old record) */}
      {applications.length > 0 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-600" />
            Application Submission History (BR-04)
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Applicant</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Membership Tier</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Notes / Rejection Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {applications.map((app) => (
                  <tr key={app._id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-mono">{new Date(app.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{app.fullName || app.companyName}</td>
                    <td className="py-3 px-4">{app.applicantType}</td>
                    <td className="py-3 px-4">{app.membershipTypeId?.name}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={app.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-slate-500">
                      {app.rejectionReason ? <span className="text-rose-600 font-medium">{app.rejectionReason}</span> : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberDashboard;