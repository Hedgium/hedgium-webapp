/**
 * Broker credential help: steps with optional image per step.
 * Wrap important phrases in **double asterisks** for bold in the modal.
 * Images live under public/help/ or public/images/onboarding/.
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
        { text: "Log in to **Kite** (kite.zerodha.com)." },
        {
          text: "Your **user ID** is the same as your **login ID (client ID)**.",
          imageUrl: "/help/zerodha-user-id.png",
        },
      ],
    },
    {
      field: "api_key",
      label: "API Key",
      steps: [
        { text: "Go to **developers.kite.trade** and sign in." },
        {
          text: "**Create an app.** The **API key** is shown on the app page.",
          imageUrl: "/help/zerodha-api-key.png",
        },
      ],
    },
    {
      field: "secret_key",
      label: "Secret Key",
      steps: [
        {
          text: "On the same app page on **developers.kite.trade**, copy the **API Secret**.",
        },
        {
          text: "**Keep the secret key private** and **never share it**.",
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
        { text: "Log in to **Shoonya** (Fyers One / Finvasia)." },
        { text: "Your **user ID** is your **client ID** or **login ID**." },
      ],
    },
    {
      field: "api_key",
      label: "API Key",
      steps: [
        {
          text: "Login to **prism.shoonya.com** and click the **profile icon** on the top right.",
          imageUrl: "/images/onboarding/shoonya_api_1.png",
        },
        {
          text: "Click **API Key**, then **Generate**, and **copy** it from there.",
          imageUrl: "/images/onboarding/shoonya_api_2.png",
        },
      ],
    },
    {
      field: "broker_twofa",
      label: "2FA",
      steps: [
        { text: "Login to **https://trade.shoonya.com/**" },
        {
          text: "Click your **profile / client ID** on the top right.",
          imageUrl: "/images/onboarding/shoonya_totp_1.png",
        },
        {
          text: "Open **Security**, then **TOTP**, and **copy** the secret from there.",
          imageUrl: "/images/onboarding/shoonya_totp_2.png",
        },
        {
          text: "Use the **copy icon** to copy the **TOTP secret** and paste it in the form.",
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
        { text: "Log in to **Kotak Neo** (Neo app or neo.kotaksecurities.com)." },
        { text: "Click on your profile and then click on account details",
          imageUrl: "/images/onboarding/kotakneo_ucc_1.png",
         }, 
        {
          text: "The Unique Client Code (UCC) is your Broker User ID.",
          imageUrl: "/images/onboarding/kotakneo_ucc_2.png",
        },
      ],
    },
    {
      field: "api_key",
      label: "API Key",
      steps: [
        {
          text: "Open the **NEO** app or **neo.kotaksecurities.com**. Log in with your credentials.",
        },
        {
          text: "Navigate to: **More → TradeAPI → API Dashboard**",
          imageUrl: "/images/onboarding/kotakneo_api_1.png",
        },
        { text: "Click **Create Application**." },
        {
          text: "**Copy the token** shown after creation. This is your **API Key**.",
          imageUrl: "/images/onboarding/kotakneo_api_2.png",
        },
      ],
    },
    {
      field: "broker_twofa",
      label: "TOTP Secret",
      steps: [
        {
          text: "In **API Dashboard**, open the **menu** (top right) and tap **TOTP Registration**.",
          imageUrl: "/images/onboarding/kotakneo_totp_1.png",
        },
        {
          text: "Verify with your **mobile number** and **OTP**.",
          imageUrl: "/images/onboarding/kotakneo_totp_2.png",
        },
        {
          text: "Download **Google Authenticator** or **Microsoft Authenticator** from the app store.",
        },
        {
          text: "**Scan the QR code** on screen, then enter the **6-digit TOTP code** from the authenticator app.",
        },
        {
          text: "**Copy the TOTP key** and paste it in the form. This is your **TOTP Secret**.",
          imageUrl: "/images/onboarding/kotakneo_totp_3.png",
        },
        {
          text: "Confirm when you see **TOTP successfully registered**.",
          imageUrl: "/images/onboarding/kotakneo_totp_4.png",
        },
      ],
    },
  ],
};
