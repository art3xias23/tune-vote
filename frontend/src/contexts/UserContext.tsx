import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, UserContextType } from '../types';

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

const FIXED_USERS: User[] = [
  {
    _id: '1',
    username: 'Tino',
    name: 'Tino',
    description: 'Lead guitarist',
    avatar: '🎸',
    isAdmin: true,
    createdAt: new Date().toISOString()
  },
  {
    _id: '2',
    username: 'Misho',
    name: 'Misho',
    description: 'Keyboardist',
    avatar: '🎹',
    isAdmin: false,
    createdAt: new Date().toISOString()
  },
  {
    _id: '3',
    username: 'Tedak',
    name: 'Tedak',
    description: 'Drummer',
    avatar: '🥁',
    isAdmin: false,
    createdAt: new Date().toISOString()
  }
];

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUsername = localStorage.getItem('selectedUser');
    if (savedUsername) {
      const foundUser = FIXED_USERS.find(u => u.username === savedUsername);
      if (foundUser) {
        setUser(foundUser);
      }
    }
    setLoading(false);
  }, []);

  const selectUser = async (username: 'Tino' | 'Misho' | 'Tedak') => {
    const selectedUser = FIXED_USERS.find(u => u.username === username);
    if (selectedUser) {
      localStorage.setItem('selectedUser', username);
      setUser(selectedUser);
    }
  };

  const logout = () => {
    localStorage.removeItem('selectedUser');
    setUser(null);
  };

  const value: UserContextType = {
    user,
    selectUser,
    logout,
    loading,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};