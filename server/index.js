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
  console.log("📥 RECEIVED ORDER DATA:", req.body); // <--- Log what came in

  const { user, cart, paymentMethod, total, chatId } = req.body;
  
  // Basic validation
  if (!user || !cart) {
      console.log("❌ Missing user or cart data");
      return res.status(400).json({ error: "Missing data" });
  }

  const itemsList = cart.map(i => `- ${i.name} ($${i.price})`).join('\n');
  
  const ownerMessage = `
🔔 *NEW ORDER!*
👤 ${user.name} (${user.phone})
💰 ${paymentMethod}
💵 Total: $${total}
  `;

  const customerMessage = `✅ Order Received! Total: $${total}`;

  try {
    // 1. Send to Owner
    if (process.env.OWNER_CHAT_ID) {
      console.log(`📤 Sending to Owner (${process.env.OWNER_CHAT_ID})...`);
      await bot.telegram.sendMessage(process.env.OWNER_CHAT_ID, ownerMessage);
      console.log("✅ Sent to Owner");
    } else {
      console.log("⚠️ OWNER_CHAT_ID is missing in .env file");
    }

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
      Markup.button.webApp("Order Food Now", "https://c9ea6fd56c7a48e88dbeb66e4797e736.serveo.net") 
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