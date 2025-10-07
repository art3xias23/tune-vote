import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import { Band, Vote } from '../types';
import { bandAPI, voteAPI } from '../services/api';
import { useUser } from '../contexts/UserContext';
import { useToast } from '../contexts/ToastContext';

const VoteComponent: React.FC = () => {
  const { user } = useUser();
  const { showToast } = useToast();
  const [votes, setVotes] = useState<Vote[]>([]);
  const [bands, setBands] = useState<Band[]>([]);
  const [selectedBands, setSelectedBands] = useState<string[]>([]);
  const [selectedVote, setSelectedVote] = useState<Vote | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [votingBands, setVotingBands] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  // Reset rating when a new vote is selected
  useEffect(() => {
    if (selectedVote) {
      setRating(0);
      setHoverRating(0);
    }
  }, [selectedVote]);

  const loadData = async () => {
    try {
      const [votesResponse, bandsResponse] = await Promise.all([
        voteAPI.getAll(),
        bandAPI.getAll()
      ]);

      setVotes(votesResponse.data);
      setBands(bandsResponse.data);
    } catch (error) {
      console.error('Error loading data:', error);
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBandSelect = (bandId: string) => {
    // Prevent selecting previous winners
    if (isBandPreviousWinner(bandId)) {
      showToast('This band has already won a previous vote and cannot be selected again', 'error');
      return;
    }

    if (selectedBands.includes(bandId)) {
      setSelectedBands(selectedBands.filter(id => id !== bandId));
    } else if (selectedBands.length < 3) {
      setSelectedBands([...selectedBands, bandId]);
    } else {
      showToast('You can only select 3 bands', 'info');
    }
  };

  const createVote = async () => {
    if (selectedBands.length !== 3) {
      showToast('Please select exactly 3 bands', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const response = await voteAPI.create(selectedBands, user?.username);
      setVotes([response.data, ...votes]);
      setSelectedBands([]);
      setShowCreateForm(false);
      showToast('Vote created successfully!', 'success');
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to create vote', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteVote = async (voteId: string) => {
    if (!window.confirm('Are you sure you want to delete this vote? This action cannot be undone.')) {
      return;
    }

    try {
      await voteAPI.deleteVote(voteId);
      setVotes(votes.filter(v => v._id !== voteId));
      if (selectedVote?._id === voteId) {
        setSelectedVote(null);
      }
      showToast('Vote deleted successfully!', 'success');
    } catch (error: any) {
      console.error('Error deleting vote:', error);
      showToast(error.response?.data?.error || 'Failed to delete vote', 'error');
    }
  };

  const submitVote = async (voteId: string) => {
    if (votingBands.length === 0) {
      showToast('Please select at least one band', 'error');
      return;
    }
    if (votingBands.length > 3) {
      showToast('You can select maximum 3 bands', 'error');
      return;
    }

    setSubmitting(true);
    try {
      // Submit all selected bands in a single request
      const response = await voteAPI.submitVoteMultiple(voteId, votingBands, user?.username);
      const updatedVote = response.data;

      const updatedVotes = votes.map(v => v._id === voteId ? updatedVote : v);
      setVotes(updatedVotes);
      setSelectedVote(updatedVote);
      setVotingBands([]);
      showToast(`Your votes (${votingBands.length} bands) have been submitted!`, 'success');
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to submit vote', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleVotingBand = (bandId: string) => {
    if (votingBands.includes(bandId)) {
      setVotingBands(votingBands.filter(id => id !== bandId));
    } else if (votingBands.length < 3) {
      setVotingBands([...votingBands, bandId]);
    } else {
      showToast('You can select up to 3 bands', 'info');
    }
  };

  const submitRating = async (voteId: string) => {
    setSubmitting(true);
    try {
      const response = await voteAPI.submitRating(voteId, rating, user?.username);
      const updatedVotes = votes.map(v => v._id === voteId ? response.data : v);
      setVotes(updatedVotes);
      setSelectedVote(response.data);
      showToast('Your rating has been submitted!', 'success');
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to submit rating', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const hasUserVoted = (vote: Vote) => {
    if (!user) return false;
    // Check both username and _id to be safe
    return vote.votes.some(v => v.userId === user.username || v.userId === user._id);
  };

  const hasUserRated = (vote: Vote) => {
    if (!user) return false;
    // Check both username and _id to be safe
    return vote.ratings.some(r => r.userId === user.username || r.userId === user._id);
  };

  const canCreateNewVote = (): boolean => {
    if (votes.length === 0) return true;
    const latestVote = votes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    return latestVote.status === 'completed' && latestVote.ratings.length === 3;
  };

  const getVoteCount = (vote: Vote, bandId: string) => {
    return vote.votes.filter(v => v.bandId === bandId).length;
  };

  const isBandPreviousWinner = (bandId: string): boolean => {
    return votes.some(vote => vote.winner && vote.winner._id === bandId && vote.status === 'completed');
  };

  const getRatingColor = (score: number) => {
    if (score >= 8) return '#10b981';
    if (score >= 6) return '#f59e0b';
    return '#ef4444';
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="animate-spin">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 className="text-slate-900 dark:text-slate-100 text-2xl font-bold mb-4">Voting System</h2>
          <button
            onClick={() => canCreateNewVote() && setShowCreateForm(!showCreateForm)}
            disabled={!canCreateNewVote()}
            title={!canCreateNewVote() ? "Complete the current vote's rating phase before creating a new one" : ""}
            style={{
              backgroundColor: canCreateNewVote() ? '#1db954' : '#6b7280',
              color: 'white',
              border: 'none',
              padding: '10px 24px',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: canCreateNewVote() ? 'pointer' : 'not-allowed',
              opacity: canCreateNewVote() ? 1 : 0.7
            }}
          >
            {showCreateForm ? 'Cancel' : '+ Create New Vote'}
          </button>
        </div>

        {/* CREATE VOTE FORM */}
        {showCreateForm && (
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg dark:shadow-gray-900/20 mb-8 border border-gray-200 dark:border-gray-700">
            <h3 className="text-slate-900 dark:text-slate-100 text-xl font-semibold mb-2">Create a New Vote</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Select 3 bands for everyone to vote on
            </p>

            <div className="flex justify-between items-center mb-8 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                Selected: {selectedBands.length} / 3 bands
              </span>
              <button
                onClick={createVote}
                disabled={selectedBands.length !== 3 || submitting}
                style={{
                  backgroundColor: selectedBands.length === 3 ? '#1db954' : '#ccc',
                  color: 'white',
                  border: 'none',
                  padding: '10px 24px',
                  borderRadius: '6px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: selectedBands.length === 3 ? 'pointer' : 'not-allowed'
                }}
              >
                {submitting ? 'Creating...' : 'Create Vote'}
              </button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: '1rem'
            }}>
              {bands.map(band => {
                const isPreviousWinner = isBandPreviousWinner(band._id);
                const isSelected = selectedBands.includes(band._id);

                return (
                  <div
                    key={band._id}
                    onClick={() => !isPreviousWinner && handleBandSelect(band._id)}
                    style={{
                      padding: '0.5rem',
                      borderRadius: '8px',
                      border: isPreviousWinner
                        ? '2px solid #d1d5db'
                        : isSelected
                          ? '2px solid #1db954'
                          : '2px solid #e0e0e0',
                      cursor: isPreviousWinner ? 'not-allowed' : 'pointer',
                      textAlign: 'center',
                      backgroundColor: isPreviousWinner
                        ? '#f3f4f6'
                        : isSelected
                          ? '#e8f5e9'
                          : 'white',
                      opacity: isPreviousWinner ? 0.5 : 1,
                      transition: 'all 0.2s',
                      position: 'relative'
                    }}
                  >
                    {isPreviousWinner && (
                      <div style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        backgroundColor: '#fbbf24',
                        color: 'white',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        zIndex: 1
                      }}>
                        👑
                      </div>
                    )}

                    <img
                      src={band.image}
                      alt={band.name}
                      style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '6px',
                        objectFit: 'cover',
                        marginBottom: '0.5rem',
                        filter: isPreviousWinner ? 'grayscale(70%)' : 'none'
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/default-band.png';
                      }}
                    />
                    <div style={{
                      fontWeight: isSelected ? '600' : '400',
                      color: isPreviousWinner ? '#6b7280' : 'inherit'
                    }}>
                      {band.name}
                    </div>
                    {isSelected && !isPreviousWinner && (
                      <div style={{ color: '#1db954', fontSize: '12px', marginTop: '4px' }}>
                        ✓ Selected
                      </div>
                    )}
                    {isPreviousWinner && (
                      <div style={{ color: '#6b7280', fontSize: '10px', marginTop: '4px', fontWeight: '500' }}>
                        Previous Winner
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VOTES LIST */}
        <div style={{ marginBottom: '2rem' }}>
          {votes.length === 0 ? (
            <div className="bg-gray-100 dark:bg-gray-800 p-8 rounded-xl text-center border border-gray-200 dark:border-gray-700">
              <p className="text-slate-600 dark:text-slate-400">No votes yet. Create one to get started!</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {votes.map(vote => {
                const isActive = vote.status === 'active';
                const isRating = vote.status === 'rating';
                const isCompleted = vote.status === 'completed';

                return (
                  <div
                    key={vote._id}
                    className={`bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md dark:shadow-gray-900/20 border-2 transition-all cursor-pointer ${selectedVote?._id === vote._id ? 'border-green-500' : 'border-transparent dark:border-gray-700'
                      }`}
                    onClick={() => setSelectedVote(vote)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div>
                        <h4 className="mb-2 text-slate-900 dark:text-slate-100 font-semibold">
                          Vote #{vote.voteNumber || votes.indexOf(vote) + 1}
                        </h4>
                        <p className="text-slate-600 dark:text-slate-400 text-sm">
                          Created by <strong>{vote.createdBy}</strong> •
                          {isCompleted && <span style={{ color: '#28a745' }}> Completed</span>}
                          {isRating && <span style={{ color: '#9333ea' }}> Rating Phase</span>}
                          {isActive && <span> {new Set(vote.votes.map(v => v.userId)).size} / 3 members voted</span>}
                        </p>

                        {/* Band Preview */}
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                          {vote.selectedBands.slice(0, 3).map(band => (
                            <div key={band._id} style={{ textAlign: 'center' }}>
                              <img
                                src={band.image}
                                alt={band.name}
                                style={{
                                  width: '50px',
                                  height: '50px',
                                  borderRadius: '4px',
                                  objectFit: 'cover'
                                }}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/default-band.png';
                                }}
                              />
                              <div className="text-xs mt-1 text-slate-700 dark:text-slate-300">{band.name}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedVote(vote);
                          }}
                          style={{
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            fontSize: '14px',
                            cursor: 'pointer'
                          }}
                        >
                          View
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteVote(vote._id);
                          }}
                          style={{
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            fontSize: '14px',
                            cursor: 'pointer'
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SELECTED VOTE DETAILS */}
        {selectedVote && (
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg dark:shadow-gray-900/20 border border-gray-200 dark:border-gray-700">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h3 className="text-slate-900 dark:text-slate-100 text-xl font-semibold">Vote Details</h3>
              <button
                onClick={() => setSelectedVote(null)}
                style={{
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>

            {/* VOTING PHASE */}
            {selectedVote.status === 'active' && !hasUserVoted(selectedVote) ? (
              <div>
                <div style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  padding: '2rem',
                  borderRadius: '16px',
                  marginBottom: '2rem',
                  textAlign: 'center',
                  color: 'white',
                  boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)'
                }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.8rem', fontWeight: '700' }}>
                    🎯 Cast Your Votes
                  </h3>
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '12px',
                    padding: '12px 20px',
                    display: 'inline-block',
                    fontSize: '1.2rem',
                    fontWeight: '600'
                  }}>
                    Selected: {votingBands.length} / 3 bands
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '2rem',
                  marginBottom: '2rem'
                }}>
                  {selectedVote.selectedBands.map((band, index) => {
                    const isSelected = votingBands.includes(band._id);
                    return (
                      <div
                        key={band._id}
                        onClick={() => toggleVotingBand(band._id)}
                        style={{
                          position: 'relative',
                          background: isSelected
                            ? 'linear-gradient(135deg, #e0e7ff 0%, #f3e8ff 100%)'
                            : 'white',
                          borderRadius: '20px',
                          overflow: 'hidden',
                          boxShadow: isSelected
                            ? '0 8px 30px rgba(102, 126, 234, 0.25)'
                            : '0 4px 20px rgba(0,0,0,0.08)',
                          transition: 'all 0.3s ease',
                          cursor: 'pointer',
                          border: isSelected
                            ? '3px solid #667eea'
                            : '3px solid transparent',
                          transform: isSelected ? 'translateY(-4px)' : 'translateY(0)'
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.transform = 'translateY(-8px)';
                            e.currentTarget.style.boxShadow = '0 12px 35px rgba(0,0,0,0.15)';
                            e.currentTarget.style.borderColor = '#a5b4fc';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
                            e.currentTarget.style.borderColor = 'transparent';
                          }
                        }}
                      >
                        {/* Number Badge or Check Mark */}
                        <div style={{
                          position: 'absolute',
                          top: '15px',
                          left: '15px',
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: isSelected
                            ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: 'bold',
                          fontSize: '1.2rem',
                          zIndex: 1,
                          boxShadow: isSelected
                            ? '0 4px 10px rgba(16, 185, 129, 0.3)'
                            : '0 4px 10px rgba(102, 126, 234, 0.3)',
                          transition: 'all 0.3s ease'
                        }}>
                          {isSelected ? '✓' : index + 1}
                        </div>

                        {/* Selection Indicator Overlay */}
                        {isSelected && (
                          <div style={{
                            position: 'absolute',
                            top: '15px',
                            right: '15px',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: 'white',
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            zIndex: 1,
                            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                          }}>
                            Selected {votingBands.indexOf(band._id) + 1}
                          </div>
                        )}

                        {/* Band Image */}
                        <div style={{
                          position: 'relative',
                          width: '100%',
                          paddingBottom: '100%',
                          overflow: 'hidden',
                          background: 'linear-gradient(180deg, transparent 60%, rgba(0,0,0,0.7) 100%)'
                        }}>
                          <img
                            src={band.image}
                            alt={band.name}
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              transition: 'transform 0.3s ease'
                            }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/default-band.png';
                            }}
                            onMouseEnter={(e) => {
                              (e.target as HTMLImageElement).style.transform = 'scale(1.1)';
                            }}
                            onMouseLeave={(e) => {
                              (e.target as HTMLImageElement).style.transform = 'scale(1)';
                            }}
                          />

                          {/* Band Name Overlay */}
                          <div style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            padding: '1.5rem',
                            background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.8) 100%)'
                          }}>
                            <h3 style={{
                              color: 'white',
                              margin: 0,
                              fontSize: '1.4rem',
                              fontWeight: '700',
                              textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                            }}>
                              {band.name}
                            </h3>
                          </div>
                        </div>

                        {/* Selection Status Section */}
                        <div style={{
                          padding: '1.5rem',
                          background: isSelected
                            ? 'linear-gradient(180deg, #f0fdf4 0%, #dcfce7 100%)'
                            : 'linear-gradient(180deg, #f8f9fa 0%, white 100%)'
                        }}>
                          <div style={{
                            textAlign: 'center',
                            fontSize: '1.1rem',
                            fontWeight: '600',
                            color: isSelected ? '#059669' : '#64748b'
                          }}>
                            {isSelected ? (
                              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '1.3rem' }}>✅</span>
                                Selected
                              </span>
                            ) : (
                              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '1.3rem' }}>⭕</span>
                                Click to select
                              </span>
                            )}
                          </div>

                          <p style={{
                            margin: '12px 0 0 0',
                            fontSize: '0.9rem',
                            color: isSelected ? '#059669' : '#94a3b8',
                            textAlign: 'center'
                          }}>
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Submit Button */}
                <div style={{
                  textAlign: 'center',
                  padding: '2rem 0'
                }}>
                  <button
                    onClick={() => submitVote(selectedVote._id)}
                    disabled={votingBands.length === 0 || submitting}
                    style={{
                      padding: '16px 48px',
                      background: votingBands.length === 0
                        ? 'linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%)'
                        : submitting
                          ? 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)'
                          : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '16px',
                      fontSize: '1.2rem',
                      fontWeight: '700',
                      cursor: votingBands.length === 0 || submitting ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: votingBands.length === 0
                        ? '0 4px 15px rgba(148, 163, 184, 0.3)'
                        : '0 6px 25px rgba(16, 185, 129, 0.4)',
                      transform: 'translateY(0)',
                      minWidth: '250px'
                    }}
                    onMouseEnter={(e) => {
                      if (votingBands.length > 0 && !submitting) {
                        e.currentTarget.style.transform = 'translateY(-3px)';
                        e.currentTarget.style.boxShadow = '0 8px 30px rgba(16, 185, 129, 0.5)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = votingBands.length === 0
                        ? '0 4px 15px rgba(148, 163, 184, 0.3)'
                        : '0 6px 25px rgba(16, 185, 129, 0.4)';
                    }}
                  >
                    {submitting ? (
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                        <span style={{
                          display: 'inline-block',
                          width: '20px',
                          height: '20px',
                          border: '3px solid white',
                          borderTopColor: 'transparent',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite'
                        }}></span>
                        Submitting your votes...
                      </span>
                    ) : votingBands.length === 0 ? (
                      <span>Select bands to vote</span>
                    ) : (
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '1.4rem' }}>🚀</span>
                        Submit {votingBands.length} Vote{votingBands.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </button>

                  {votingBands.length > 0 && (
                    <p style={{
                      marginTop: '1rem',
                      fontSize: '0.95rem',
                      color: '#64748b'
                    }}>
                      You have selected {votingBands.length} band{votingBands.length > 1 ? 's' : ''}.
                      You can select up to {3 - votingBands.length} more.
                    </p>
                  )}
                </div>

                <style>{`
                  @keyframes spin {
                    to { transform: rotate(360deg); }
                  }
                `}</style>
              </div>
            ) : selectedVote.status === 'rating' && !hasUserRated(selectedVote) && selectedVote.winner ? (
              // RATING PHASE - Show horizontal images AND 5-star rating system
              <div>
                {/* Results Header */}
                <div style={{
                  background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                  padding: '2rem',
                  borderRadius: '16px',
                  marginBottom: '2rem',
                  textAlign: 'center',
                  border: '1px solid rgba(148, 163, 184, 0.2)'
                }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.8rem', fontWeight: '700', color: '#1e293b' }}>
                    📊 Vote Results
                  </h3>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '1.1rem' }}>
                    All 3 members have voted
                  </p>
                </div>

                {/* Band Results - Horizontal Layout */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '2rem',
                  marginBottom: '4rem'
                }}>
                  {selectedVote.selectedBands
                    .map(band => ({
                      ...band,
                      voteCount: getVoteCount(selectedVote, band._id),
                      voters: selectedVote.votes.filter(v => v.bandId === band._id)
                    }))
                    .sort((a, b) => b.voteCount - a.voteCount)
                    .map((band, index) => {
                      const percentage = (band.voteCount / Math.max(selectedVote.votes.length, 1)) * 100;
                      const isWinner = selectedVote.winner && selectedVote.winner._id === band._id;

                      return (
                        <div key={band._id} style={{
                          position: 'relative',
                          background: 'white',
                          borderRadius: '20px',
                          overflow: 'hidden',
                          boxShadow: isWinner
                            ? '0 8px 30px rgba(16, 185, 129, 0.25)'
                            : '0 4px 20px rgba(0,0,0,0.08)',
                          border: isWinner ? '3px solid #10b981' : '3px solid transparent',
                          transform: isWinner ? 'scale(1.02)' : 'scale(1)',
                          transition: 'all 0.3s ease'
                        }}>
                          {/* Position Badge - Top Left */}
                          <div style={{
                            position: 'absolute',
                            top: '15px',
                            left: '15px',
                            width: '50px',
                            height: '50px',
                            borderRadius: '50%',
                            background: `linear-gradient(135deg, ${isWinner ? '#f97316' : index === 1 ? '#6b7280' : '#94a3b8'} 0%, ${isWinner ? '#ea580c' : index === 1 ? '#4b5563' : '#64748b'} 100%)`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '1.4rem',
                            zIndex: 2,
                            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                            border: isWinner ? '3px solid #fff' : 'none'
                          }}>
                            #{isWinner ? '1' : index + 1}
                          </div>

                          {/* Winner Badge - Top Right */}
                          {isWinner && (
                            <div style={{
                              position: 'absolute',
                              top: '15px',
                              right: '15px',
                              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              color: 'white',
                              padding: '10px 20px',
                              borderRadius: '30px',
                              fontSize: '1rem',
                              fontWeight: '800',
                              zIndex: 2,
                              boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)',
                              border: '2px solid #fff',
                              textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                            }}>
                              WINNER
                            </div>
                          )}

                          {/* Large Band Image */}
                          <div style={{
                            position: 'relative',
                            width: '100%',
                            paddingBottom: '100%',
                            overflow: 'hidden',
                            background: 'linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.8) 100%)'
                          }}>
                            <img
                              src={band.image}
                              alt={band.name}
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                              }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/default-band.png';
                              }}
                            />

                            {/* Band Name Overlay */}
                            <div style={{
                              position: 'absolute',
                              bottom: 0,
                              left: 0,
                              right: 0,
                              padding: '1.5rem',
                              background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.9) 100%)'
                            }}>
                              <h3 style={{
                                color: 'white',
                                margin: 0,
                                fontSize: '1.5rem',
                                fontWeight: '700',
                                textShadow: '0 2px 4px rgba(0,0,0,0.7)'
                              }}>
                                {band.name}
                              </h3>
                              <p style={{
                                color: '#e2e8f0',
                                margin: '0.5rem 0 0 0',
                                fontSize: '1rem',
                                fontWeight: '500'
                              }}>
                                {band.voteCount} vote{band.voteCount !== 1 ? 's' : ''}
                                {band.voters.length > 0 && (
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '0.5rem' }}>
                                    {band.voters.map((vote, idx) => (
                                      <span
                                        key={idx}
                                        style={{
                                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                          color: 'white',
                                          padding: '2px 8px',
                                          borderRadius: '12px',
                                          fontSize: '0.8rem',
                                          fontWeight: '600',
                                          boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)',
                                          border: '1px solid rgba(255, 255, 255, 0.2)'
                                        }}
                                      >
                                        {vote.userId}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* 5-Star Rating System */}
                <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg dark:shadow-gray-900/20 border border-gray-200 dark:border-gray-700 text-center">
                  <h4 className="text-slate-900 dark:text-slate-100 text-xl font-semibold mb-6">
                    Rate the Winner: {selectedVote.winner.name}
                  </h4>
                  <div style={{ marginTop: '2rem' }}>
                    <div className="flex justify-center gap-2 mb-6"
                         onMouseLeave={() => setHoverRating(0)}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '3.5rem',
                            cursor: 'pointer',
                            color: star <= (hoverRating || rating) ? '#fbbf24' : '#e5e7eb',
                            transition: 'all 0.2s ease',
                            padding: '0.5rem',
                            transform: star <= (hoverRating || rating) ? 'scale(1.1)' : 'scale(1)',
                            filter: star <= (hoverRating || rating) ? 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.5))' : 'none'
                          }}
                        >
                          {star <= (hoverRating || rating) ? '⭐' : '☆'}
                        </button>
                      ))}
                    </div>
                    <p style={{
                      margin: '1rem 0 2rem 0',
                      fontSize: '1.2rem',
                      color: rating > 0 ? '#059669' : '#64748b'
                    }}>
                      {rating > 0 ? `${rating} out of 5 stars` : 'Click to rate the winner'}
                    </p>

                    <button
                      onClick={() => submitRating(selectedVote._id)}
                      disabled={submitting || rating === 0}
                      className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-colors"
                    >
                      {submitting ? 'Submitting...' : 'Submit Rating'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (selectedVote.status === 'rating' || selectedVote.status === 'completed') && selectedVote.winner ? (
              // RESULTS VIEW - Shows in both rating and completed phases
              <div>
                {/* Results Header */}
                <div style={{
                  background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                  padding: '2rem',
                  borderRadius: '16px',
                  marginBottom: '2rem',
                  textAlign: 'center',
                  border: '1px solid rgba(148, 163, 184, 0.2)'
                }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.8rem', fontWeight: '700', color: '#1e293b' }}>
                    📊 Vote Results
                  </h3>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '1.1rem' }}>
                    {new Set(selectedVote.votes.map(v => v.userId)).size} out of 3 members have voted
                  </p>
                </div>

                {/* Band Results - Horizontal Layout */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '2rem',
                  marginBottom: '2rem'
                }}>
                  {selectedVote.selectedBands
                    .map(band => ({
                      ...band,
                      voteCount: getVoteCount(selectedVote, band._id),
                      voters: selectedVote.votes.filter(v => v.bandId === band._id)
                    }))
                    .sort((a, b) => b.voteCount - a.voteCount)
                    .map((band, index) => {
                      const percentage = (band.voteCount / Math.max(selectedVote.votes.length, 1)) * 100;
                      const isWinner = selectedVote.winner && selectedVote.winner._id === band._id;

                      return (
                        <div key={band._id} style={{
                          position: 'relative',
                          background: 'white',
                          borderRadius: '20px',
                          overflow: 'hidden',
                          boxShadow: isWinner
                            ? '0 8px 30px rgba(249, 115, 22, 0.25)'
                            : '0 4px 20px rgba(0,0,0,0.08)',
                          border: isWinner ? '3px solid #f97316' : '3px solid transparent',
                          transform: isWinner ? 'scale(1.02)' : 'scale(1)',
                          transition: 'all 0.3s ease'
                        }}>
                          {/* Position Badge - Top Left */}
                          <div style={{
                            position: 'absolute',
                            top: '15px',
                            left: '15px',
                            width: '50px',
                            height: '50px',
                            borderRadius: '50%',
                            background: `linear-gradient(135deg, ${isWinner ? '#f97316' : index === 1 ? '#6b7280' : '#94a3b8'} 0%, ${isWinner ? '#ea580c' : index === 1 ? '#4b5563' : '#64748b'} 100%)`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '1.4rem',
                            zIndex: 2,
                            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                            border: isWinner ? '3px solid #fff' : 'none'
                          }}>
                            #{isWinner ? '1' : index + 1}
                          </div>

                          {/* Winner Badge - Top Right */}
                          {isWinner && (
                            <div style={{
                              position: 'absolute',
                              top: '15px',
                              right: '15px',
                              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              color: 'white',
                              padding: '10px 20px',
                              borderRadius: '30px',
                              fontSize: '1rem',
                              fontWeight: '800',
                              zIndex: 2,
                              boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)',
                              border: '2px solid #fff',
                              textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                            }}>
                              WINNER
                            </div>
                          )}

                          {/* Large Band Image */}
                          <div style={{
                            position: 'relative',
                            width: '100%',
                            paddingBottom: '100%', // Square aspect ratio for horizontal layout
                            overflow: 'hidden',
                            background: 'linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.8) 100%)'
                          }}>
                            <img
                              src={band.image}
                              alt={band.name}
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                              }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/default-band.png';
                              }}
                            />

                            {/* Band Name Overlay */}
                            <div style={{
                              position: 'absolute',
                              bottom: 0,
                              left: 0,
                              right: 0,
                              padding: '1.5rem',
                              background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.9) 100%)'
                            }}>
                              <h3 style={{
                                color: 'white',
                                margin: 0,
                                fontSize: '1.5rem',
                                fontWeight: '700',
                                textShadow: '0 2px 4px rgba(0,0,0,0.7)'
                              }}>
                                {band.name}
                              </h3>
                            </div>
                          </div>

                          {/* Vote Information */}
                          <div style={{ padding: '1.5rem' }}>
                            {/* Vote Count and Progress Bar */}
                            <div style={{ marginBottom: '1rem' }}>
                              <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '8px'
                              }}>
                                <span style={{ fontWeight: '600', fontSize: '1.1rem', color: '#1e293b' }}>
                                  Votes Received
                                </span>
                                <span style={{
                                  background: band.voteCount > 0
                                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                                    : 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)',
                                  color: band.voteCount > 0 ? 'white' : '#6b7280',
                                  padding: '6px 14px',
                                  borderRadius: '20px',
                                  fontSize: '1rem',
                                  fontWeight: '700'
                                }}>
                                  {band.voteCount} Vote{band.voteCount !== 1 ? 's' : ''}
                                </span>
                              </div>

                              {/* Progress Bar */}
                              <div style={{
                                backgroundColor: '#f1f5f9',
                                height: '12px',
                                borderRadius: '10px',
                                overflow: 'hidden',
                                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
                              }}>
                                <div style={{
                                  background: `linear-gradient(90deg, ${percentage > 0 ? '#10b981' : '#e5e7eb'
                                    } 0%, ${percentage > 0 ? '#059669' : '#d1d5db'
                                    } 100%)`,
                                  height: '100%',
                                  width: `${Math.max(percentage, 5)}%`, // Minimum 5% for visibility
                                  transition: 'width 0.6s ease',
                                  borderRadius: percentage === 100 ? '10px' : '10px 0 0 10px'
                                }} />
                              </div>
                            </div>

                            {/* Individual Voters */}
                            {band.voters.length > 0 ? (
                              <div>
                                <div style={{
                                  fontSize: '0.9rem',
                                  fontWeight: '600',
                                  color: '#64748b',
                                  marginBottom: '8px'
                                }}>
                                  Voted by:
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                  {band.voters.map((vote, idx) => (
                                    <div key={idx} style={{
                                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                      color: 'white',
                                      padding: '4px 12px',
                                      borderRadius: '15px',
                                      fontSize: '0.85rem',
                                      fontWeight: '600',
                                      boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)',
                                      border: '1px solid rgba(255, 255, 255, 0.2)'
                                    }}>
                                      {vote.userId}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div style={{
                                textAlign: 'center',
                                color: '#94a3b8',
                                fontSize: '0.9rem',
                                fontStyle: 'italic',
                                padding: '1rem 0'
                              }}>
                                No votes yet
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>

                {selectedVote.status === 'completed' && selectedVote.winner && (
                  <div style={{
                    background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                    padding: '2rem',
                    borderRadius: '16px',
                    textAlign: 'center',
                    border: '2px solid #f59e0b',
                    boxShadow: '0 8px 25px rgba(245, 158, 11, 0.2)'
                  }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
                    <h3 style={{ color: '#92400e', fontSize: '1.8rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                      Winner: {selectedVote.winner.name}
                    </h3>
                    <p style={{ color: '#a16207', fontSize: '1.2rem', margin: 0 }}>
                      Average Rating: ⭐ {selectedVote.averageRating.toFixed(1)} / 10
                    </p>
                  </div>
                )}
              </div>
            ) : (
              // FALLBACK - Other statuses or no winner
              <div className="text-center p-8">
                <p className="text-slate-600 dark:text-slate-400">Vote details will be shown here when available.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default VoteComponent;