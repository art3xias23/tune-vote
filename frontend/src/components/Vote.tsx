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
  const [rating, setRating] = useState(5);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [votingBands, setVotingBands] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

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
      // Submit vote for each selected band
      // In a real implementation, you might want to batch these or update the API to accept multiple bands
      let updatedVote: Vote | null = null;
      for (const bandId of votingBands) {
        const response = await voteAPI.submitVote(voteId, bandId, user?.username);
        updatedVote = response.data;
      }

      if (updatedVote) {
        const updatedVotes = votes.map(v => v._id === voteId ? updatedVote! : v);
        setVotes(updatedVotes);
        setSelectedVote(updatedVote);
        setVotingBands([]);
        showToast(`Your votes (${votingBands.length} bands) have been submitted!`, 'success');
      }
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

  const getVoteCount = (vote: Vote, bandId: string) => {
    return vote.votes.filter(v => v.bandId === bandId).length;
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2>Voting System</h2>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            style={{
              backgroundColor: '#1db954',
              color: 'white',
              border: 'none',
              padding: '10px 24px',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            {showCreateForm ? 'Cancel' : '+ Create New Vote'}
          </button>
        </div>

        {/* CREATE VOTE FORM */}
        {showCreateForm && (
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '12px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            marginBottom: '2rem'
          }}>
            <h3>Create a New Vote</h3>
            <p style={{ color: '#666', marginBottom: '1.5rem' }}>
              Select 3 bands for everyone to vote on
            </p>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '2rem',
              padding: '1rem',
              backgroundColor: '#f5f5f5',
              borderRadius: '8px'
            }}>
              <span style={{ fontWeight: '600' }}>
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
              {bands.map(band => (
                <div
                  key={band._id}
                  onClick={() => handleBandSelect(band._id)}
                  style={{
                    padding: '0.5rem',
                    borderRadius: '8px',
                    border: selectedBands.includes(band._id) ? '2px solid #1db954' : '2px solid #e0e0e0',
                    cursor: 'pointer',
                    textAlign: 'center',
                    backgroundColor: selectedBands.includes(band._id) ? '#e8f5e9' : 'white',
                    transition: 'all 0.2s'
                  }}
                >
                  <img
                    src={band.image}
                    alt={band.name}
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '6px',
                      objectFit: 'cover',
                      marginBottom: '0.5rem'
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/default-band.png';
                    }}
                  />
                  <div style={{ fontWeight: selectedBands.includes(band._id) ? '600' : '400' }}>
                    {band.name}
                  </div>
                  {selectedBands.includes(band._id) && (
                    <div style={{ color: '#1db954', fontSize: '12px', marginTop: '4px' }}>
                      ✓ Selected
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VOTES LIST */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>All Votes</h3>

          {votes.length === 0 ? (
            <div style={{
              backgroundColor: '#f5f5f5',
              padding: '2rem',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <p>No votes yet. Create one to get started!</p>
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
                    style={{
                      backgroundColor: 'white',
                      padding: '1.5rem',
                      borderRadius: '12px',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                      border: selectedVote?._id === vote._id ? '2px solid #1db954' : '2px solid transparent',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onClick={() => setSelectedVote(vote)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div>
                        <h4 style={{ marginBottom: '0.5rem' }}>
                          Vote #{vote.voteNumber || votes.indexOf(vote) + 1}
                        </h4>
                        <p style={{ color: '#666', fontSize: '14px' }}>
                          Created by <strong>{vote.createdBy}</strong> •
                          {isCompleted && <span style={{ color: '#28a745' }}> Completed</span>}
                          {isRating && <span style={{ color: '#9333ea' }}> Rating Phase</span>}
                          {isActive && <span> {vote.votes.length} / 3 votes</span>}
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
                              <div style={{ fontSize: '12px', marginTop: '4px' }}>{band.name}</div>
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
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '12px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h3>Vote Details</h3>
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
                  <p style={{ margin: '0 0 1rem 0', opacity: 0.95, fontSize: '1.1rem' }}>
                    Select up to 3 bands you want to vote for
                  </p>
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '12px',
                    padding: '12px 20px',
                    display: 'inline-block',
                    fontSize: '1.2rem',
                    fontWeight: '600'
                  }}>
                    Selected: {votingBands.length} / 3
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
                          {isSelected ? 'Click again to deselect' : `Add to your ${votingBands.length}/3 votes`}
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
              // RATING PHASE
              <div style={{ textAlign: 'center' }}>
                <h4>Rate the Winner: {selectedVote.winner.name}</h4>
                <div style={{ marginTop: '2rem' }}>
                  <div style={{ fontSize: '3rem', fontWeight: 'bold', color: getRatingColor(rating) }}>
                    {rating}
                  </div>
                  <div style={{ color: '#666' }}>out of 10</div>
                </div>

                <input
                  type="range"
                  min="1"
                  max="10"
                  value={rating}
                  onChange={(e) => setRating(parseInt(e.target.value))}
                  style={{
                    width: '100%',
                    maxWidth: '400px',
                    margin: '2rem auto'
                  }}
                />

                <button
                  onClick={() => submitRating(selectedVote._id)}
                  disabled={submitting}
                  style={{
                    backgroundColor: '#9333ea',
                    color: 'white',
                    border: 'none',
                    padding: '12px 32px',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {submitting ? 'Submitting...' : 'Submit Rating'}
                </button>
              </div>
            ) : (
              // RESULTS VIEW
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
                    {selectedVote.votes.length} out of 3 members have voted
                  </p>
                </div>

                {/* Band Results with bigger images */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                  gap: '1.5rem',
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
                      const isWinner = index === 0 && band.voteCount > 0;

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
                          {/* Winner Badge */}
                          {isWinner && (
                            <div style={{
                              position: 'absolute',
                              top: '15px',
                              right: '15px',
                              background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                              color: 'white',
                              padding: '8px 16px',
                              borderRadius: '25px',
                              fontSize: '0.9rem',
                              fontWeight: '700',
                              zIndex: 2,
                              boxShadow: '0 4px 15px rgba(249, 115, 22, 0.3)'
                            }}>
                              🏆 Leading
                            </div>
                          )}

                          {/* Position Badge */}
                          <div style={{
                            position: 'absolute',
                            top: '15px',
                            left: '15px',
                            width: '45px',
                            height: '45px',
                            borderRadius: '50%',
                            background: `linear-gradient(135deg, ${
                              index === 0 ? '#f97316' :
                              index === 1 ? '#6b7280' : '#94a3b8'
                            } 0%, ${
                              index === 0 ? '#ea580c' :
                              index === 1 ? '#4b5563' : '#64748b'
                            } 100%)`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '1.3rem',
                            zIndex: 1,
                            boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
                          }}>
                            #{index + 1}
                          </div>

                          {/* Large Band Image */}
                          <div style={{
                            position: 'relative',
                            width: '100%',
                            paddingBottom: '75%', // 4:3 aspect ratio
                            overflow: 'hidden',
                            background: 'linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.6) 100%)'
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
                                  {band.voteCount} / {selectedVote.votes.length}
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
                                  background: `linear-gradient(90deg, ${
                                    percentage > 0 ? '#10b981' : '#e5e7eb'
                                  } 0%, ${
                                    percentage > 0 ? '#059669' : '#d1d5db'
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
                                      background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                                      color: 'white',
                                      padding: '4px 12px',
                                      borderRadius: '15px',
                                      fontSize: '0.85rem',
                                      fontWeight: '600',
                                      boxShadow: '0 2px 6px rgba(59, 130, 246, 0.3)'
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
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default VoteComponent;