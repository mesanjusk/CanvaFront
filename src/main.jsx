import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from 'react-router-dom'; 
import "./index.css";
import App from "./App";
import BrandingProvider from "./context/BrandingContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
     <BrandingProvider> 
        <App />
      </BrandingProvider>
    </BrowserRouter>
  </React.StrictMode>
);

// This code cleanly unregisters all service workers:
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
      for (let registration of registrations) {
        registration.unregister();
      }
    });
  });
}
