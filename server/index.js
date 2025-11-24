require('dotenv').config();
const express = require('express');
const cors = require('cors'); // <--- This fixes the "Error processing order"
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
  const { user, cart, paymentMethod, total, chatId } = req.body;
  const tx_ref = "TX-" + Date.now();
  const itemsList = cart.map(i => `- ${i.name}`).join('\n');

  console.log("Processing Order:", paymentMethod); // Debug Log

  // === 1. HANDLE CHAPA ONLINE PAYMENT ===
  if (paymentMethod === 'Online Payment') {
    try {
      if (!process.env.CHAPA_SECRET_KEY) {
        throw new Error("CHAPA_SECRET_KEY is missing in Render Environment");
      }

      const returnUrl = 'https://abreham-fast-food.vercel.app/'; 

      // --- FIX: Ensure data is never empty ---
      const safeUser = user || {};
      const firstName = safeUser.name && safeUser.name.length > 0 ? safeUser.name : 'Valued Customer';
      const phoneNumber = safeUser.phone && safeUser.phone.length > 0 ? safeUser.phone : '0900000000';
      const email = 'customer@abrehamfastfood.com'; // Chapa requires email, can be placeholder
      
      console.log("Initializing Chapa for:", firstName, phoneNumber, total);

      const chapaResponse = await axios.post(
        'https://api.chapa.co/v1/transaction/initialize',
        {
          amount: total.toString(),
          currency: 'ETB',
          email: email,
          first_name: firstName,
          last_name: 'User',
          phone_number: phoneNumber,
          tx_ref: tx_ref,
          return_url: returnUrl,
          customization: { title: 'Abreham Food', description: 'Order Payment' }
        },
        { headers: { Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}` } }
      );

      return res.json({ success: true, paymentUrl: chapaResponse.data.data.checkout_url });
    } catch (error) {
      // LOG THE REAL CHAPA ERROR TO RENDER CONSOLE
      console.error("Chapa Error Details:", error.response?.data || error.message);
      
      // Send the specific error to the phone
      const errorMessage = error.response?.data?.message || "Payment initiation failed";
      return res.status(500).json({ success: false, error: errorMessage });
    }
  }

  // 2. CASH PAYMENT
  try {
    const msg = `🔔 *NEW ORDER* \n👤 ${user.name}\n💰 ${total} ETB\n🍔 ${itemsList}`;
    if (process.env.OWNER_CHAT_ID) await bot.telegram.sendMessage(process.env.OWNER_CHAT_ID, msg);
    if (chatId) await bot.telegram.sendMessage(chatId, "✅ Order Confirmed!");
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
      // !!! IMPORTANT: THIS MUST BE YOUR VERCEL URL !!!
      Markup.button.webApp("Order Food Now", "https://abreham-fast-food.vercel.app") 
    ]).resize()
  );
});

bot.launch();
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));