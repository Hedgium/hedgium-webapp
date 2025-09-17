// File: hooks/useAlert.ts
"use client"

import useAlertStore, {AlertType} from "@/store/alertStore";


export interface AlertOptions {
  duration?: number;
  hideClose?: boolean;
}

interface AlertFunctions {
  (message: string, options?: AlertOptions): string;
  info: (message: string, options?: AlertOptions) => string;
  success: (message: string, options?: AlertOptions) => string;
  warning: (message: string, options?: AlertOptions) => string;
  error: (message: string, options?: AlertOptions) => string;
  remove: (id: string) => void;
  clear: () => void;
}

const useAlert = (): AlertFunctions => {
  const addAlert = useAlertStore(state => state.addAlert);
  const removeAlert = useAlertStore(state => state.removeAlert);
  const clearAlerts = useAlertStore(state => state.clearAlerts);
  
  const alertFunction = (message: string, options: AlertOptions = {}): string => {
    return addAlert({ type: 'info', message, ...options });
  };
  
  // Add type-specific methods
  alertFunction.info = (message: string, options: AlertOptions = {}): string => {
    return addAlert({ type: 'info', message, ...options });
  };
  
  alertFunction.success = (message: string, options: AlertOptions = {}): string => {
    return addAlert({ type: 'success', message, ...options });
  };
  
  alertFunction.warning = (message: string, options: AlertOptions = {}): string => {
    return addAlert({ type: 'warning', message, ...options });
  };
  
  alertFunction.error = (message: string, options: AlertOptions = {}): string => {
    return addAlert({ type: 'error', message, ...options });
  };
  
  alertFunction.remove = removeAlert;
  alertFunction.clear = clearAlerts;
  
  return alertFunction;
};

export default useAlert;