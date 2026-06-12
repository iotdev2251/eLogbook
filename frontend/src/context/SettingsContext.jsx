import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import axios from '../api/axiosSetup';
import { DEFAULT_TEMP_CRITICAL_C, DEFAULT_TEMP_WARN_C } from '../utils/tempAlerts';

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [config, setConfig] = useState({
    tempWarnC: DEFAULT_TEMP_WARN_C,
    tempCriticalC: DEFAULT_TEMP_CRITICAL_C,
  });
  const [loading, setLoading] = useState(true);

  const refreshConfig = useCallback(async () => {
    try {
      const res = await axios.get('/settings/config');
      setConfig({
        tempWarnC: Number(res.data.tempWarnC) || DEFAULT_TEMP_WARN_C,
        tempCriticalC: Number(res.data.tempCriticalC) || DEFAULT_TEMP_CRITICAL_C,
      });
    } catch {
      // Keep defaults when unauthenticated or request fails.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshConfig();
  }, [refreshConfig]);

  const value = useMemo(
    () => ({ config, loading, refreshConfig }),
    [config, loading, refreshConfig],
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    return {
      config: {
        tempWarnC: DEFAULT_TEMP_WARN_C,
        tempCriticalC: DEFAULT_TEMP_CRITICAL_C,
      },
      loading: false,
      refreshConfig: async () => {},
    };
  }
  return ctx;
}
