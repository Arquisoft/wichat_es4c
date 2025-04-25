import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Game from './components/Game';
import AddUser from './components/AddUser';
import Home from './components/Home';
import StartMenu from './components/StartMenu';
import Profile from './components/Profile';
import Ranking from './components/Ranking';
import Settings from './components/Settings';
import AdminPanel from './components/AdminPanel';

const AppRouter = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
        <Route path="/register" element={<AddUser />} />
        <Route path="/startmenu" element={isLoggedIn ? <StartMenu /> : <Navigate to="/login" />} />
        <Route path="/game" element={isLoggedIn ? <Game /> : <Navigate to="/login" />} />
        <Route path="/profile/:username" element={isLoggedIn ? <Profile /> : <Navigate to="/login" />} />
        <Route path="/ranking" element={isLoggedIn ? <Ranking /> : <Navigate to="/login" />} />
        <Route path="/settings/:username" element={isLoggedIn ? <Settings /> : <Navigate to="/login" />} />
        <Route path="/adminPanel" element={isLoggedIn ? <AdminPanel /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;