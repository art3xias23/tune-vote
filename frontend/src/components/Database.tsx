import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import { Band } from '../types';
import { bandAPI } from '../services/api';

const Database: React.FC = () => {
  const [bands, setBands] = useState<Band[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    loadBands();
  }, []);

  const loadBands = async () => {
    try {
      const response = await bandAPI.getAll();
      setBands(response.data);
    } catch (error) {
      console.error('Error loading bands:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchBands = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await bandAPI.searchExternal(searchQuery);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Error searching bands:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const addBand = async (bandData: any) => {
    try {
      const response = await bandAPI.add({
        name: bandData.name,
        image: bandData.image,
        spotifyId: bandData.spotifyId
      });

      setBands([response.data, ...bands]);
      setSearchResults(searchResults.filter(r => r.name !== bandData.name));
      alert('Band added successfully!');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error adding band');
    }
  };

  const filteredBands = bands.filter(band =>
    band.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <Layout>
        <div>Loading bands...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem'
        }}>
          <h2>Band Database</h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            style={{
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            {showAddForm ? 'Cancel' : 'Add Band'}
          </button>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          marginBottom: '2rem'
        }}>
          <div style={{
            display: 'flex',
            gap: '1rem',
            alignItems: 'flex-end',
            marginBottom: '1rem'
          }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                Search Bands
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter band name..."
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '16px'
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    if (showAddForm) {
                      searchBands();
                    }
                  }
                }}
              />
            </div>
            {showAddForm && (
              <button
                onClick={searchBands}
                disabled={searching || !searchQuery.trim()}
                style={{
                  backgroundColor: '#1877f2',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '4px',
                  cursor: searching ? 'not-allowed' : 'pointer'
                }}
              >
                {searching ? 'Searching...' : 'Search Online'}
              </button>
            )}
          </div>

          {showAddForm && searchResults.length > 0 && (
            <div>
              <h4>Search Results from Last.fm:</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1rem' }}>
                {searchResults.map((result, index) => (
                  <div
                    key={index}
                    style={{
                      border: '1px solid #e0e0e0',
                      borderRadius: '12px',
                      padding: '1.5rem',
                      backgroundColor: '#fafafa'
                    }}
                  >
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                      <img
                        src={result.image}
                        alt={result.name}
                        style={{
                          width: '100px',
                          height: '100px',
                          borderRadius: '8px',
                          objectFit: 'cover',
                          flexShrink: 0
                        }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/default-band.png';
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <h5 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', color: '#333' }}>
                          {result.name}
                        </h5>
                        {result.bio && (
                          <p style={{ fontSize: '13px', color: '#666', margin: '0 0 0.5rem 0', lineHeight: '1.4' }}>
                            {result.bio}
                          </p>
                        )}
                        <div style={{ display: 'flex', gap: '1rem', fontSize: '12px', color: '#888' }}>
                          {result.listeners && (
                            <span>🎧 {result.listeners.toLocaleString()} listeners</span>
                          )}
                          {result.playcount && (
                            <span>▶️ {result.playcount.toLocaleString()} plays</span>
                          )}
                        </div>
                        {result.tags && result.tags.length > 0 && (
                          <div style={{ marginTop: '0.5rem' }}>
                            {result.tags.map((tag: string, tagIndex: number) => (
                              <span
                                key={tagIndex}
                                style={{
                                  display: 'inline-block',
                                  fontSize: '10px',
                                  backgroundColor: '#e1f5fe',
                                  color: '#0277bd',
                                  padding: '2px 6px',
                                  borderRadius: '10px',
                                  marginRight: '4px'
                                }}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {result.topAlbums && result.topAlbums.length > 0 && (
                      <div style={{ marginBottom: '1rem' }}>
                        <h6 style={{ margin: '0 0 0.5rem 0', fontSize: '14px', color: '#555' }}>
                          Top Albums:
                        </h6>
                        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                          {result.topAlbums.map((album: any, albumIndex: number) => (
                            <div
                              key={albumIndex}
                              style={{
                                minWidth: '80px',
                                textAlign: 'center',
                                fontSize: '11px'
                              }}
                            >
                              {album.image && (
                                <img
                                  src={album.image}
                                  alt={album.name}
                                  style={{
                                    width: '60px',
                                    height: '60px',
                                    borderRadius: '4px',
                                    objectFit: 'cover',
                                    marginBottom: '4px'
                                  }}
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              )}
                              <div style={{ color: '#555', fontWeight: '500' }}>
                                {album.name.length > 12 ? album.name.substring(0, 12) + '...' : album.name}
                              </div>
                              <div style={{ color: '#888', fontSize: '10px' }}>
                                {album.playcount.toLocaleString()} plays
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <button
                        onClick={() => addBand(result)}
                        style={{
                          backgroundColor: '#1db954',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '500',
                          flex: 1
                        }}
                      >
                        Import Band
                      </button>
                      <span style={{ fontSize: '11px', color: '#999' }}>
                        from {result.source}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <h3>Bands in Database ({filteredBands.length})</h3>
          {filteredBands.length === 0 ? (
            <div style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '8px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              textAlign: 'center'
            }}>
              <p>No bands found. {searchQuery ? 'Try a different search term or ' : ''}Add the first band!</p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '1rem'
            }}>
              {filteredBands.map((band) => (
                <div
                  key={band._id}
                  style={{
                    backgroundColor: 'white',
                    padding: '1rem',
                    borderRadius: '8px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                    textAlign: 'center'
                  }}
                >
                  <img
                    src={band.image}
                    alt={band.name}
                    style={{
                      width: '100px',
                      height: '100px',
                      borderRadius: '8px',
                      objectFit: 'cover',
                      marginBottom: '0.5rem'
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/default-band.png';
                    }}
                  />
                  <h4 style={{ margin: '0.5rem 0' }}>{band.name}</h4>
                  <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>
                    Added: {new Date(band.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Database;