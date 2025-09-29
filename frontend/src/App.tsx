import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider } from './contexts/UserContext';
import { PrivateRoute } from './components/PrivateRoute';
import UserSelection from './components/UserSelection';
import Dashboard from './components/Dashboard';
import Database from './components/Database';
import Vote from './components/Vote';
import './App.css';

function App() {
  return (
    <UserProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/select-user" element={<UserSelection />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/database"
              element={
                <PrivateRoute>
                  <Database />
                </PrivateRoute>
              }
            />
            <Route
              path="/vote"
              element={
                <PrivateRoute>
                  <Vote />
                </PrivateRoute>
              }
            />
            <Route path="/" element={<Navigate to="/select-user" replace />} />
          </Routes>
        </div>
      </Router>
    </UserProvider>
  );
}

export default App;
