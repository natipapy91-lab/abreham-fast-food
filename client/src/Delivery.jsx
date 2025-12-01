import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix for default marker icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// --- 1. NEW COMPONENT: THE "FIND ME" BUTTON (FIXED) ---
function LocateControl() {
  const map = useMap();

  const handleLocate = (e) => {
    // Stop the map from reacting to this click
    e.preventDefault();
    e.stopPropagation();
    
    // Trigger GPS find
    map.locate();
  };

  return (
    <div 
      onClick={handleLocate}
      // Vital for mobile phones:
      onTouchEnd={handleLocate}
      style={{
        position: 'absolute', 
        top: '15px', 
        right: '15px', 
        zIndex: 9999, /* Force it to top */
        backgroundColor: 'white',
        width: '44px',
        height: '44px',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
        cursor: 'pointer',
        border: '2px solid rgba(0,0,0,0.2)'
      }}
    >
      {/* Target Icon */}
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3390ec" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="16"></line>
        <line x1="8" y1="12" x2="16" y2="12"></line>
      </svg>
    </div>
  );
}

// --- 2. LOGIC TO HANDLE GPS FOUND ---
function LocationMarker({ setLocationName }) {
  const [position, setPosition] = useState(null);
  
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      fetchAddress(e.latlng.lat, e.latlng.lng);
    },
    locationfound(e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
      fetchAddress(e.latlng.lat, e.latlng.lng);
    },
  });

  const fetchAddress = async (lat, lng) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await response.json();
      const simpleAddress = data.display_name.split(',').slice(0, 3).join(',');
      setLocationName(simpleAddress);
    } catch (error) {
      setLocationName(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    }
  };

  useEffect(() => {
    map.locate(); 
  }, [map]);

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}

function Delivery() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', phone: '', location: '' });

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const user = window.Telegram.WebApp.initDataUnsafe?.user;
      if (user) {
        setFormData(prev => ({ ...prev, name: `${user.first_name} ${user.last_name || ''}`.trim() }));
      }
    }
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const updateLocationFromMap = (address) => setFormData(prev => ({ ...prev, location: address }));

  const handleNext = () => {
    if (!formData.name || !formData.phone || !formData.location) {
        alert("Please fill in all fields!");
        return;
    }
    navigate('/payment', { state: { userDetails: formData } });
  };

  return (
    <div className="container" style={{ paddingBottom: '100px' }}>
      <div className="header-title"><h3>📍 Delivery Details</h3></div>
      
      <div className="input-card">
        <label>Full Name</label>
        <input type="text" name="name" value={formData.name} onChange={handleChange} />
      </div>

      <div className="input-card">
        <label>Phone Number</label>
        <input type="tel" name="phone" placeholder="09..." value={formData.phone} onChange={handleChange} />
      </div>

      <div className="input-card">
        <label>Location</label>
        <input type="text" name="location" placeholder="Tap map..." value={formData.location} onChange={handleChange} />
      </div>

      {/* MAP CONTAINER */}
      <div style={{ height: '300px', borderRadius: '15px', overflow: 'hidden', marginBottom: '20px', border: '2px solid #444', position: 'relative' }}>
        <MapContainer center={[9.002, 38.752]} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          
          {/* Find Me Button */}
          <LocateControl />
          
          <LocationMarker setLocationName={updateLocationFromMap} />
        </MapContainer>
      </div>

      <div className="bottom-action-bar">
        <button className="btn-secondary" onClick={() => navigate('/')}>←</button>
        <button className="btn-primary" onClick={handleNext}>To Payment →</button>
      </div>
    </div>
  );
}

export default Delivery;