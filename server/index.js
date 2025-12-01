// === 2. HANDLE CASH ORDERS ===
  try {
    console.log("📥 Incoming Cash Order User Data:", JSON.stringify(user)); // <--- CHECK RENDER LOGS FOR THIS

    let locationString = user.location || "No Location Text";
    let hasGPS = false;
    let lat = null;
    let lng = null;

    // Robust check for coordinates
    if (user.latitude && user.longitude) {
        lat = parseFloat(user.latitude);
        lng = parseFloat(user.longitude);
        
        // Ensure they are valid numbers
        if (!isNaN(lat) && !isNaN(lng)) {
            hasGPS = true;
            const mapLink = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
            locationString += `\n\n🗺 [Open Google Maps](${mapLink})`;
        }
    }

    // --- VISUAL CHECK: Changed Title ---
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

    // 1. Send Text Message
    if (process.env.OWNER_CHAT_ID) {
        await bot.telegram.sendMessage(process.env.OWNER_CHAT_ID, ownerMessage, { 
            parse_mode: 'Markdown',
            disable_web_page_preview: true 
        });

        // 2. Send Map Bubble (Wrapped in try/catch to prevent crashes)
        if (hasGPS) {
            try {
                console.log(`📍 Sending Location Bubble: ${lat}, ${lng}`);
                await bot.telegram.sendLocation(process.env.OWNER_CHAT_ID, lat, lng);
            } catch (locError) {
                console.error("❌ Could not send Map Bubble:", locError.message);
                await bot.telegram.sendMessage(process.env.OWNER_CHAT_ID, "⚠️ Map Bubble failed to send, use the link above.");
            }
        }
    }

    if (chatId) await bot.telegram.sendMessage(chatId, "✅ Order Confirmed!");
    res.json({ success: true });

  } catch (error) {
    console.error("Telegram Error:", error);
    res.json({ success: true });
  }