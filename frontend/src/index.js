/**
 * Entry Point for the React Application
 *
 * This file is the entry point for the Cricket Simulation Dashboard application.
 * It imports the main App component and global styles, then renders the App
 * inside the root DOM element.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';

// Import the main App component which contains the entire application.
import App from './App';

// Import global CSS styles (including Tailwind CSS directives).
import './index.css';

// Create a React root container by selecting the DOM element with the ID 'root'.
const root = ReactDOM.createRoot(document.getElementById('root'));

// Render the application wrapped in React.StrictMode for highlighting potential issues.
// StrictMode helps identify unsafe lifecycle methods and other potential problems in an application.
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);