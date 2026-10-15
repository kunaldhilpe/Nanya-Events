import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AppProvider } from './store/AppContext.jsx';
import { ThemeModeProvider } from './theme/ThemeModeProvider.jsx';
import { SnackbarProvider } from './components/SnackbarProvider.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppProvider>
        <ThemeModeProvider>
          <SnackbarProvider>
            <App />
          </SnackbarProvider>
        </ThemeModeProvider>
      </AppProvider>
    </BrowserRouter>
  </React.StrictMode>
);
