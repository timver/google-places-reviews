# Google Places Reviews – Proof of Concept (POC)

## 🔍 Goal

This POC demonstrates how to fetch and display Google Places reviews for a business using the **Google Places API**. 
While the frontend displays the reviews, the actual data fetching is ideally handled server-side (for security and caching reasons).

---

## ⚙️ Requirements

### Google Places API Key
- Go to [Google Cloud Console](https://console.cloud.google.com/)
- Enable the following APIs:
  - **Places API**
- Create an **API Key** and restrict it:
  - **Restrict usage** to your project or referrer (for frontend).
  - For backend use: allow server IPs or only backend domains.

### Google Place ID
- Use [Place ID Finder](https://developers.google.com/maps/documentation/places/web-service/place-id) to find the place ID of your business.

---

## 🚀 Installation & Local Run

### 1. Install the package.json

```bash
nvm use 21.2.0
npm i
```

### 2. Set API Key

Create `.env` file:

```env
GOOGLE_API_KEY=your-places-api-key
PLACE_ID=your-place-id
NODE_ENV=development
PORT=3001
```

Start the proxy server:

```bash
node server/index.js
```

### 4. Open in Browser

Open `https://localhost:3001` in your browser to test the POC.

---

## 🔐 Securing the API Key (Optional)

If you plan to encrypt the API key for transit, you can use `openssl`:

### Generate RSA Keys

```bash
# Generate private key
openssl genrsa -out private.pem 2048

# Extract public key
openssl rsa -in private.pem -outform PEM -pubout -out public.pem
```

Use the **public key** to encrypt the API key, and the **private key** to decrypt it server-side.

---

## 🧠 Notes

- The **new Places API** may limit the number of reviews returned, and `next_page_token` may not be available.
- Caching API responses is strongly recommended to stay within quota limits and reduce response times.

