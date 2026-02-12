"use client";

import React from "react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Clear All Tasks?",
  message = "This will permanently delete all your tasks. This action cannot be undone.",
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modalTitle"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div
        className="relative w-full max-w-[400px] bg-white rounded-3xl p-8 shadow-[0_20px_40px_rgba(0,0,0,0.15)] animate-in fade-in zoom-in duration-200"
        style={{
          fontFamily: 'var(--font-current)',
        }}
      >
        <div className="flex flex-col items-center text-center">
          {/* Warning Icon */}
          <div
            className="text-[32px] mb-4 select-none"
            aria-hidden="true"
          >
            ⚠️
          </div>

          {/* Heading */}
          <h3
            id="modalTitle"
            className="text-[20px] font-bold tracking-tight text-[#1d1d1f] mb-2"
          >
            {title}
          </h3>

          {/* Message Text */}
          <p
            id="modalMessage"
            className="text-[14px] leading-relaxed text-[#86868b] mb-8 px-2"
          >
            {message}
          </p>

          {/* Dual Action Buttons */}
          <div className="flex gap-3 w-full">
            <button
              onClick={onClose}
              className="flex-1 h-[44px] flex items-center justify-center rounded-xl bg-[#f5f5f7] text-[#1d1d1f] text-[14px] font-medium transition-colors hover:bg-[#e5e5ea] active:scale-[0.98]"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="flex-1 h-[44px] flex items-center justify-center rounded-[12px] bg-[#ff3b30] text-white text-[14px] font-semibold transition-colors hover:bg-[#e03126] active:scale-[0.98]"
            >
              Clear All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;