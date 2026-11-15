import React, { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

interface UnsavedChangesDialogProps {
  isOpen: boolean;
  onKeepEditing: () => void;
  onDiscardAndClose: () => void;
  title?: string;
  message?: string;
}

export const UnsavedChangesDialog: React.FC<UnsavedChangesDialogProps> = ({
  isOpen,
  onKeepEditing,
  onDiscardAndClose,
  title = 'Discard Unsaved Changes?',
  message = 'You have unsaved changes in this window. Closing now will discard those edits.',
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onKeepEditing();
      }
    };
    window.addEventListener('keydown', handleKey, true);
    return () => window.removeEventListener('keydown', handleKey, true);
  }, [isOpen, onKeepEditing]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[70] bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          e.stopPropagation();
          onKeepEditing();
        }
      }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">{title}</h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onKeepEditing}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Keep Editing
          </button>
          <button
            type="button"
            onClick={onDiscardAndClose}
            className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors"
          >
            Discard &amp; Close
          </button>
        </div>
      </div>
    </div>
  );
};
