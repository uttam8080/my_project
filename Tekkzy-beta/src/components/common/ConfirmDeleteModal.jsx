import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiAlertTriangle, FiX } from 'react-icons/fi';

/**
 * Shared destructive confirmation dialog (sites, templates, etc.).
 */
const ConfirmDeleteModal = ({
  isOpen,
  title = 'Delete permanently?',
  description,
  entityLabel,
  entityMeta,
  confirmLabel = 'Delete',
  errorMessage = '',
  onCancel,
  onConfirm,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [canDismiss, setCanDismiss] = useState(false);
  const canDismissRef = useRef(false);
  const cancelRef = useRef(null);
  const onCancelRef = useRef(onCancel);
  const titleId = useId();
  const descId = useId();

  onCancelRef.current = onCancel;
  canDismissRef.current = canDismiss;

  useEffect(() => {
    if (!isOpen) {
      setIsDeleting(false);
      setCanDismiss(false);
      canDismissRef.current = false;
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    setCanDismiss(false);
    canDismissRef.current = false;

    const armTimer = window.setTimeout(() => {
      setCanDismiss(true);
      canDismissRef.current = true;
      cancelRef.current?.focus();
    }, 150);

    const onKeyDown = (event) => {
      if (event.key === 'Escape' && canDismissRef.current) {
        event.preventDefault();
        onCancelRef.current?.();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(armTimer);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  if (!isOpen || typeof document === 'undefined') return null;

  const handleConfirm = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await Promise.resolve(onConfirm?.());
    } catch (error) {
      console.error('Confirm delete failed', error);
      setIsDeleting(false);
    }
  };

  const requestClose = () => {
    if (!isDeleting && canDismissRef.current) onCancel?.();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) requestClose();
      }}
    >
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-[2px]"
        aria-hidden="true"
        onMouseDown={(event) => {
          event.preventDefault();
          requestClose();
        }}
      />

      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="relative z-10 w-full max-w-[420px] rounded-2xl border border-white/10 bg-[#141414] shadow-[0_24px_80px_rgba(0,0,0,0.65)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-5 pt-5">
          <div className="flex items-start gap-3 min-w-0">
            <div className="mt-0.5 h-11 w-11 shrink-0 rounded-full bg-red-500/15 text-red-400 ring-1 ring-red-500/30 flex items-center justify-center">
              <FiAlertTriangle size={20} />
            </div>
            <div className="min-w-0">
              <h2 id={titleId} className="text-lg font-semibold text-white tracking-tight">
                {title}
              </h2>
              <p id={descId} className="mt-1.5 text-sm text-white/50 leading-relaxed">
                {description}
              </p>
            </div>
          </div>

          <button
            type="button"
            ref={cancelRef}
            onClick={requestClose}
            disabled={isDeleting}
            className="h-8 w-8 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors inline-flex items-center justify-center disabled:opacity-40"
            aria-label="Close"
          >
            <FiX size={16} />
          </button>
        </div>

        {(entityLabel || entityMeta) && (
          <div className="mx-5 mt-4 rounded-xl border border-white/[0.08] bg-white/[0.035] px-3.5 py-3">
            {entityLabel && (
              <p className="text-sm font-medium text-white truncate">{entityLabel}</p>
            )}
            {entityMeta && (
              <p className="text-[13px] text-white/40 truncate mt-0.5">{entityMeta}</p>
            )}
          </div>
        )}

        {errorMessage ? (
          <div className="mx-5 mt-3 rounded-xl border border-red-500/25 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-300">
            {errorMessage}
          </div>
        ) : null}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 px-5 py-5">
          <button
            type="button"
            onClick={requestClose}
            disabled={isDeleting}
            className="h-10 px-4 rounded-xl border border-white/10 text-sm font-medium text-white/70 hover:text-white hover:bg-white/[0.04] transition-colors disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="h-10 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isDeleting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Deleting…
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default ConfirmDeleteModal;
