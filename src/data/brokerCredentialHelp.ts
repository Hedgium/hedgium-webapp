/**
 * Broker credential help: steps with optional image per step.
 * Images live under public/help/ (e.g. public/help/zerodha-user-id.png).
 */

export type CredentialHelpStep = {
  text: string;
  imageUrl?: string;
};

export type CredentialHelpItem = {
  field: string;
  label: string;
  steps: CredentialHelpStep[];
};

export type BrokerCredentialHelp = Record<string, CredentialHelpItem[]>;

export const BROKER_CREDENTIAL_HELP: BrokerCredentialHelp = {
  ZERODHA: [
    {
      field: "broker_user_id",
      label: "Broker User ID",
      steps: [
        { text: "Log in to Kite (kite.zerodha.com)." },
        {
          text: "Your user ID is the same as your login ID (client ID).",
          imageUrl: "/help/zerodha-user-id.png",
        },
      ],
    },
    {
      field: "api_key",
      label: "API Key",
      steps: [
        { text: "Go to developers.kite.trade and sign in." },
        {
          text: "Create an app. The API key is shown on the app page.",
          imageUrl: "/help/zerodha-api-key.png",
        },
      ],
    },
    {
      field: "secret_key",
      label: "Secret Key",
      steps: [
        { text: "In the same app page on developers.kite.trade, copy the API Secret." },
        {
          text: "Keep the secret key private and never share it.",
          imageUrl: "/help/zerodha-secret-key.png",
        },
      ],
    },
  ],
  SHOONYA: [
    {
      field: "broker_user_id",
      label: "Broker User ID",
      steps: [
        { text: "Log in to Shoonya (fyers one / Finvasia)." },
        { text: "Your user ID is your client ID or login ID." },
      ],
    },
    {
      field: "api_key",
      label: "API Key",
      steps: [
        { text: "Open the Shoonya API / developer section from your broker dashboard." },
        { text: "Create or view your app to get the API key." },
      ],
    },
    {
      field: "broker_twofa",
      label: "2FA",
      steps: [
        { text: "Use the 2FA code from your authenticator app when connecting." },
      ],
    },
  ],
  KOTAKNEO: [
    {
      field: "broker_user_id",
      label: "Broker User ID",
      steps: [
        { text: "Log in to Kotak Neo (kite or Neo app)." },
        { text: "Your user ID is your client ID." },
      ],
    },
    {
      field: "api_key",
      label: "API Key",
      steps: [
        { text: "Get your API credentials from the Kotak Neo developer or API section." },
      ],
    },
    {
      field: "broker_twofa",
      label: "TOTP Secret",
      steps: [
        { text: "Use the TOTP secret from your broker to generate one-time codes." },
      ],
    },
  ],
};
