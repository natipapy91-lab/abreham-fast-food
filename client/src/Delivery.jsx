import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Delivery() {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    location: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = () => {
    if (!formData.name || !formData.phone || !formData.location) {
      // Using Telegram popup if available, else alert
      if(window.Telegram.WebApp) {
        window.Telegram.WebApp.showAlert("Please fill in all fields to proceed.");
      } else {
        alert("Please fill in all fields!");
      }
      return;
    }
    navigate('/payment', { state: { userDetails: formData } });
  };

  const handleBack = () => {
    navigate('/');
  };

  // Ensure Telegram Back Button works
  useEffect(() => {
    if (window.Telegram.WebApp) {
      window.Telegram.WebApp.BackButton.show();
      window.Telegram.WebApp.BackButton.onClick(handleBack);
    }
  }, []);

  return (
    <div className="container" style={{ paddingBottom: '100px' }}>
      
      <div className="header-title">
        <h3>📍 Delivery Details</h3>
        <p>Where should we send your food?</p>
      </div>
      
      {/* Name Input */}
      <div className="input-card">
        <label>Full Name</label>
        <input 
          type="text" 
          name="name" 
          placeholder="Enter your name" 
          value={formData.name} 
          onChange={handleChange} 
          autoComplete="off"
        />
      </div>

      {/* Phone Input */}
      <div className="input-card">
        <label>Phone Number</label>
        <input 
          type="tel" 
          name="phone" 
          placeholder="0911..." 
          value={formData.phone} 
          onChange={handleChange} 
          autoComplete="off"
        />
      </div>

      {/* Location Input */}
      <div className="input-card">
        <label>Location / Address</label>
        <input 
          type="text" 
          name="location" 
          placeholder="Short address description" 
          value={formData.location} 
          onChange={handleChange} 
          autoComplete="off"
        />
      </div>

      {/* Fixed Bottom Buttons */}
      <div className="bottom-action-bar">
        <button className="btn-secondary" onClick={handleBack}>
          ←
        </button>
        <button className="btn-primary" onClick={handleNext}>
          To Payment →
        </button>
      </div>

    </div>
  );
}

export default Delivery;