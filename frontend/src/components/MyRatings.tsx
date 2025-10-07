import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import { Vote, Band } from '../types';
import { voteAPI } from '../services/api';
import { useUser } from '../contexts/UserContext';

interface RatedBand {
  band: Band;
  rating: number;
  voteNumber: number;
  voteDate: string;
}

const MyRatings: React.FC = () => {
  const { user } = useUser();
  const [ratedBands, setRatedBands] = useState<RatedBand[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterQuery, setFilterQuery] = useState('');

  useEffect(() => {
    loadRatings();
  }, [user]);

  const loadRatings = async () => {
    if (!user) return;

    try {
      const response = await voteAPI.getAll();
      const votes = response.data;

      // Extract all bands this user has rated
      const userRatings: RatedBand[] = [];

      votes.forEach(vote => {
        if (vote.status === 'completed' && vote.winner) {
          const userRating = vote.ratings.find(r => r.userId === user.username);
          if (userRating) {
            userRatings.push({
              band: vote.winner,
              rating: userRating.score,
              voteNumber: vote.voteNumber,
              voteDate: vote.completedAt || vote.createdAt
            });
          }
        }
      });

      // Sort by date (most recent first)
      userRatings.sort((a, b) => new Date(b.voteDate).getTime() - new Date(a.voteDate).getTime());
      setRatedBands(userRatings);
    } catch (error) {
      console.error('Error loading ratings:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBands = ratedBands.filter(item =>
    item.band.name.toLowerCase().includes(filterQuery.toLowerCase())
  );

  const getAverageRating = () => {
    if (ratedBands.length === 0) return 0;
    const sum = ratedBands.reduce((acc, item) => acc + item.rating, 0);
    return (sum / ratedBands.length).toFixed(1);
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 8) return '#10b981'; // green
    if (rating >= 6) return '#f59e0b'; // yellow
    if (rating >= 4) return '#ef4444'; // red
    return '#6b7280'; // gray
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          Loading your ratings...
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div>
        <h2 className="text-slate-900 dark:text-slate-100 text-2xl font-bold mb-8">My Ratings</h2>

        {/* Stats Section */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg dark:shadow-gray-900/20 text-center border border-gray-200 dark:border-gray-700">
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#1db954' }}>
              {ratedBands.length}
            </div>
            <div className="text-slate-600 dark:text-slate-400 text-sm">Total Bands Rated</div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg dark:shadow-gray-900/20 text-center border border-gray-200 dark:border-gray-700">
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#3b82f6' }}>
              {getAverageRating()}
            </div>
            <div className="text-slate-600 dark:text-slate-400 text-sm">Average Rating</div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg dark:shadow-gray-900/20 text-center border border-gray-200 dark:border-gray-700">
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#f59e0b' }}>
              {ratedBands.filter(r => r.rating >= 8).length}
            </div>
            <div className="text-slate-600 dark:text-slate-400 text-sm">Highly Rated (8+)</div>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg dark:shadow-gray-900/20 mb-8 border border-gray-200 dark:border-gray-700">
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Search your rated bands..."
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-base bg-white dark:bg-gray-700 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Ratings List */}
        {filteredBands.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 p-12 rounded-xl shadow-lg dark:shadow-gray-900/20 text-center border border-gray-200 dark:border-gray-700">
            <p className="text-lg text-slate-600 dark:text-slate-400">
              {filterQuery
                ? `No rated bands matching "${filterQuery}"`
                : "You haven't rated any bands yet"}
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gap: '1rem'
          }}>
            {filteredBands.map((item, index) => (
              <div
                key={`${item.band._id}-${index}`}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg dark:shadow-gray-900/20 transition-all border border-gray-200 dark:border-gray-700 hover:transform hover:-translate-y-1 hover:shadow-xl dark:hover:shadow-gray-900/30"
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                }}
              >
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                  <img
                    src={item.band.image}
                    alt={item.band.name}
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '8px',
                      objectFit: 'cover'
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/default-band.png';
                    }}
                  />

                  <div style={{ flex: 1 }}>
                    <h4 className="m-0 mb-2 text-xl text-slate-900 dark:text-slate-100 font-semibold">
                      {item.band.name}
                    </h4>
                    <div className="flex gap-4 text-sm text-slate-600 dark:text-slate-400">
                      <span>Vote #{item.voteNumber}</span>
                      <span>•</span>
                      <span>{new Date(item.voteDate).toLocaleDateString()}</span>
                      {item.band.genres && item.band.genres.length > 0 && (
                        <>
                          <span>•</span>
                          <span>{item.band.genres.slice(0, 2).join(', ')}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      fontSize: '2rem',
                      fontWeight: 'bold',
                      color: getRatingColor(item.rating)
                    }}>
                      {item.rating}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-500">/ 10</div>
                    <div style={{
                      display: 'flex',
                      gap: '2px',
                      marginTop: '8px',
                      justifyContent: 'center'
                    }}>
                      {[...Array(10)].map((_, i) => (
                        <div
                          key={i}
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '2px',
                            backgroundColor: i < item.rating ? getRatingColor(item.rating) : '#e5e7eb'
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MyRatings;