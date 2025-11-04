import { useState, useEffect } from "react";
import Chat from "./Chat";
import Auth from "./Auth";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("chatToken") || null);

  useEffect(() => {
    if (token) localStorage.setItem("chatToken", token);
    else localStorage.removeItem("chatToken");
  }, [token]);

  return token ? <Chat token={token} setToken={setToken} /> : <Auth setToken={setToken} />;
}
