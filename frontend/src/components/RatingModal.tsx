import React, { useState } from 'react';
import { Vote as VoteType } from '../types';

interface RatingModalProps {
  vote: VoteType;
  onSubmit: (voteId: string, score: number) => void;
  onClose: () => void;
}

const RatingModal: React.FC<RatingModalProps> = ({ vote, onSubmit, onClose }) => {
  const [selectedScore, setSelectedScore] = useState<number>(0);
  const [hoveredScore, setHoveredScore] = useState<number>(0);

  const handleSubmit = () => {
    if (selectedScore > 0) {
      onSubmit(vote._id, selectedScore);
    }
  };

  const getScoreColor = (score: number) => {
    if (score <= 3) return 'text-red-500';
    if (score <= 6) return 'text-yellow-500';
    if (score <= 8) return 'text-blue-500';
    return 'text-green-500';
  };

  const getScoreEmoji = (score: number) => {
    if (score <= 2) return '😞';
    if (score <= 4) return '😐';
    if (score <= 6) return '🙂';
    if (score <= 8) return '😊';
    return '🤩';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full p-8">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">⭐</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Rate the Winner!</h2>

          {vote.winner && (
            <div className="flex items-center justify-center space-x-3 bg-yellow-50 p-4 rounded-lg mb-4">
              <img
                src={vote.winner.image}
                alt={vote.winner.name}
                className="w-16 h-16 rounded-lg object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/default-band.png';
                }}
              />
              <div>
                <h3 className="text-lg font-bold text-gray-900">{vote.winner.name}</h3>
                <p className="text-sm text-gray-600">Winner of Vote #{vote.voteNumber}</p>
              </div>
            </div>
          )}

          <p className="text-gray-600 mb-6">
            How would you rate this band from 1 to 10?
          </p>
        </div>

        <div className="mb-8">
          <div className="grid grid-cols-5 gap-2 mb-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
              <button
                key={score}
                onClick={() => setSelectedScore(score)}
                onMouseEnter={() => setHoveredScore(score)}
                onMouseLeave={() => setHoveredScore(0)}
                className={`aspect-square rounded-lg border-2 font-bold text-lg transition-all ${
                  (hoveredScore >= score || selectedScore >= score)
                    ? `border-yellow-400 bg-yellow-100 ${getScoreColor(score)}`
                    : 'border-gray-200 text-gray-400 hover:border-gray-300'
                }`}
              >
                {score}
              </button>
            ))}
          </div>

          {(selectedScore > 0 || hoveredScore > 0) && (
            <div className="text-center">
              <div className="text-4xl mb-2">
                {getScoreEmoji(hoveredScore || selectedScore)}
              </div>
              <div className={`text-lg font-semibold ${getScoreColor(hoveredScore || selectedScore)}`}>
                {hoveredScore || selectedScore}/10
              </div>
              <div className="text-sm text-gray-500">
                {(hoveredScore || selectedScore) <= 3 && 'Not great...'}
                {((hoveredScore || selectedScore) > 3 && (hoveredScore || selectedScore) <= 6) && 'It\'s okay'}
                {((hoveredScore || selectedScore) > 6 && (hoveredScore || selectedScore) <= 8) && 'Pretty good!'}
                {(hoveredScore || selectedScore) > 8 && 'Amazing!'}
              </div>
            </div>
          )}
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4
                       rounded-lg font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={selectedScore === 0}
            className="flex-1 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50
                       disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg
                       font-semibold transition-colors"
          >
            Submit Rating
          </button>
        </div>
      </div>
    </div>
  );
};

export default RatingModal;