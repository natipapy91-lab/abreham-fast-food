require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Telegraf, Markup } = require('telegraf');
const axios = require('axios');

const app = express();
const bot = new Telegraf(process.env.BOT_TOKEN);
const PORT = process.env.PORT || 5000;

// Allow Vercel to talk to this server
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
  // --- THIS IS THE LINE THAT WAS MISSING ---
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

      const returnUrl = 'https://abreham-fast-food.vercel.app/'; 
      const safeEmail = 'customer@gmail.com'; 
      const safeName = (user.name && user.name.length > 1) ? user.name : 'Valued Customer';
      const safePhone = (user.phone && user.phone.length > 3) ? user.phone : '0911223344';

      const chapaPayload = {
        amount: total.toString(),
        currency: 'ETB',
        email: safeEmail,
        first_name: safeName,
        phone_number: safePhone,
        tx_ref: tx_ref,
        return_url: returnUrl,
        customization: { title: 'Abreham Food', description: 'Order Payment' }
      };

      const chapaResponse = await axios.post(
        'https://api.chapa.co/v1/transaction/initialize',
        chapaPayload,
        { headers: { Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}` } }
      );

      return res.json({ success: true, paymentUrl: chapaResponse.data.data.checkout_url });

    } catch (error) {
      console.error("Chapa Error:", error.response?.data || error.message);
      return res.status(500).json({ success: false, error: "Chapa Rejected the Data" });
    }
  }

  // === 2. HANDLE CASH ORDERS ===
  try {
    console.log("📥 Incoming Cash Order:", JSON.stringify(user));

    let locationString = user.location || "No Location Text";
    let hasGPS = false;
    let lat = null;
    let lng = null;

    // Check for GPS
    if (user.latitude && user.longitude) {
        lat = parseFloat(user.latitude);
        lng = parseFloat(user.longitude);
        
        if (!isNaN(lat) && !isNaN(lng)) {
            hasGPS = true;
            const mapLink = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
            locationString += `\n\n🗺 [Open Google Maps](${mapLink})`;
        }
    }

    const ownerMessage = `
🔔 *NEW GPS ORDER* 
👤 ${user.name}
📞 ${user.phone}
💰 ${total} ETB

📍 *Location:*
${locationString}

🍔 *Order:*
${itemsList}
`;

    // Send Text Message to Owner
    if (process.env.OWNER_CHAT_ID) {
        await bot.telegram.sendMessage(process.env.OWNER_CHAT_ID, ownerMessage, { 
            parse_mode: 'Markdown',
            disable_web_page_preview: true 
        });

        // Send Map Bubble (Location Point)
        if (hasGPS) {
            try {
                console.log(`📍 Sending Bubble: ${lat}, ${lng}`);
                await bot.telegram.sendLocation(process.env.OWNER_CHAT_ID, lat, lng);
            } catch (e) {
                console.error("Map Bubble Error:", e);
            }
        }
    }

    // Send Confirmation to Customer
    if (chatId) await bot.telegram.sendMessage(chatId, "✅ Order Confirmed! We are coming.");
    
    res.json({ success: true });

  } catch (error) {
    console.error("Telegram Error:", error);
    res.json({ success: true });
  }
});

// --- BOT START ---
bot.start((ctx) => {
  ctx.reply("Welcome! Click below to order:", 
    Markup.keyboard([
      Markup.button.webApp("Order Food Now", "https://abreham-fast-food.vercel.app") 
    ]).resize()
  );
});

bot.launch();
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));