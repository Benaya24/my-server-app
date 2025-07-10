const axios = require("axios");
const express = require("express");
const crypto = require("crypto"); // ייבוא ספריית הקריפטוגרפיה של Node.js
const app = express();
const cors = require("cors");

app.use(cors());

// קריאת המפתחות הסודיים ממשתני הסביבה
const appKey = process.env.ALIEXPRESS_APP_KEY;
const appSecret = process.env.ALIEXPRESS_APP_SECRET;

// --- כתובות ה-API ---
const AUTH_API_URL = "https://api-sg.aliexpress.com/sync/v1/auth/token/create";

// --- פונקציה ליצירת חתימה דיגיטלית ---
function createSignature(params, secret) {
  const sortedKeys = Object.keys(params).sort();
  let signString = "";
  for (const key of sortedKeys) {
    if (params[key] !== undefined && params[key] !== null) {
      signString += key + params[key];
    }
  }
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(signString);
  return hmac.digest("hex").toUpperCase();
}

// --- ניתוב לקבלת Access Token ---
app.get("/api/get-access-token", async (req, res) => {
  // את ה-code הזה צריך לקבל באופן דינמי, אך לצורך הבדיקה נשתמש בקוד שהיה לך
  const authCode = "0_2DL4DV3jcU1UOT7WGI1A4rY91";

  // הרכבת הפרמטרים לבקשה
  let params = {
    app_key: appKey,
    code: authCode,
    sign_method: "sha256",
    timestamp: Date.now().toString(),
  };

  // יצירת החתימה והוספתה לפרמטרים
  params.sign = createSignature(params, appSecret);

  try {
    // שליחת הבקשה עם הפרמטרים כ-Query Parameters
    const response = await axios.get(AUTH_API_URL, { params });
    res.json(response.data);
  } catch (error) {
    console.error(
      "Error getting access token:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({ message: "Failed to get access token" });
  }
});

// ... הוסף כאן את הניתוב לקבלת פרטי מוצר מאוחר יותר ...

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
