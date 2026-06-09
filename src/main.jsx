import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

import '@gtivr4/a1-design-system-react/tokens.css';
import '@gtivr4/a1-design-system-react/themes.css';
import '@gtivr4/a1-design-system-react/breakpoints.css';
import '@gtivr4/a1-design-system-react/color-scheme.css';
import './App.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
