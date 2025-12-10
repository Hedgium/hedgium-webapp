// File: stores/alertStore.ts
import { create } from 'zustand';

export type AlertType = 'info' | 'success' | 'warning' | 'error';

export interface Alert {
  id: string;
  type: AlertType;
  message: string;
  duration?: number;
  hideClose?: boolean;
}

interface AlertStore {
  alerts: Alert[];
  addAlert: (alert: Omit<Alert, 'id'>) => string;
  removeAlert: (id: string) => void;
  clearAlerts: () => void;
}

const useAlertStore = create<AlertStore>((set, get) => ({
  alerts: [],
  
  addAlert: (alert) => {
    const id = Date.now().toString();
    const newAlert = { id, ...alert };
    
    set((state) => ({ 
      alerts: [...state.alerts, newAlert] 
    }));
    
    // Auto remove if duration is set
    if (!alert.duration) alert.duration = 3000;
    if (alert.duration && alert.duration > 0) {
      setTimeout(() => {
        get().removeAlert(id);
      }, alert.duration);
    }
    
    return id;
  },
  
  removeAlert: (id) => {
    set((state) => ({
      alerts: state.alerts.filter(alert => alert.id !== id)
    }));
  },
  
  clearAlerts: () => {
    set({ alerts: [] });
  }
}));

export default useAlertStore;