require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Telegraf, Markup } = require('telegraf');
const axios = require('axios');

const app = express();
const bot = new Telegraf(process.env.BOT_TOKEN);
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// --- MENU DATA ---
const menuItems = [
  { id: 1, name: 'Cheeseburger', price: 150.00, image: '🍔' },
  { id: 2, name: 'Chicken Pizza', price: 350.00, image: '🍕' },
  { id: 3, name: 'French Fries', price: 100.00, image: '🍟' },
  { id: 4, name: 'Coca Cola', price: 40.00, image: '🥤' }
];

app.get('/api/menu', (req, res) => {
  res.json(menuItems);
});

app.post('/api/order', async (req, res) => {
  const { user, cart, paymentMethod, total, chatId } = req.body;
  const tx_ref = "TX-" + Date.now();
  const itemsList = cart.map(i => `- ${i.name}`).join('\n');

  console.log("Processing Order:", paymentMethod);

  // === 1. HANDLE CHAPA ONLINE PAYMENT ===
  if (paymentMethod === 'Online Payment') {
    try {
      if (!process.env.CHAPA_SECRET_KEY) {
        throw new Error("CHAPA_SECRET_KEY is missing");
      }

      // Vercel Return URL
      const returnUrl = 'https://abreham-fast-food.vercel.app/'; 

      // --- FIX: Force a valid email ---
      // If user has no email, use this fake one just to make Chapa happy
      const safeEmail = 'customer@gmail.com'; 
      
      // Ensure Name/Phone are not empty
      const safeName = (user.name && user.name.length > 1) ? user.name : 'Valued Customer';
      const safePhone = (user.phone && user.phone.length > 3) ? user.phone : '0911223344';

      const chapaPayload = {
        amount: total.toString(),
        currency: 'ETB',
        email: safeEmail,  // <--- USING THE SAFE EMAIL
        first_name: safeName,
        phone_number: safePhone,
        tx_ref: tx_ref,
        return_url: returnUrl,
        customization: { title: 'Abreham Food', description: 'Order Payment' }
      };

      console.log("Sending to Chapa:", chapaPayload); // Debug Log

      const chapaResponse = await axios.post(
        'https://api.chapa.co/v1/transaction/initialize',
        chapaPayload,
        { headers: { Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}` } }
      );

      return res.json({ success: true, paymentUrl: chapaResponse.data.data.checkout_url });

    } catch (error) {
      console.error("Chapa Error:", error.response?.data || error.message);
      // Send readable error to phone
      return res.status(500).json({ success: false, error: "Chapa Rejected the Data (Check Logs)" });
    }
  }

// ... (inside app.post /api/order) ...

  // === 2. HANDLE CASH ORDERS ===
  try {
    // Check if we have GPS coordinates
    let locationString = user.location;
    if (user.latitude && user.longitude) {
        // Create a clickable Google Maps link
        const mapLink = `https://www.google.com/maps/search/?api=1&query=${user.latitude},${user.longitude}`;
        locationString += `\n\n🗺 [Click to Open Map](${mapLink})`;
    }

    const ownerMessage = `
🔔 *NEW ORDER (CASH)*
👤 ${user.name}
📞 ${user.phone}
💰 ${total} ETB

📍 *Location:*
${locationString}

🍔 *Order:*
${itemsList}
`;

    // Send to Owner
    if (process.env.OWNER_CHAT_ID) {
        await bot.telegram.sendMessage(process.env.OWNER_CHAT_ID, ownerMessage, { 
            parse_mode: 'Markdown',
            disable_web_page_preview: true 
        });
        
        // OPTIONAL: Send exact location point as a separate message for easier navigation
        if (user.latitude && user.longitude) {
             await bot.telegram.sendLocation(process.env.OWNER_CHAT_ID, user.latitude, user.longitude);
        }
    }

    // Send to Customer
    if (chatId) await bot.telegram.sendMessage(chatId, "✅ Order Confirmed! We are coming.");
    
    res.json({ success: true });

  } catch (error) {
    console.error("Telegram Error:", error);
    res.json({ success: true });
  }