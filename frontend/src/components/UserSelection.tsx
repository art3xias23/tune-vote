import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

const UserSelection: React.FC = () => {
  const { selectUser } = useUser();
  const navigate = useNavigate();

  const users = [
    { username: 'Tino' as const, name: 'Tino', avatar: '🎸', description: 'Admin & Lead Guitarist' },
    { username: 'Misho' as const, name: 'Misho', avatar: '🎹', description: 'Keyboard Virtuoso' },
    { username: 'Tedak' as const, name: 'Tedak', avatar: '🥁', description: 'Rhythm Master' }
  ];

  const handleUserSelect = async (username: 'Tino' | 'Misho' | 'Tedak') => {
    console.log('User selected:', username);
    try {
      await selectUser(username);
      console.log('User selection successful, navigating...');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error selecting user:', error);
    }
  };

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
                onClick={() => {
                  console.log('Button clicked for user:', user.username);
                  alert(`Selected: ${user.name}`);
                  handleUserSelect(user.username);
                }}
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