import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App";
import BrandingProvider from "./context/BrandingContext";
import { AppProvider } from "./context/AppContext"; // ✅ import your context provider

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppProvider> {/* ✅ wrap in AppContext */}
        <BrandingProvider>
          <App />
        </BrandingProvider>
      </AppProvider>
    </BrowserRouter>
  </React.StrictMode>
);
