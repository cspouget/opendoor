import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// Entry point for the React application. This file mounts the App
// component into the root element defined in index.html. React 18's
// createRoot API is used for concurrent rendering support.

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
