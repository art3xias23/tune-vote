import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout';
import { useUser } from '../contexts/UserContext';

const Dashboard: React.FC = () => {
  const { user } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/vote');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  const features = [
    {
      icon: '🗳️',
      title: 'Democratic Voting',
      description: 'Cast your votes and help discover the next big sound',
      color: 'from-vote-400 to-vote-600',
      shadowColor: 'shadow-vote'
    },
    {
      icon: '🎵',
      title: 'Music Discovery',
      description: 'Explore our curated database of amazing bands',
      color: 'from-music-400 to-music-600',
      shadowColor: 'shadow-glow'
    },
    {
      icon: '⭐',
      title: 'Rate & Review',
      description: 'Share your honest opinions and build the community',
      color: 'from-rating-400 to-rating-600',
      shadowColor: 'shadow-rating'
    }
  ];

  return (
    <Layout>
      <div className="space-y-8 animate-fade-in">
        <div className="relative overflow-hidden bg-gradient-hero rounded-3xl p-8 lg:p-12 shadow-large">
          <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-transparent"></div>
          <div className="absolute top-4 right-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-4 left-4 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>

          <div className="relative z-10 text-center text-white space-y-6">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-white/20 backdrop-blur-sm
                          rounded-2xl shadow-large mb-4 animate-bounce-subtle">
              <span className="text-6xl">{user?.avatar}</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-4xl lg:text-6xl font-bold">
                Welcome to Tune Vote, {user?.name}!
              </h1>
              <p className="text-xl lg:text-2xl text-white/90 font-medium max-w-2xl mx-auto">
                You're now part of the TuneSquad – where music democracy thrives
              </p>
            </div>

            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6 pt-4">
              <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                <span className="w-3 h-3 bg-vote-400 rounded-full animate-pulse"></span>
                <span className="text-sm font-medium">Community Member</span>
              </div>
              {user?.isAdmin && (
                <div className="flex items-center space-x-2 bg-accent-400/30 backdrop-blur-sm rounded-full px-4 py-2">
                  <span className="w-3 h-3 bg-accent-400 rounded-full animate-pulse"></span>
                  <span className="text-sm font-medium">Administrator</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="bg-gradient-card backdrop-blur-sm rounded-2xl p-6 shadow-large
                       border border-white/20 hover:shadow-large transition-all duration-500
                       transform hover:-translate-y-2 animate-slide-up"
              style={{ animationDelay: `${index * 200}ms` }}
            >
              <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl
                            flex items-center justify-center ${feature.shadowColor} mb-4`}>
                <span className="text-3xl">{feature.icon}</span>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">{feature.title}</h3>
              <p className="text-slate-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="bg-gradient-card backdrop-blur-sm rounded-2xl p-8 shadow-large
                      border border-white/20 text-center animate-scale-in">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-3">Ready to Get Started?</h2>
              <p className="text-slate-600 max-w-lg mx-auto">
                Jump into the voting experience or explore our music database to discover new sounds
              </p>
            </div>

            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <button
                onClick={() => navigate('/vote')}
                className="bg-gradient-vote hover:shadow-vote text-white px-8 py-4 rounded-xl
                         font-bold text-lg transition-all duration-300 transform hover:-translate-y-1
                         shadow-medium hover:shadow-large flex items-center justify-center space-x-3"
              >
                <span className="text-2xl">🗳️</span>
                <span>Start Voting</span>
                <span className="text-sm opacity-75">→</span>
              </button>
              <button
                onClick={() => navigate('/database')}
                className="bg-gradient-music hover:shadow-glow text-white px-8 py-4 rounded-xl
                         font-bold text-lg transition-all duration-300 transform hover:-translate-y-1
                         shadow-medium hover:shadow-large flex items-center justify-center space-x-3"
              >
                <span className="text-2xl">🎵</span>
                <span>Browse Music</span>
                <span className="text-sm opacity-75">→</span>
              </button>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-slate-50 to-blue-50 backdrop-blur-sm rounded-2xl p-6
                      border border-white/20 shadow-soft">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center shadow-medium">
                <span className="text-xl">⏱️</span>
              </div>
              <div>
                <div className="text-sm font-medium text-slate-600">Auto-redirect</div>
                <div className="text-lg font-bold text-slate-800">Taking you to voting in 3 seconds</div>
              </div>
            </div>
            <button
              onClick={() => navigate('/vote')}
              className="text-primary-600 hover:text-primary-700 font-medium text-sm
                       hover:underline transition-colors"
            >
              Skip wait →
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;