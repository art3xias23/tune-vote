import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import { Vote as VoteType } from '../types';
import { voteAPI } from '../services/api';
import { useUser } from '../contexts/UserContext';
import VoteCard from './VoteCard';
import RatingModal from './RatingModal';

const Vote: React.FC = () => {
  const [votes, setVotes] = useState<VoteType[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingVote, setCreatingVote] = useState(false);
  const [ratingVote, setRatingVote] = useState<VoteType | null>(null);
  const { user } = useUser();

  useEffect(() => {
    loadVotes();
  }, []);

  const loadVotes = async () => {
    try {
      const response = await voteAPI.getAll();
      setVotes(response.data);
    } catch (error) {
      console.error('Error loading votes:', error);
    } finally {
      setLoading(false);
    }
  };

  const createNewVote = async () => {
    if (!user?.isAdmin) return;

    setCreatingVote(true);
    try {
      const response = await voteAPI.create();
      setVotes([response.data, ...votes]);
    } catch (error: any) {
      console.error('Error creating vote:', error);
      alert(error.response?.data?.error || 'Error creating vote. Please try again.');
    } finally {
      setCreatingVote(false);
    }
  };

  const handleVoteUpdate = (updatedVote: VoteType) => {
    setVotes(votes.map(v => v._id === updatedVote._id ? updatedVote : v));
    // If vote moved to rating phase, show rating modal
    if (updatedVote.status === 'rating' && updatedVote.winner) {
      setRatingVote(updatedVote);
    }
  };

  const handleRatingSubmit = async (voteId: string, score: number) => {
    try {
      const response = await voteAPI.submitRating(voteId, score);
      setVotes(votes.map(v => v._id === voteId ? response.data : v));
      setRatingVote(null);
    } catch (error: any) {
      console.error('Error submitting rating:', error);
      alert(error.response?.data?.error || 'Error submitting rating. Please try again.');
    }
  };

  const getStatusColor = (status: VoteType['status']) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'runoff': return 'text-orange-600 bg-orange-100';
      case 'rating': return 'text-purple-600 bg-purple-100';
      case 'completed': return 'text-gray-600 bg-gray-100';
      default: return 'text-yellow-600 bg-yellow-100';
    }
  };

  const getStatusIcon = (status: VoteType['status']) => {
    switch (status) {
      case 'active': return '🗳️';
      case 'runoff': return '⚡';
      case 'rating': return '⭐';
      case 'completed': return '✅';
      default: return '⏳';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col justify-center items-center h-64 space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-primary-600 absolute top-0 left-0"></div>
          </div>
          <div className="text-lg font-medium text-slate-600 animate-pulse">
            Loading votes...
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8 animate-fade-in">
        <div className="bg-gradient-card backdrop-blur-sm rounded-2xl p-6 lg:p-8 shadow-large border border-white/20">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center shadow-medium">
                  <span className="text-2xl">🗳️</span>
                </div>
                <div>
                  <h2 className="text-3xl lg:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                    Voting Center
                  </h2>
                  <p className="text-slate-600 font-medium">
                    TuneSquad's democratic music discovery platform
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4 text-sm text-slate-500">
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 bg-vote-500 rounded-full animate-pulse"></span>
                  <span>Active Community</span>
                </span>
                <span>•</span>
                <span>{votes.length} total votes</span>
              </div>
            </div>

            {user?.isAdmin && (
              <button
                onClick={createNewVote}
                disabled={creatingVote}
                className="bg-gradient-vote hover:shadow-vote text-white px-6 py-3 rounded-xl
                         font-semibold transition-all duration-300 transform hover:-translate-y-1
                         disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                         flex items-center space-x-2 shadow-medium hover:shadow-large"
              >
                {creatingVote ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Creating Vote...</span>
                  </>
                ) : (
                  <>
                    <span className="text-lg">✨</span>
                    <span>New Vote</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {votes.length === 0 ? (
          <div className="bg-gradient-card backdrop-blur-sm rounded-2xl p-12 shadow-large
                        border border-white/20 text-center animate-scale-in">
            <div className="w-24 h-24 bg-gradient-to-br from-slate-200 to-slate-300 rounded-2xl
                          flex items-center justify-center shadow-medium mx-auto mb-6 animate-bounce-subtle">
              <span className="text-6xl">🗳️</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-3">Ready to Start Voting?</h3>
            <p className="text-slate-600 mb-8 max-w-md mx-auto">
              {user?.isAdmin
                ? 'Create the first vote and let the TuneSquad community discover amazing music together!'
                : 'Waiting for an admin to start the first voting session. Stay tuned!'}
            </p>
            {user?.isAdmin && (
              <button
                onClick={createNewVote}
                disabled={creatingVote}
                className="bg-gradient-vote hover:shadow-vote text-white px-8 py-4 rounded-xl
                         font-bold text-lg transition-all duration-300 transform hover:-translate-y-1
                         shadow-medium hover:shadow-large"
              >
                {creatingVote ? 'Creating First Vote...' : 'Create First Vote 🚀'}
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {votes.map((vote, index) => (
              <div
                key={vote._id}
                className="bg-gradient-card backdrop-blur-sm rounded-2xl shadow-large border border-white/20
                         hover:shadow-large transition-all duration-500 animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="p-6 lg:p-8">
                  <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start space-y-4 lg:space-y-0 mb-6">
                    <div className="flex items-center space-x-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-medium ${
                        vote.status === 'active' ? 'bg-gradient-vote' :
                        vote.status === 'runoff' ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                        vote.status === 'rating' ? 'bg-gradient-to-br from-rating-400 to-rating-600' :
                        vote.status === 'completed' ? 'bg-gradient-to-br from-slate-400 to-slate-600' :
                        'bg-gradient-to-br from-slate-200 to-slate-300'
                      }`}>
                        <span className="text-2xl text-white">{getStatusIcon(vote.status)}</span>
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-slate-800">
                          Vote #{vote.voteNumber}
                        </h3>
                        <p className="text-sm text-slate-500 font-medium">
                          Created {new Date(vote.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-4 py-2 rounded-xl text-sm font-bold shadow-soft ${getStatusColor(vote.status)}`}>
                        {vote.status.toUpperCase()}
                      </span>
                    </div>

                    {vote.winner && (
                      <div className="bg-gradient-to-br from-rating-50 to-accent-50 backdrop-blur-sm
                                    rounded-xl p-4 shadow-soft border border-rating-200/20">
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <img
                              src={vote.winner.image}
                              alt={vote.winner.name}
                              className="w-16 h-16 rounded-xl object-cover shadow-medium"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/default-band.png';
                              }}
                            />
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-rating-400 to-rating-600
                                          rounded-full flex items-center justify-center shadow-rating">
                              <span className="text-xs text-white font-bold">👑</span>
                            </div>
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-rating-700 uppercase tracking-wide mb-1">
                              Winner
                            </div>
                            <div className="font-bold text-slate-800">{vote.winner.name}</div>
                            {vote.averageRating > 0 && (
                              <div className="flex items-center space-x-1 mt-2">
                                <span className="text-rating-500">⭐</span>
                                <span className="text-sm font-bold text-rating-700">
                                  {vote.averageRating.toFixed(1)} / 10
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <VoteCard
                    vote={vote}
                    currentUser={user!}
                    onVoteUpdate={handleVoteUpdate}
                    onVoteDelete={(voteId) => setVotes(votes.filter(v => v._id !== voteId))}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {ratingVote && (
          <RatingModal
            vote={ratingVote}
            onSubmit={handleRatingSubmit}
            onClose={() => setRatingVote(null)}
          />
        )}
      </div>
    </Layout>
  );
};

export default Vote;