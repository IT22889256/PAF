// main.js or index.js
import './index.css'; // Make sure the path is correct
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
// ReactDOM.createRoot(document.getElementById('root')).render(
//   <React.StrictMode>
    
//       <App />
    
//   </React.StrictMode>
// );
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);