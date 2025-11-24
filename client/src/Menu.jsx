import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Menu({ cart, setCart }) {
  const [items, setItems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Fetch Menu
    axios.get('/api/menu')
      .then(res => setItems(res.data))
      .catch(err => console.error(err));

    // 2. AGGRESSIVE ID FINDER
    // Check every 500ms until we find the user ID
    const intervalId = setInterval(() => {
      if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
        
        const user = window.Telegram.WebApp.initDataUnsafe?.user;
        
        if (user && user.id) {
          console.log("✅ FOUND ID:", user.id);
          // Save to storage so Payment page can read it
          localStorage.setItem('telegram_user_id', user.id);
          
          // Stop checking
          clearInterval(intervalId);
        }
      }
    }, 500);

    // Stop checking after 10 seconds (to save battery)
    setTimeout(() => clearInterval(intervalId), 10000);

  }, []);

  // --- STANDARD CART LOGIC BELOW ---
  const getQuantity = (itemId) => cart.filter(item => item.id === itemId).length;

  const addToCart = (item) => {
    setCart([...cart, item]);
    if (window.Telegram.WebApp) window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
  };

  const removeFromCart = (item) => {
    const index = cart.findIndex(c => c.id === item.id);
    if (index > -1) {
      const newCart = [...cart];
      newCart.splice(index, 1);
      setCart(newCart);
    }
    if (window.Telegram.WebApp) window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
  };

  const totalPrice = cart.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="container">
      <div className="header-title">
        <h3>🍔 Abreham Menu</h3>
      </div>
      
      {items.map(item => {
        const qty = getQuantity(item.id);
        return (
          <div key={item.id} className="item">
            <div className="item-info">