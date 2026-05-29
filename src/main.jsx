import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './styles/fonts.css';
import './styles/variables.css';
import "leaflet/dist/leaflet.css";
import ThemeProvider from './doctor/contexts/themeContext.jsx';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './doctor/contexts/authContext.jsx';

const queryClient=new QueryClient();
createRoot(document.getElementById('root')).render(
  <QueryClientProvider client={queryClient}>
  <ThemeProvider>
    <BrowserRouter>
    <AuthProvider>
    <App/>
    </AuthProvider>
    </BrowserRouter>
  </ThemeProvider>
  </QueryClientProvider>
)
