import React from 'react';
import { AlertTriangle, Loader2, XCircle } from 'lucide-react';

interface ConfirmationModalProps {
  title: string;
  icon: React.ReactNode;
  iconClass: string;
  message: string;
  details?: {
    label: string;
    value: string;
  }[];
  warning?: string;
  confirmText: string;
  cancelText: string;
  loading: boolean;
  danger?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const ConfirmationModal: React.FC<
  ConfirmationModalProps
> = ({
  title,
  icon,
  iconClass,
  message,
  details,
  warning,
  confirmText,
  cancelText,
  loading,
  danger,
  onCancel,
  onConfirm,
}) => (
  <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">

    <div className="w-full max-w-lg rounded-2xl bg-[#0b0824] border border-[#2d2770] shadow-2xl">

      <div className="p-5 border-b border-[#231e54] flex items-center justify-between">

        <div className="flex items-center gap-3">

          <div
            className={`p-2 rounded-xl border ${iconClass}`}
          >
            {icon}
          </div>

          <h2 className="text-white font-bold">
            {title}
          </h2>

        </div>

        <button
          onClick={
            onCancel
          }
          disabled={
            loading
          }
          className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white disabled:opacity-50"
        >
          <XCircle className="w-4 h-4" />
        </button>

      </div>

      <div className="p-5 space-y-4">

        <div className="text-sm text-slate-200">
          {message}
        </div>

        {details &&
          details.length >
            0 && (
            <div className="rounded-xl bg-[#120e38] border border-[#231e54] overflow-hidden">

              {details.map(
                detail => (
                  <div
                    key={
                      detail.label
                    }
                    className="flex items-center justify-between px-4 py-3 border-b last:border-b-0 border-[#231e54]"
                  >

                    <span className="text-xs text-slate-400">
                      {detail.label}
                    </span>

                    <span className="text-xs font-semibold text-white">
                      {detail.value}
                    </span>

                  </div>
                )
              )}

            </div>
          )}

        {warning && (
          <div
            className={`p-3 rounded-xl border ${
              danger
                ? 'bg-rose-500/10 border-rose-500/30'
                : 'bg-amber-500/10 border-amber-500/30'
            }`}
          >

            <div className="flex items-start gap-2">

              <AlertTriangle
                className={`w-4 h-4 mt-0.5 shrink-0 ${
                  danger
                    ? 'text-rose-400'
                    : 'text-amber-400'
                }`}
              />

              <div
                className={`text-[11px] leading-5 ${
                  danger
                    ? 'text-rose-300'
                    : 'text-amber-300'
                }`}
              >
                {warning}
              </div>

            </div>

          </div>
        )}

      </div>

      <div className="p-5 border-t border-[#231e54] flex justify-end gap-2">

        <button
          onClick={
            onCancel
          }
          disabled={
            loading
          }
          className="px-4 py-2 rounded-lg bg-[#17123d] border border-[#2d2770] text-slate-300 hover:text-white text-xs font-semibold disabled:opacity-50"
        >
          {cancelText}
        </button>

        <button
          onClick={
            onConfirm
          }
          disabled={
            loading
          }
          className={`px-4 py-2 rounded-lg text-white text-xs font-bold flex items-center gap-2 disabled:opacity-50 ${
            danger
              ? 'bg-rose-600 hover:bg-rose-500'
              : 'bg-[#5C3FE0] hover:bg-[#7152FF]'
          }`}
        >

          {loading && (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          )}

          {confirmText}

        </button>

      </div>

    </div>

  </div>
);

export default ConfirmationModal;
