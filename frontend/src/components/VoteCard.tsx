import React, { useState } from 'react';
import { Vote as VoteType, User } from '../types';
import { voteAPI } from '../services/api';

interface VoteCardProps {
  vote: VoteType;
  currentUser: User;
  onVoteUpdate: (vote: VoteType) => void;
}

const VoteCard: React.FC<VoteCardProps> = ({ vote, currentUser, onVoteUpdate }) => {
  const [selectedBands, setSelectedBands] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const userHasVoted = vote.userVotes.some(uv => uv.userId === currentUser._id);
  const userHasRated = vote.ratings?.some(r => r.userId === currentUser._id);
  const canVote = (vote.status === 'active' || vote.status === 'runoff') && !userHasVoted;
  const canRate = vote.status === 'rating' && !userHasRated;

  const maxSelections = vote.status === 'runoff' ? 1 : 3;

  const handleBandSelect = (bandId: string) => {
    if (selectedBands.includes(bandId)) {
      setSelectedBands(selectedBands.filter(id => id !== bandId));
    } else if (selectedBands.length < maxSelections) {
      setSelectedBands([...selectedBands, bandId]);
    }
  };

  const submitVote = async () => {
    if (selectedBands.length !== maxSelections) return;

    setSubmitting(true);
    try {
      const response = await voteAPI.submitVote(vote._id, selectedBands);
      onVoteUpdate(response.data);
      setSelectedBands([]);
    } catch (error: any) {
      console.error('Error submitting vote:', error);
      alert(error.response?.data?.error || 'Error submitting vote. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (vote.status === 'completed') {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="bg-gradient-card backdrop-blur-sm rounded-2xl p-6 shadow-large border border-white/20">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center shadow-medium">
              <span className="text-2xl">🏆</span>
            </div>
            <div>
              <h4 className="text-xl font-bold text-slate-800">Final Results</h4>
              <p className="text-sm text-slate-500">Vote completed successfully</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {vote.results.map((result, index) => {
              const band = vote.availableBands.find(b => b._id === result.bandId);
              if (!band) return null;

              return (
                <div
                  key={result.bandId}
                  className="group relative bg-white/60 backdrop-blur-sm rounded-xl p-4 shadow-soft
                           border border-white/20 hover:shadow-medium transition-all duration-300
                           hover:-translate-y-1"
                >
                  {index === 0 && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-rating-400 to-rating-600
                                  rounded-full flex items-center justify-center shadow-rating">
                      <span className="text-xs text-white font-bold">👑</span>
                    </div>
                  )}
                  <div className="aspect-square mb-3 overflow-hidden rounded-lg">
                    <img
                      src={band.image}
                      alt={band.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/default-band.png';
                      }}
                    />
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-slate-800 text-sm mb-1">{band.name}</div>
                    <div className="text-xs text-slate-500 bg-slate-100 rounded-full px-2 py-1">
                      {result.votes} vote{result.votes !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {vote.ratings && vote.ratings.length > 0 && (
          <div className="bg-gradient-to-br from-rating-50 to-accent-50 backdrop-blur-sm rounded-2xl p-6
                        shadow-large border border-rating-200/20">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-rating-400 to-rating-600 rounded-xl
                            flex items-center justify-center shadow-rating">
                <span className="text-2xl">⭐</span>
              </div>
              <div>
                <h4 className="text-xl font-bold text-rating-800">
                  Ratings for {vote.winner?.name}
                </h4>
                <p className="text-sm text-rating-600">Community feedback scores</p>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex space-x-6">
                {vote.ratings.map((rating) => (
                  <div key={rating.userId} className="text-center group">
                    <div className="w-16 h-16 bg-white/60 backdrop-blur-sm rounded-xl flex items-center justify-center
                                  shadow-soft mb-2 group-hover:shadow-medium transition-all duration-300">
                      <div className="text-2xl">
                        {currentUser.username === 'Tino' ? '🎸' :
                         currentUser.username === 'Misho' ? '🎹' : '🥁'}
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-rating-700">{rating.score}</div>
                    <div className="text-xs text-rating-500">out of 10</div>
                  </div>
                ))}
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm rounded-xl p-4 shadow-soft">
                  <span className="text-3xl animate-pulse-slow">⭐</span>
                  <div>
                    <div className="text-3xl font-bold text-rating-700">
                      {vote.averageRating.toFixed(1)}
                    </div>
                    <div className="text-sm text-rating-500 font-medium">Average Score</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (vote.status === 'rating') {
    if (canRate) {
      return (
        <div className="bg-gradient-to-br from-rating-50 via-rating-100 to-accent-50 backdrop-blur-sm
                      rounded-2xl p-8 shadow-large border border-rating-200/20 text-center animate-scale-in">
          <div className="w-20 h-20 bg-gradient-to-br from-rating-400 to-rating-600 rounded-2xl
                        flex items-center justify-center shadow-rating mx-auto mb-6 animate-bounce-subtle">
            <span className="text-4xl">⭐</span>
          </div>
          <h4 className="text-2xl font-bold text-rating-800 mb-3">
            Rate the Winning Band
          </h4>
          <div className="text-xl font-semibold text-rating-700 mb-4">
            {vote.winner?.name}
          </div>
          <p className="text-rating-600 mb-8 max-w-md mx-auto">
            Share your honest opinion about this band. Your rating helps the community discover great music!
          </p>
          <button
            onClick={() => onVoteUpdate({ ...vote, status: 'rating' })}
            className="bg-gradient-to-r from-rating-500 to-rating-600 hover:from-rating-600 hover:to-rating-700
                     text-white px-8 py-4 rounded-xl font-semibold shadow-rating hover:shadow-large
                     transition-all duration-300 transform hover:-translate-y-1"
          >
            Rate This Band
          </button>
        </div>
      );
    } else {
      return (
        <div className="bg-gradient-card backdrop-blur-sm rounded-2xl p-8 shadow-large
                      border border-white/20 text-center animate-fade-in">
          <div className="w-20 h-20 bg-gradient-to-br from-slate-200 to-slate-300 rounded-2xl
                        flex items-center justify-center shadow-medium mx-auto mb-6">
            <span className="text-4xl animate-pulse">⏳</span>
          </div>
          <h4 className="text-2xl font-bold text-slate-800 mb-3">Collecting Ratings</h4>
          <p className="text-slate-600 mb-4">
            Waiting for all members to rate {vote.winner?.name}
          </p>
          <div className="flex justify-center space-x-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full ${
                  i < (vote.ratings?.length || 0) ? 'bg-rating-500' : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
          <div className="text-sm text-slate-500 mt-2">
            {vote.ratings?.length || 0} of 3 ratings completed
          </div>
        </div>
      );
    }
  }

  if (canVote) {
    return (
      <div className="space-y-6 animate-slide-up">
        <div className="bg-gradient-to-br from-vote-50 via-primary-50 to-music-50 backdrop-blur-sm
                      rounded-2xl p-6 shadow-large border border-vote-200/20">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-vote rounded-xl flex items-center justify-center shadow-vote">
                <span className="text-2xl text-white">
                  {vote.status === 'runoff' ? '⚡' : '🗳️'}
                </span>
              </div>
              <div>
                <h4 className="text-xl font-bold text-slate-800">
                  {vote.status === 'runoff' ? 'Runoff Vote' : 'Cast Your Vote'}
                </h4>
                <p className="text-sm text-slate-600">
                  Choose {maxSelections} band{maxSelections > 1 ? 's' : ''} you want to support
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-vote-600">
                {selectedBands.length}/{maxSelections}
              </div>
              <div className="text-xs text-slate-500">selected</div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
            {vote.availableBands.map((band, index) => (
              <div
                key={band._id}
                onClick={() => handleBandSelect(band._id)}
                className={`relative cursor-pointer group rounded-xl p-4 transition-all duration-300 transform
                          hover:-translate-y-2 hover:shadow-large ${
                  selectedBands.includes(band._id)
                    ? 'bg-gradient-to-br from-vote-100 to-primary-100 shadow-vote border-2 border-vote-400'
                    : 'bg-white/60 backdrop-blur-sm shadow-soft border border-white/20 hover:border-vote-200'
                }`}
              >
                {selectedBands.includes(band._id) && (
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-vote rounded-full
                                flex items-center justify-center shadow-vote animate-scale-in">
                    <span className="text-white text-sm font-bold">
                      #{selectedBands.indexOf(band._id) + 1}
                    </span>
                  </div>
                )}

                <div className="aspect-square mb-3 overflow-hidden rounded-lg">
                  <img
                    src={band.image}
                    alt={band.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/default-band.png';
                    }}
                  />
                </div>
                <div className="text-center">
                  <div className="font-semibold text-slate-800 text-sm group-hover:text-vote-700
                                transition-colors duration-300">
                    {band.name}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={submitVote}
            disabled={selectedBands.length !== maxSelections || submitting}
            className="w-full bg-gradient-vote hover:shadow-vote text-white py-4 rounded-xl
                     font-bold text-lg transition-all duration-300 transform hover:-translate-y-1
                     disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                     shadow-medium hover:shadow-large"
          >
            {submitting ? (
              <div className="flex items-center justify-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                <span>Submitting Your Vote...</span>
              </div>
            ) : (
              `Submit Vote ${selectedBands.length === maxSelections ? '🚀' : ''}`
            )}
          </button>
        </div>
      </div>
    );
  }

  if (userHasVoted) {
    return (
      <div className="bg-gradient-to-br from-vote-50 to-primary-50 backdrop-blur-sm rounded-2xl p-8
                    shadow-large border border-vote-200/20 text-center animate-scale-in">
        <div className="w-20 h-20 bg-gradient-to-br from-vote-400 to-vote-600 rounded-2xl
                      flex items-center justify-center shadow-vote mx-auto mb-6 animate-bounce-subtle">
          <span className="text-4xl text-white">✅</span>
        </div>
        <h4 className="text-2xl font-bold text-vote-800 mb-3">Vote Submitted!</h4>
        <p className="text-vote-600 mb-6">
          Thank you for participating! Your voice matters to the TuneSquad community.
        </p>
        <div className="flex justify-center space-x-2 mb-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-all duration-300 ${
                i < vote.userVotes.length ? 'bg-vote-500 shadow-vote' : 'bg-slate-200'
              }`}
            />
          ))}
        </div>
        <div className="text-sm text-vote-600 font-medium">
          {vote.userVotes.length} of 3 members have voted
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-card backdrop-blur-sm rounded-2xl p-8 shadow-large
                  border border-white/20 text-center animate-fade-in">
      <div className="w-20 h-20 bg-gradient-to-br from-slate-200 to-slate-300 rounded-2xl
                    flex items-center justify-center shadow-medium mx-auto mb-6">
        <span className="text-4xl">⏳</span>
      </div>
      <h4 className="text-2xl font-bold text-slate-800 mb-3">Vote Inactive</h4>
      <p className="text-slate-600">This voting session is not currently accepting submissions</p>
    </div>
  );
};

export default VoteCard;