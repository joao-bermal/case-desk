'use client';

import Alert, { type AlertColor } from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

type Notify = (message: string, severity?: AlertColor) => void;

const NotifierContext = createContext<Notify>(() => {});

/** App-wide snackbar, like the 2022 version's "Campo atualizado com sucesso!" messages. */
export function NotifierProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ message: string; severity: AlertColor; key: number } | null>(null);
  const notify = useCallback<Notify>((message, severity = 'success') => {
    setState({ message, severity, key: Date.now() });
  }, []);

  return (
    <NotifierContext value={notify}>
      {children}
      <Snackbar
        key={state?.key}
        open={state !== null}
        autoHideDuration={4000}
        onClose={(_, reason) => reason !== 'clickaway' && setState(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert variant="filled" severity={state?.severity ?? 'success'} onClose={() => setState(null)} sx={{ width: '100%' }}>
          {state?.message}
        </Alert>
      </Snackbar>
    </NotifierContext>
  );
}

export function useNotify() {
  return useContext(NotifierContext);
}
