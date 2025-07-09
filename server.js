const axios = require("axios");
const express = require("express");
const app = express();
const cors = require("cors");

app.use(cors());

// קריאת המפתחות הסודיים ממשתני הסביבה שהגדרת ב-Render
const appKey = process.env.ALIEXPRESS_APP_KEY;
const appSecret = process.env.ALIEXPRESS_APP_SECRET;

// --- הגדרת כתובות ה-API ---
const AUTH_API_URL = "https://api-sg.aliexpress.com/sync/v1/auth/token/create"; // הכתובת לקבלת הטוקן
const PRODUCT_API_URL =
  "https://api-sg.aliexpress.com/sync/v1/products/aliexpress.local.service.product.query"; // הכתובת לקבלת המוצר

// פונקציית עזר לקבלת Access Token
async function getAccessToken() {
  try {
    // כאן תצטרך להתאים את הפרמטרים לבקשת הטוקן לפי התיעוד של אליאקספרס
    // זוהי דוגמה כללית
    const response = await axios.post(AUTH_API_URL, {
      app_key: appKey,
      app_secret: appSecret,
      // ...פרמטרים נוספים כמו code או grant_type אם נדרש...
    });
    // החזרת הטוקן מהתשובה
    return response.data.access_token;
  } catch (error) {
    console.error(
      "Failed to get access token:",
      error.response ? error.response.data : error.message
    );
    throw new Error("Could not authenticate with AliExpress");
  }
}

// הניתוב הראשי לקבלת פרטי מוצר
app.get("/api/get-product-info/:productId", async (req, res) => {
  const productIdToFetch = req.params.productId;

  try {
    // שלב 1: קבל Access Token עדכני
    // הערה: באפליקציה מתקדמת, היית שומר את הטוקן ומרענן אותו רק כשפג תוקפו.
    // כרגע, לצורך הפשטות, נקבל טוקן חדש בכל בקשה.
    // const accessToken = await getAccessToken(); // כרגע נשתמש בטוקן הידני כי תהליך קבלת הטוקן מורכב יותר
    const accessToken =
      "50000601c30atpedfgu3LVvik87Ixlsvle3mSoB7701ceb156fPunYZ43GBg";

    // שלב 2: השתמש בטוקן כדי לבקש את פרטי המוצר
    const apiParameters = {
      channel_seller_id: "2678881002", // החלף במזהה המוכר שלך
      product_id: productIdToFetch,
      channel: "AE_GLOBAL",
    };

    const productResponse = await axios.post(PRODUCT_API_URL, apiParameters, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    // חילוץ הנתונים מהתשובה
    const productDetails =
      productResponse.data?.aliexpress_local_service_product_query_response
        ?.local_service_product_dto;

    if (!productDetails) {
      return res
        .status(404)
        .json({ message: "Product data not found in API response" });
    }

    const title = productDetails.title;
    const imageUrl = productDetails.multimedia.media_list[0].url;
    const price = productDetails.product_property_list[0].sku_price;

    // שלב 3: הוסף את קישור השותפים ושלח את התשובה
    res.json({
      product_name: title,
      price: price,
      image_url: imageUrl,
      affiliate_link: "https://s.click.aliexpress.com/e/_opO09DY", //  <-- הוספנו את קישור השותפים כאן
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "A general error occurred", details: error.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
