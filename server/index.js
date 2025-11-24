require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Telegraf, Markup } = require('telegraf');
const axios = require('axios'); // Required for Chapa

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

// --- ROUTES ---

app.get('/api/menu', (req, res) => {
  res.json(menuItems);
});

app.post('/api/order', async (req, res) => {
  const { user, cart, paymentMethod, total, chatId } = req.body;
  
  // Create a unique Reference Number
  const tx_ref = "TX-" + Date.now();
  const itemsList = cart.map(i => `- ${i.name} (${i.price} ETB)`).join('\n');

  // === 1. HANDLE CHAPA ONLINE PAYMENT ===
  if (paymentMethod === 'Online Payment') {
    try {
      // REPLACE THIS WITH YOUR REAL VERCEL URL
      // Example: const returnUrl = 'https://abreham-fast-food.vercel.app/';
      const returnUrl = 'https://abreham-fast-food.vercel.app/'; 

      const chapaResponse = await axios.post(
        'https://api.chapa.co/v1/transaction/initialize',
        {
          amount: total.toString(),
          currency: 'ETB',
          email: 'customer@abreham.com',
          first_name: user.name,
          phone_number: user.phone,
          tx_ref: tx_ref,
          return_url: returnUrl, // Go back to Vercel after paying
          customization: {
            title: 'Abreham Fast Food',
            description: 'Food Order'
          }
        },
        {
          headers: { Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}` }
        }
      );

      // Send the payment link back to the frontend
      return res.json({ 
        success: true, 
        paymentUrl: chapaResponse.data.data.checkout_url 
      });

    } catch (error) {
      console.error("Chapa Error:", error.response?.data || error.message);
      return res.status(500).json({ success: false, error: "Payment failed" });
    }
  }

  // === 2. HANDLE CASH ORDERS ===
  
  const ownerMessage = `
🔔 *NEW ORDER!*
👤 ${user.name} (${user.phone})
📍 ${user.location}
💰 ${paymentMethod}
🍔 Order:
${itemsList}
💵 Total: ${total} ETB
  `;

  const customerMessage = `
✅ *Order Confirmed!*
We will call you at ${user.phone} when arriving.
💰 Total: ${total} ETB
  `;

  try {
    if (process.env.OWNER_CHAT_ID) await bot.telegram.sendMessage(process.env.OWNER_CHAT_ID, ownerMessage);
    if (chatId) await bot.telegram.sendMessage(chatId, customerMessage);
    res.json({ success: true });
  } catch (error) {
    console.error("Telegram Error:", error);
    res.json({ success: true });
  }
});

// --- BOT START ---
bot.start((ctx) => {
  ctx.reply("Welcome to Abreham Fast Food! 🍔🍟", 
    Markup.keyboard([
      // MAKE SURE THIS IS YOUR VERCEL URL
      Markup.button.webApp("Order Food Now", "https://abreham-fast-food.vercel.app") 
    ]).resize()
  );
});

bot.launch();

app.listen(PORT, () => console.log(`Server running on ${PORT}`));