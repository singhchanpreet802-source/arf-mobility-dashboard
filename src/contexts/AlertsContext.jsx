import { createContext, useContext, useEffect, useState } from 'react';
import { subscribeAlerts, dismissAlert as dismissAlertApi } from '../lib/firestoreData';

const AlertsContext = createContext(null);

export function AlertsProvider({ children }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeAlerts((data) => {
      setAlerts(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  const activeAlerts = alerts.filter((a) => !a.dismissed);

  const dismiss = async (alertId) => {
    await dismissAlertApi(alertId);
  };

  return (
    <AlertsContext.Provider value={{ alerts, activeAlerts, loading, dismiss }}>
      {children}
    </AlertsContext.Provider>
  );
}

export function useAlerts() {
  return useContext(AlertsContext);
}
