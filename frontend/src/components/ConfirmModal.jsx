import React from "react";
import Modal from "./Modal";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message,
  confirmText = "Confirm",
  confirmColor = "emerald",
  loading = false,
  children
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className={`p-2.5 rounded-xl shrink-0 ${confirmColor === "rose" ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"}`}>
            {confirmColor === "rose" ? <AlertCircle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
          </div>
          <div className="text-sm text-slate-600 leading-relaxed">
            {message}
          </div>
        </div>

        {children}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-sm font-semibold text-white rounded-xl shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50 ${
              confirmColor === "rose"
                ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20"
                : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
            }`}
          >
            {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmModal;