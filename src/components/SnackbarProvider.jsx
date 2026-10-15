import React, { createContext, useCallback, useContext, useState } from 'react';
import { Snackbar, Alert } from '@mui/material';

const Ctx = createContext(() => {});
export const useToast = () => useContext(Ctx);

export function SnackbarProvider({ children }) {
  const [toast, setToast] = useState(null);
  const notify = useCallback((message, severity = 'success') => setToast({ message, severity, key: Date.now() }), []);
  return (
    <Ctx.Provider value={notify}>
      {children}
      <Snackbar
        key={toast?.key}
        open={!!toast}
        autoHideDuration={3200}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        {toast ? (
          <Alert onClose={() => setToast(null)} severity={toast.severity} variant="filled" sx={{ width: '100%' }}>
            {toast.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Ctx.Provider>
  );
}
