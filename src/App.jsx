import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import GateScanner from './Components/GateScanner';
import AdminDashboard from './Components/AdminDashboard';
import './App.css';
import './index.css';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<GateScanner />} />
        <Route path="/dashboard" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
};

export default App;
