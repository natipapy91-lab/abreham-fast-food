import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

function Payment({ cart, setCart }) {
  const navigate = useNavigate();
  const { state } = useLocation(); 
  const userDetails = state?.userDetails || {};
  
  const [paymentMethod, setPaymentMethod] = useState('Cash On Delivery');
  const [isLoading, setIsLoading] = useState(false);
  // Debug state to see if ID is detected
  const [debugId, setDebugId] = useState('Not Detected');

  const total = cart.reduce((sum, item) => sum + item.price, 0);

  useEffect(() => {
    // Check if Telegram ID is visible immediately when page loads
    const telegramId = window.Telegram.WebApp?.initDataUnsafe?.user?.id;
    if (telegramId) setDebugId(telegramId);
  }, []);

  // --- THE FIX: 'async' KEYWORD ---
  const handleOrder = async () => {
    setIsLoading(true);
    
    // Get the ID again right before sending
    const telegramUserId = window.Telegram.WebApp?.initDataUnsafe?.user?.id;

    const orderData = {
      user: userDetails,
      cart: cart,
      paymentMethod: paymentMethod,
      total: total,
      chatId: telegramUserId 
    };

    try {
      await axios.post('/api/order', orderData);
      
      if (window.Telegram.WebApp) {
        window.Telegram.WebApp.showAlert(`✅ Success! Notification sent.`);
        setTimeout(() => window.Telegram.WebApp.close(), 1000);
      } else {
        alert("Order Placed!");
        navigate('/');
      }
      setCart([]);
      
    } catch (error) {
      alert("Error placing order.");
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

      {/* Debug Info: Show User ID on screen */}
      <div style={{fontSize: '10px', color: '#555', textAlign: 'center', marginBottom: '10px'}}>
        Telegram ID: {debugId}
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
          style={{ width: '100%', background: 'transparent', color: 'white', border: 'none' }}
        >
          <option value="Cash On Delivery">💵 Cash On Delivery</option>
          <option value="Online Payment">💳 Online (Bank/Transfer)</option>
        </select>
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