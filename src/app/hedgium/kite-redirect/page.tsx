"use client"
import { authFetch } from "@/utils/api";
import { useEffect, useState, useRef } from "react";
import KiteLoginButton from "@/components/KiteLoginButton";

const KiteRedirectPage = () => {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState<string>("");
  const hasFetched = useRef(false); // track if effect already ran

  useEffect(() => {
    if (hasFetched.current) return; // stop if already ran
    hasFetched.current = true;

    const params = new URLSearchParams(window.location.search);
    const request_token = params.get("request_token");

    if (!request_token) {
      setStatus("error");
      setMessage("Missing request_token from Kite redirect.");
      return;
    }

    const fetchAccessToken = async () => {
      try {
        const res = await authFetch(`users/kite-redirect/?request_token=${request_token}`, {
          method: "GET",
        });

        const data = await res.json();

        if (res.ok && data.status === "success") {
          setStatus("success");
          setMessage("Kite login successful!");
        } else {
          setStatus("error");
          setMessage(data.message || "Failed to get access token.");
        }
      } catch (err) {
        setStatus("error");
        setMessage("Something went wrong while exchanging the token.");
        console.error(err);
      }
    };

    fetchAccessToken();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="p-8 rounded shadow-lg bg-white text-center">

        {status === "loading" && <p className="text-blue-600">Processing Kite login...</p>}
        {status === "success" && <p className="text-green-600">{message}</p>}
        {status === "error" && <p className="text-red-600">{message}</p>}
      </div>

      <KiteLoginButton />
    </div>
  );
};

export default KiteRedirectPage;