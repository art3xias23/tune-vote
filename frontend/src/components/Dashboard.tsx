import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout';
import { useUser } from '../contexts/UserContext';

const Dashboard: React.FC = () => {
  const { user } = useUser();
  const navigate = useNavigate();

  useEffect(() => {

  }, []);


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
              className="bg-white dark:bg-gray-800 backdrop-blur-sm rounded-2xl p-6 shadow-large
                       border border-white/20 dark:border-gray-700/20 hover:shadow-large transition-all duration-500
                       transform hover:-translate-y-2 animate-slide-up"
              style={{ animationDelay: `${index * 200}ms` }}
            >
              <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl
                            flex items-center justify-center ${feature.shadowColor} mb-4`}>
                <span className="text-3xl">{feature.icon}</span>
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">{feature.title}</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

      </div>
    </Layout>
  );
};

export default Dashboard;