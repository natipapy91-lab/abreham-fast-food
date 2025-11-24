const axios = require('axios');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Telegraf, Markup } = require('telegraf');
const path = require('path'); // Required to find React files

const app = express();
const bot = new Telegraf(process.env.BOT_TOKEN);
const PORT = process.env.PORT || 5000;

// --- MIDDLEWARE ---
app.use(cors());
app.use(bodyParser.json());

// --- SERVE REACT STATIC FILES ---
// This tells Node to look into client/dist for the website files
app.use(express.static(path.join(__dirname, '../client/dist')));

// --- DATABASE ---
const menuItems = [
  { id: 1, name: 'Cheeseburger', price: 5.00, image: '🍔' },
  { id: 2, name: 'Chicken Pizza', price: 12.00, image: '🍕' },
  { id: 3, name: 'French Fries', price: 3.50, image: '🍟' },
  { id: 4, name: 'Coca Cola', price: 1.50, image: '🥤' }
];

// --- API ENDPOINTS ---

// 1. Get Menu
app.get('/api/menu', (req, res) => {
  res.json(menuItems);
});

// 2. Place Order
// REPLACE THE app.post('/api/order') SECTION WITH THIS:

app.post('/api/order', async (req, res) => {
  const { user, cart, paymentMethod, total, chatId } = req.body;
  
  // Create a unique Reference Number (e.g., TX-17562...)
  const tx_ref = "TX-" + Date.now();

  const itemsList = cart.map(i => `- ${i.name} ($${i.price})`).join('\n');

  // --- LOGIC 1: IF ONLINE PAYMENT (CHAPA) ---
  if (paymentMethod === 'Online Payment') {
    try {
      const chapaResponse = await axios.post(
        'https://api.chapa.co/v1/transaction/initialize',
        {
          amount: total.toString(),
          currency: 'ETB',
          email: 'customer@abrehamfood.com', // Placeholder email
          first_name: user.name,
          phone_number: user.phone,
          tx_ref: tx_ref,
          // Where to go after payment (Your Render URL)
          return_url: 'https://abreham-fast-food.onrender.com/', 
          customization: {
            title: 'Abreham Fast Food',
            description: 'Payment for food order'
          }
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`
          }
        }
      );

      // Send the Chapa Link back to the frontend
      return res.json({ 
        success: true, 
        paymentUrl: chapaResponse.data.data.checkout_url 
      });

    } catch (error) {
      console.error("Chapa Error:", error.response?.data || error.message);
      return res.status(500).json({ success: false, error: "Payment initiation failed" });
    }
  }

  // --- LOGIC 2: IF CASH ON DELIVERY (OLD LOGIC) ---
  
  const ownerMessage = `
🔔 *NEW CASH ORDER!*
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
💰 Please have ${total} ETB ready.
  `;

  try {
    if (process.env.OWNER_CHAT_ID) {
      await bot.telegram.sendMessage(process.env.OWNER_CHAT_ID, ownerMessage);
    }
    if (chatId) {
      await bot.telegram.sendMessage(chatId, customerMessage);
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Telegram Error:", error);
    res.json({ success: true }); // Still say success to app so it closes
  }
});

    // 2. Send to Customer
    if (chatId) {
      console.log(`📤 Sending to Customer (${chatId})...`);
      await bot.telegram.sendMessage(chatId, customerMessage);
      console.log("✅ Sent to Customer");
    } else {
      console.log("⚠️ No Customer Chat ID received (User might be testing in browser, not Telegram app)");
    }

    res.json({ success: true });
  } catch (error) {
    console.error("❌ TELEGRAM API ERROR:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- CATCH-ALL ROUTE (For React) ---
// We use /(.*)/ to match all routes because '*' causes errors in newer Node versions
app.get(/(.*)/, (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist', 'index.html'));
});

// --- TELEGRAM BOT ---
bot.start((ctx) => {
  console.log("🆔 YOUR CHAT ID IS:", ctx.chat.id);
  ctx.reply("Welcome to Abreham Fast Food! 🍔🍟", 
    Markup.keyboard([
      // We will replace this URL in the final step with Ngrok
      Markup.button.webApp("Order Food Now", "https://abreham-fast-food.onrender.com") 
    ]).resize()
  );
});

bot.launch();
console.log("Bot is running...");

// --- START SERVER ---
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));