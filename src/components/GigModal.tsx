import { useEffect } from "react";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

export function GigModal({ isOpen, onClose, children }: ModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-background text-foreground border border-border rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8 overflow-y-auto h-full">{children}</div>
      </div>
    </div>
  );
}
