import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

const UserSelection: React.FC = () => {
  const { selectUser } = useUser();
  const navigate = useNavigate();
  const [selectedUser, setSelectedUser] = useState<'Tino' | 'Misho' | 'Tedak' | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const users = [
    { username: 'Tino' as const, name: 'Tino', avatar: '🎸', description: 'Veteran' },
    { username: 'Misho' as const, name: 'Misho', avatar: '🎹', description: 'Mladok' },
    { username: 'Tedak' as const, name: 'Tedak', avatar: '🥁', description: 'Levent' }
  ];

  const userPins = {
    'Tino': process.env.REACT_APP_TINO_PIN || '4202',
    'Misho': process.env.REACT_APP_MISHO_PIN || '0511',
    'Tedak': process.env.REACT_APP_TEDAK_PIN || '7268'
  };

  const handleUserSelect = (username: 'Tino' | 'Misho' | 'Tedak') => {
    setSelectedUser(username);
    setPin('');
    setError('');
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    if (pin === userPins[selectedUser]) {
      try {
        await selectUser(selectedUser);
        console.log('User selection successful, navigating...');
        navigate('/dashboard');
      } catch (error) {
        console.error('Error selecting user:', error);
        setError('Something went wrong. Please try again.');
      }
    } else {
      setError('Incorrect PIN. Please try again.');
      setPin('');
    }
  };

  const handleBackToSelection = () => {
    setSelectedUser(null);
    setPin('');
    setError('');
  };

  if (selectedUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-6xl font-bold text-white mb-4 tracking-tight">
              🎵 Tune Vote
            </h1>
            <div className="text-8xl mb-4">
              {users.find(u => u.username === selectedUser)?.avatar}
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Welcome, {selectedUser}!
            </h2>
            <p className="text-xl text-blue-200 mb-8">
              Enter your PIN to continue
            </p>
          </div>

          <form onSubmit={handlePinSubmit} className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <div className="mb-6">
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter PIN"
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/60 text-center text-2xl tracking-widest"
                maxLength={4}
                autoFocus
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-center">
                {error}
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="button"
                onClick={handleBackToSelection}
                className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg text-white font-semibold transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={pin.length !== 4}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white font-semibold transition-colors"
              >
                Enter
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-white mb-4 tracking-tight">
            🎵 Tune Vote
          </h1>
          <p className="text-xl text-blue-200 mb-8">
            Choose your TuneSquad identity
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {users.map((user) => (
            <div
              key={user.username}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center
                         transform transition-all duration-300 hover:scale-105 hover:bg-white/20
                         border border-white/20 hover:border-white/40"
            >
              <div className="text-8xl mb-6">{user.avatar}</div>
              <h3 className="text-3xl font-bold text-white mb-2">{user.name}</h3>
              <p className="text-blue-200 text-lg mb-6">{user.description}</p>
              <button
                onClick={() => handleUserSelect(user.username)}
                className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700
                          rounded-full text-white font-semibold transition-colors cursor-pointer"
              >
                Select {user.name}
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-blue-200 text-sm">
            Welcome to the TuneSquad! Select your profile to start voting for the best bands.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserSelection;