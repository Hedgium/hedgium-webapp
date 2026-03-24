# Broker onboarding: Shoonya & Kotak Neo

This guide matches the in-app **Broker credential help** modal (`BrokerCredentialHelpModal`). Use it for support docs or onboarding copy. Screenshots live under `hedgium_frontend/public/`; paths below are as the app references them (root = `public`).

---

## Shoonya

### Broker User ID

1. Log in to **Shoonya** (Fyers One / Finvasia).
2. Your **user ID** is your **client ID** or **login ID**.

### API Key

1. Log in to **prism.shoonya.com** and click the **profile icon** on the top right.
2. Click **API Key**, then **Generate**, and **copy** it from there.

### 2FA (TOTP secret)

1. Log in to **[https://trade.shoonya.com/](https://trade.shoonya.com/)**
2. Click your **profile / client ID** on the top right.
3. Open **Security**, then **TOTP**, and **copy** the secret from there.
4. Use the **copy icon** to copy the **TOTP secret** and paste it in the form.

---

## Kotak Neo

### Broker User ID (UCC)

1. Log in to **Kotak Neo** (Neo app or neo.kotaksecurities.com).
2. Open your profile, then open **account details**.
3. The **Unique Client Code (UCC)** is your Broker User ID.

### API Key

1. Open the **NEO** app or **neo.kotaksecurities.com** and log in.
2. Go to **More → TradeAPI → API Dashboard**.
3. Click **Create Application**.
4. **Copy the token** shown after creation. That value is your **API Key**.

### TOTP secret

1. In **API Dashboard**, open the **menu** (top right) and choose **TOTP Registration**.
2. Verify with your **mobile number** and **OTP**.
3. Install **Google Authenticator** or **Microsoft Authenticator** from the app store.
4. **Scan the QR code** on screen, then enter the **6-digit TOTP code** from the authenticator app.
5. **Copy the TOTP key** and paste it in the form. That value is your **TOTP Secret**.
6. Confirm when you see **TOTP successfully registered**.

---

## Security reminders

- Treat **API keys**, **secrets**, and **TOTP secrets** like passwords: do not share them or commit them to source control.
- If you rotate credentials at the broker, update them in Hedgium as well.

