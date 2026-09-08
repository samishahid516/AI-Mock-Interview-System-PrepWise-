"use client";

import { Button } from "@/frontend/components/ui/button";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: "default" | "destructive";
}

const ConfirmDialog = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Yes",
  cancelText = "No",
  confirmVariant = "destructive",
}: ConfirmDialogProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-dark-300 border border-dark-200 rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-gray-400 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <Button
            onClick={onCancel}
            variant="outline"
            className="bg-dark-400 border-dark-200 text-gray-300 hover:bg-dark-500 hover:text-white"
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            variant={confirmVariant}
            className={
              confirmVariant === "destructive"
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-primary-200 hover:bg-primary-300 text-black font-semibold"
            }
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;

