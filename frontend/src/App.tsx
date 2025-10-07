import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider } from './contexts/UserContext';
import { ToastProvider } from './contexts/ToastContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { PrivateRoute } from './components/PrivateRoute';
import UserSelection from './components/UserSelection';
import Dashboard from './components/Dashboard';
import Database from './components/Database';
import SearchBands from './components/SearchBands';
import Vote from './components/Vote';
import MyRatings from './components/MyRatings';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <ToastProvider>
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
              path="/search"
              element={
                <PrivateRoute>
                  <SearchBands />
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
            <Route
              path="/my-ratings"
              element={
                <PrivateRoute>
                  <MyRatings />
                </PrivateRoute>
              }
            />
            <Route path="/" element={<Navigate to="/select-user" replace />} />
          </Routes>
        </div>
          </Router>
        </ToastProvider>
      </UserProvider>
    </ThemeProvider>
  );
}

export default App;
