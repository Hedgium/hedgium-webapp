// File: components/AlertsContainer.tsx

"use client"

import useAlertStore, { AlertType } from "@/store/alertStore";

const AlertsContainer = () => {
  const { alerts, removeAlert } = useAlertStore();

  const getIcon = (type: AlertType) => {
    switch (type) {
      case 'info':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'success':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'warning':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'error':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    // Kept mounted at all times (rather than returning null when empty) so this
    // remains a single, persistent live-region node — screen readers reliably
    // announce content added to an already-mounted live region.
    <div
      className="toast toast-top toast-end z-[1000] mt-16"
      role="status"
      aria-live="polite"
      aria-atomic="false"
    >
      {alerts.map((alert) => (
        <div
          key={alert.id}
          role={alert.type === 'error' ? 'alert' : undefined}
          className={`alert alert-${alert.type} shadow-lg mb-2 flex flex-row items-center justify-between w-[22rem] max-w-[90vw]`}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="flex-shrink-0">
              {getIcon(alert.type)}
            </div>
            <span className="break-words whitespace-pre-wrap text-sm leading-snug">
              {alert.message}
            </span>
          </div>
          {!alert.hideClose && (
            <button
              type="button"
              aria-label="Dismiss notification"
              className="btn btn-ghost btn-sm btn-circle ml-2 flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              onClick={() => removeAlert(alert.id)}
            >
              <span aria-hidden="true">✕</span>
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default AlertsContainer;