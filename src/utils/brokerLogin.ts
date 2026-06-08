import { authFetch } from "@/utils/api";

export type BrokerLoginResult = { status: "success" | "error"; message?: string };

const BROKER_LOGIN_ENDPOINTS: Record<string, string> = {
  SHOONYA: "users/shoonya-login/",
  ZERODHA: "users/zerodha-login/",
  KOTAKNEO: "users/kotakneo-login/",
};

// Shoonya's OAuth/Selenium login can take 60-90s; give the poll a generous window.
const POLL_DEADLINE_MS = 150_000;
const POLL_INTERVAL_MS = 2500;

async function pollBrokerLoginStatus(jobId: string): Promise<BrokerLoginResult> {
  const deadline = Date.now() + POLL_DEADLINE_MS;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    try {
      const res = await authFetch(`users/broker-login/status/${jobId}/`);
      if (res.status === 404) {
        return { status: "error", message: "Login job expired. Please try again." };
      }
      const data = await res.json();
      if (data.status === "success" || data.status === "error") {
        return { status: data.status, message: data.message };
      }
    } catch {
      // Transient poll error — keep trying until the deadline.
    }
  }
  return { status: "error", message: "Login timed out. Please try again." };
}

/**
 * Start a broker login and resolve only when it completes.
 *
 * The backend runs the login in the background (the response is `202` with a
 * `job_id`) so Shoonya's slow Selenium flow doesn't exceed the Vercel edge-proxy
 * timeout. We poll a fast status endpoint until it resolves. A synchronous
 * backend response is still handled for backward compatibility.
 */
export async function brokerLoginWithPolling(params: {
  brokerName: string;
  profileId: number | string;
  secret: string;
}): Promise<BrokerLoginResult> {
  const endpoint = BROKER_LOGIN_ENDPOINTS[params.brokerName];
  if (!endpoint) {
    return { status: "error", message: `Login not supported for ${params.brokerName}` };
  }

  const body: Record<string, unknown> = {
    profile_id: String(params.profileId),
    async_login: true,
  };
  if (params.brokerName === "KOTAKNEO") body.mpin = params.secret;
  else body.pwd = params.secret;

  const res = await authFetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();

  if (data.job_id) {
    return pollBrokerLoginStatus(data.job_id);
  }

  // Backward-compatible synchronous response.
  if (data.status === "success") {
    return { status: "success" };
  }
  return {
    status: "error",
    message: data.message || "Login failed. Please check your credentials.",
  };
}
