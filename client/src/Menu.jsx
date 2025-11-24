import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Menu({ cart, setCart }) {
  const [items, setItems] = useState([]);
  const navigate = useNavigate();

  // Fetch Menu
  useEffect(() => {
    // Using 127.0.0.1 based on previous fix
    axios.get('/api/menu')
      .then(res => setItems(res.data))
      .catch(err => console.error("API Error:", err));

    if (window.Telegram.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand(); // Open full height
    }
  }, []);

  // Helper: Get quantity of specific item in cart
  const getQuantity = (itemId) => {
    return cart.filter(item => item.id === itemId).length;
  };

  // Add Item
  const addToCart = (item) => {
    setCart([...cart, item]);
    if (window.Telegram.WebApp) window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
  };

  // Remove Item (one at a time)
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
      <h2>🍔 Abreham Menu</h2>
      
      {items.map(item => {
        const qty = getQuantity(item.id);
        return (
          <div key={item.id} className="item">
            <div className="item-info">
              <span className="item-icon">{item.image}</span>
              <div className="item-details">
                <b>{item.name}</b>
                <div>${item.price.toFixed(2)}</div>
              </div>
            </div>
            
            {/* Quantity Controls */}
            {qty === 0 ? (
              <button onClick={() => addToCart(item)}>ADD</button>
            ) : (
              <div className="quantity-controls">
                <button onClick={() => removeFromCart(item)}>-</button>
                <span>{qty}</span>
                <button onClick={() => addToCart(item)}>+</button>
              </div>
            )}
          </div>
        );
      })}

      <button className="btn-back" onClick={() => window.Telegram.WebApp.close()}>
        Close App
      </button>

      {/* Bottom Cart Bar */}
      {cart.length > 0 && (
        <div className="cart-bar">
          <div className="total-price">
            Total: ${totalPrice.toFixed(2)}
          </div>
          <button className="btn-next" onClick={() => navigate('/delivery')}>
            ORDER ({cart.length})
          </button>
        </div>
      )}
    </div>
  );
}

export default Menu;