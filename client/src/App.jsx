import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import the real pages
import Menu from './Menu';
import Delivery from './Delivery';
import Payment from './Payment'; // <--- This was missing or not used

function App() {
  const [cart, setCart] = useState([]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Menu cart={cart} setCart={setCart} />} />
        <Route path="/delivery" element={<Delivery />} />
        {/* Pass cart and setCart to Payment so it can calculate total and clear cart */}
        <Route path="/payment" element={<Payment cart={cart} setCart={setCart} />} />
      </Routes>
    </Router>
  );
}

export default App;