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
        { text: "Login to prism.shoonya.com and click on profile icon on the top right.",
          imageUrl: "/images/onboarding/shoonya_api_1.png",
        },
        { text: "Click on the API Key then click at generate & Copy it from there.",
          imageUrl: "/images/onboarding/shoonya_api_2.png",
        },
      ],
    },
    {
      field: "broker_twofa",
      label: "2FA",
      steps: [
        { text: "Login to https://trade.shoonya.com/" },
        { text: "Click on the profile user/client id on the top right." ,
          imageUrl: "/images/onboarding/shoonya_totp_1.png",
        },
        { text: "Click on Security then click at totp & Copy it from there.",
          imageUrl: "/images/onboarding/shoonya_totp_2.png",
         },
        { text: "Click on copy icon to copy the totp secret and paste it in the form.",
          imageUrl: "/images/onboarding/shoonya_totp_3.png",
         },
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
