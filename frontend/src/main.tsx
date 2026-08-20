import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';
import ScrollToTop from './components/ui/ScrollToTop';
import { queryClient } from './services/queryClient';

ReactDOM.createRoot(document.getElementById('root')!).render(
   <React.StrictMode>
      <QueryClientProvider client={queryClient}>
         <BrowserRouter>
            <ScrollToTop />
            <App />
         </BrowserRouter>
      </QueryClientProvider>
   </React.StrictMode>
);
