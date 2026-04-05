"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type ToastKind = "success" | "info" | "error";

export type ToastMessage = {
  id: string;
  title: string;
  description?: string;
  kind?: ToastKind;
};

type ToastContextValue = {
  toasts: ToastMessage[];
  push: (toast: Omit<ToastMessage, "id">) => void;
  remove: (id: string) => void;
};

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  const remove = React.useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = React.useCallback((toast: Omit<ToastMessage, "id">) => {
    const id = crypto.randomUUID();
    setToasts((current) => [...current, { id, ...toast }]);
    setTimeout(() => remove(id), 3200);
  }, [remove]);

  return (
    <ToastContext.Provider value={{ toasts, push, remove }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "rounded-md border p-3 shadow-sm",
              toast.kind === "success" && "border-emerald-200 bg-emerald-50",
              toast.kind === "error" && "border-rose-200 bg-rose-50",
              (!toast.kind || toast.kind === "info") && "border-slate-200 bg-white"
            )}
          >
            <p className="text-sm font-semibold">{toast.title}</p>
            {toast.description ? (
              <p className="mt-1 text-xs text-muted-foreground">{toast.description}</p>
            ) : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }
  return context;
}
