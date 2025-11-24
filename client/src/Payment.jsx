import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

function Payment({ cart, setCart }) {
  const navigate = useNavigate();
  const { state } = useLocation(); 
  const userDetails = state?.userDetails || {};
  
  const [paymentMethod, setPaymentMethod] = useState('Cash On Delivery');
  const [isLoading, setIsLoading] = useState(false);
  
  const total = cart.reduce((sum, item) => sum + item.price, 0);

const handleOrder = async () => {
    setIsLoading(true);
    const savedId = localStorage.getItem('telegram_user_id');

    const orderData = {
      user: userDetails,
      cart: cart,
      paymentMethod: paymentMethod,
      total: total,
      chatId: savedId
    };

    try {
      const response = await axios.post('/api/order', orderData);
      
      // --- NEW: CHECK FOR PAYMENT LINK ---
      if (response.data.paymentUrl) {
        // Open Chapa in Telegram's external browser
        if (window.Telegram.WebApp) {
            window.Telegram.WebApp.openLink(response.data.paymentUrl);
        } else {
            // For testing on computer
            window.location.href = response.data.paymentUrl;
        }
        return; // Stop here, don't clear cart yet
      }

      // --- EXISTING CASH SUCCESS LOGIC ---
      if (window.Telegram.WebApp) {
        window.Telegram.WebApp.showAlert(`✅ Order Placed!`);
        setTimeout(() => window.Telegram.WebApp.close(), 1000);
      } else {
        alert("Order Placed Successfully!");
        navigate('/');
      }
      setCart([]);
      
    } catch (error) {
      alert("Error processing order.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container" style={{ paddingBottom: '100px' }}>
      <div className="header-title">
        <h3>💰 Payment & Confirm</h3>
      </div>

      <div className="input-card" style={{ color: '#fff' }}>
        <label>Total To Pay</label>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f8a100' }}>
          ${total.toFixed(2)}
        </div>
      </div>

      <div className="input-card">
        <label>Payment Method</label>
        <select 
          value={paymentMethod} 
          onChange={(e) => setPaymentMethod(e.target.value)}
          style={{ width: '100%', background: 'transparent', color: 'white', border: 'none', fontSize: '16px' }}
        >
          <option value="Cash On Delivery">💵 Cash On Delivery</option>
          <option value="Online Payment">💳 Online (Bank/Transfer)</option>
        </select>
      </div>

      <div style={{ padding: '0 10px', color: '#888', fontSize: '14px' }}>
        <p>Delivering to: {userDetails.name}</p>
        <p>Phone: {userDetails.phone}</p>
      </div>

      <div className="bottom-action-bar">
        <button className="btn-secondary" onClick={() => navigate('/delivery')}>←</button>
        <button className="btn-primary" onClick={handleOrder} disabled={isLoading}>
          {isLoading ? 'Sending...' : 'CONFIRM ORDER ✅'}
        </button>
      </div>
    </div>
  );
}

export default Payment;