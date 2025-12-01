import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Fix for default marker icon missing in React-Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Component to handle clicks and GPS
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
      // Free OpenStreetMap Geocoding
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await response.json();
      // Get a short address
      const simpleAddress = data.display_name.split(',').slice(0, 3).join(',');
      setLocationName(simpleAddress);
    } catch (error) {
      setLocationName(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    }
  };

  useEffect(() => {
    map.locate(); // Ask for GPS permission on load
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
        <label>Location (Tap map below)</label>
        <input type="text" name="location" placeholder="Address..." value={formData.location} onChange={handleChange} />
      </div>

      {/* MAP CONTAINER */}
      <div style={{ height: '250px', borderRadius: '15px', overflow: 'hidden', marginBottom: '20px', border: '2px solid #444' }}>
        <MapContainer center={[9.002, 38.752]} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
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