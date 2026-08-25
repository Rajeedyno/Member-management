import React, { useState } from "react";
import Modal from "./Modal";
import { AlertCircle } from "lucide-react";

export const RejectModal = ({ isOpen, onClose, onReject, applicantName, loading = false }) => {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim() || reason.trim().length < 5) {
      setError("Please provide a meaningful rejection reason (minimum 5 characters).");
      return;
    }
    onReject(reason.trim());
  };

  const handleClose = () => {
    setReason("");
    setError("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Reject Application" maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-start gap-3 p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-900 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Rejection requires a documented reason (F-08)</p>
            <p className="text-xs text-rose-700 mt-0.5">
              The applicant <strong>{applicantName}</strong> will see this reason on their dashboard to make corrections and resubmit.
            </p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Reason for Rejection *
          </label>
          <textarea
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError("");
            }}
            placeholder="e.g. NIC copy unclear, phone verification failed, business registration copy missing."
            rows={4}
            maxLength={500}
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all"
            required
          />
          <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
            <span>{error ? <span className="text-rose-600 font-medium">{error}</span> : "Saved with the audit record."}</span>
            <span>{reason.length}/500</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !reason.trim()}
            className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm shadow-rose-600/20 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            Confirm Rejection
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default RejectModal;