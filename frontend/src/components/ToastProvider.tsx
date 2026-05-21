import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";

interface Toast {
  id: number;
  type: "success" | "error" | "info" | "warning";
  message: string;
}

interface ToastContextValue {
  addToast: (
    message: string,
    type?: Toast["type"],
    durationMs?: number,
  ) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, type: Toast["type"] = "info", durationMs = 3200) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, type, message }]);
      setTimeout(() => removeToast(id), durationMs);
    },
    [removeToast],
  );

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-4 right-4 space-y-3 z-[9999] w-80 max-w-full">
        {toasts.map((toast) => (
          <ToastCard
            key={toast.id}
            toast={toast}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
};

const ToastCard: React.FC<{ toast: Toast; onClose: () => void }> = ({
  toast,
  onClose,
}) => {
  const colors: Record<Toast["type"], string> = {
    success: "bg-green-50 border-green-200 text-green-900",
    error: "bg-red-50 border-red-200 text-red-900",
    info: "bg-blue-50 border-blue-200 text-blue-900",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-900",
  };

  const icons: Record<Toast["type"], string> = {
    success: "✔",
    error: "✕",
    info: "ℹ",
    warning: "⚠",
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className={`flex items-start gap-3 border rounded-lg px-3 py-2.5 shadow-sm ${colors[toast.type]}`}
      role="alert"
    >
      <span className="text-lg leading-none mt-0.5">{icons[toast.type]}</span>
      <div className="flex-1 text-sm leading-relaxed">{toast.message}</div>
      <button
        onClick={onClose}
        className="text-sm font-semibold opacity-70 hover:opacity-100"
        aria-label="Close notification"
      >
        ✕
      </button>
    </div>
  );
};
