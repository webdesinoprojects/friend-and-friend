import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

for (const legacyTokenKey of [
  "buddybook_token",
  "buddybook_admin_token",
  "buddybook_application_token",
  "token",
]) {
  localStorage.removeItem(legacyTokenKey);
  sessionStorage.removeItem(legacyTokenKey);
}

createRoot(document.getElementById("root")).render(
  <GoogleOAuthProvider clientId={googleClientId}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </GoogleOAuthProvider>
);
