import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import { bandAPI } from '../services/api';
import { useUser } from '../contexts/UserContext';
import { useToast } from '../contexts/ToastContext';

const SearchBands: React.FC = () => {
  const { user } = useUser();
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingBand, setAddingBand] = useState<string | null>(null);

  // Auto-search when query changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        searchBands();
      } else {
        setSearchResults([]);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const searchBands = async () => {
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
    setAddingBand(bandData.name);
    try {
      await bandAPI.add({
        name: bandData.name,
        image: bandData.image,
        spotifyId: bandData.spotifyId,
        spotifyUri: bandData.spotifyUri,
        genres: bandData.genres,
        username: user?.username
      });

      // Update the result to show it's been added
      setSearchResults(searchResults.map(r =>
        r.name === bandData.name ? { ...r, inDatabase: true } : r
      ));
      showToast(`${bandData.name} added successfully!`, 'success');
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Something went wrong', 'error');
    } finally {
      setAddingBand(null);
    }
  };

  return (
    <Layout>
      <div>
        <h2 style={{ marginBottom: '2rem' }}>Search & Add Bands</h2>

        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          marginBottom: '2rem'
        }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Start typing to search for bands on Spotify..."
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid #1db954',
              borderRadius: '6px',
              fontSize: '18px',
              outline: 'none'
            }}
            autoFocus
          />
          {searching && (
            <p style={{ marginTop: '10px', color: '#666', fontSize: '14px' }}>
              Searching...
            </p>
          )}
          {!searching && searchQuery.length > 0 && searchQuery.length < 2 && (
            <p style={{ marginTop: '10px', color: '#999', fontSize: '14px' }}>
              Type at least 2 characters to search
            </p>
          )}
        </div>

        {searchResults.length > 0 && (
          <div>
            <h3>Search Results ({searchResults.length})</h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
              gap: '1rem',
              marginTop: '1rem'
            }}>
              {searchResults.map((result, index) => (
                <div
                  key={index}
                  style={{
                    border: '1px solid #e0e0e0',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    backgroundColor: result.inDatabase ? '#f0f0f0' : 'white',
                    opacity: result.inDatabase ? 0.7 : 1,
                    transition: 'all 0.3s ease',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                  }}
                >
                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                    <img
                      src={result.image}
                      alt={result.name}
                      style={{
                        width: '120px',
                        height: '120px',
                        borderRadius: '8px',
                        objectFit: 'cover',
                        flexShrink: 0
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/default-band.png';
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.3rem', color: '#333' }}>
                        {result.name}
                        {result.inDatabase && (
                          <span style={{
                            fontSize: '11px',
                            backgroundColor: '#28a745',
                            color: 'white',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            marginLeft: '10px',
                            verticalAlign: 'middle'
                          }}>
                            ✓ In Database
                          </span>
                        )}
                      </h4>

                      {result.followers !== undefined && (
                        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '14px', color: '#666', marginBottom: '0.5rem' }}>
                          <span>👥 {result.followers.toLocaleString()} followers</span>
                          {result.popularity !== undefined && (
                            <span>🔥 {result.popularity}% popularity</span>
                          )}
                        </div>
                      )}

                      {result.genres && result.genres.length > 0 && (
                        <div style={{ marginTop: '0.5rem' }}>
                          {result.genres.map((genre: string, genreIndex: number) => (
                            <span
                              key={genreIndex}
                              style={{
                                display: 'inline-block',
                                fontSize: '11px',
                                backgroundColor: '#e8f5e9',
                                color: '#2e7d32',
                                padding: '3px 8px',
                                borderRadius: '12px',
                                marginRight: '6px',
                                marginBottom: '4px'
                              }}
                            >
                              {genre}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {result.topTracks && result.topTracks.length > 0 && (
                    <div style={{
                      marginTop: '1rem',
                      paddingTop: '1rem',
                      borderTop: '1px solid #f0f0f0'
                    }}>
                      <h5 style={{ margin: '0 0 0.5rem 0', fontSize: '13px', color: '#666' }}>
                        Popular Tracks:
                      </h5>
                      <div style={{ fontSize: '12px', color: '#888' }}>
                        {result.topTracks.map((track: any, trackIndex: number) => (
                          <div key={trackIndex} style={{ marginBottom: '4px' }}>
                            🎵 <strong>{track.name}</strong> - {track.album}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    alignItems: 'center',
                    marginTop: '1rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid #f0f0f0'
                  }}>
                    <button
                      onClick={() => addBand(result)}
                      disabled={result.inDatabase || addingBand === result.name}
                      style={{
                        backgroundColor: result.inDatabase ? '#ccc' : '#1db954',
                        color: 'white',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '6px',
                        cursor: result.inDatabase ? 'not-allowed' : 'pointer',
                        fontSize: '15px',
                        fontWeight: '600',
                        flex: 1,
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {addingBand === result.name ? 'Adding...' :
                       result.inDatabase ? 'Already Added' : 'Add to Database'}
                    </button>
                    {result.externalUrls?.spotify && (
                      <a
                        href={result.externalUrls.spotify}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: '#1db954',
                          fontSize: '14px',
                          textDecoration: 'none',
                          fontWeight: '500',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        Spotify →
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!searching && searchQuery.length >= 2 && searchResults.length === 0 && (
          <div style={{
            backgroundColor: 'white',
            padding: '3rem',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <p style={{ fontSize: '18px', color: '#666' }}>
              No results found for "{searchQuery}"
            </p>
            <p style={{ fontSize: '14px', color: '#999', marginTop: '10px' }}>
              Try searching with a different spelling or band name
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SearchBands;