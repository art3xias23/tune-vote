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
        <h2 className="text-slate-900 dark:text-slate-100 text-2xl font-bold mb-8">Search & Add Bands</h2>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg dark:shadow-gray-900/20 mb-8 border border-gray-200 dark:border-gray-700">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Start typing to search for bands on Spotify..."
            className="w-full p-3 border-2 border-green-500 dark:border-green-400 rounded-lg text-lg bg-white dark:bg-gray-700 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500"
            autoFocus
          />
          {searching && (
            <p className="mt-2 text-slate-600 dark:text-slate-400 text-sm">
              Searching...
            </p>
          )}
          {!searching && searchQuery.length > 0 && searchQuery.length < 2 && (
            <p className="mt-2 text-slate-500 dark:text-slate-500 text-sm">
              Type at least 2 characters to search
            </p>
          )}
        </div>

        {searchResults.length > 0 && (
          <div>
            <h3 className="text-slate-900 dark:text-slate-100 text-xl font-semibold mb-4">Search Results ({searchResults.length})</h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
              gap: '1rem',
              marginTop: '1rem'
            }}>
              {searchResults.map((result, index) => (
                <div
                  key={index}
                  className={`border rounded-xl p-6 transition-all shadow-md ${
                    result.inDatabase
                      ? 'bg-gray-100 dark:bg-gray-700 opacity-70 border-gray-300 dark:border-gray-600'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600'
                  }`}
                >
                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                    <img
                      src={result.image || '/default-band.png'}
                      alt={result.name}
                      style={{
                        width: '120px',
                        height: '120px',
                        borderRadius: '8px',
                        objectFit: 'cover',
                        flexShrink: 0,
                        backgroundColor: '#f3f4f6',
                        transition: 'opacity 0.3s ease'
                      }}
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        // Use a simple data URL as fallback to avoid 404 errors
                        const fallbackSrc = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iMTIwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik00MCA2MEg4MEw2MCA0MEg0MFY2MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTQwIDgwSDYwVjYwSDQwVjgwWiIgZmlsbD0iIzlDQTNBRiIvPgo8cGF0aCBkPSJNNjAgODBIODBWNjBINjBWODBaIiBmaWxsPSIjOUNBM0FGIi8+Cjx0ZXh0IHg9IjYwIiB5PSIxMDAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzlDQTNBRiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+4pmrPC90ZXh0Pgo8L3N2Zz4K';
                        if (img.src !== fallbackSrc) {
                          img.src = fallbackSrc;
                        }
                      }}
                      onLoad={(e) => {
                        (e.target as HTMLImageElement).style.opacity = '1';
                      }}
                      loading="lazy"
                    />
                    <div style={{ flex: 1 }}>
                      <h4 className="m-0 mb-2 text-xl text-slate-900 dark:text-slate-100 font-semibold">
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
                        <div className="flex gap-6 text-sm text-slate-600 dark:text-slate-400 mb-2">
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
                      <h5 className="m-0 mb-2 text-xs text-slate-600 dark:text-slate-400 font-medium">
                        Popular Tracks:
                      </h5>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
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
          <div className="bg-white dark:bg-gray-800 p-12 rounded-xl shadow-lg dark:shadow-gray-900/20 text-center border border-gray-200 dark:border-gray-700">
            <p className="text-lg text-slate-600 dark:text-slate-400">
              No results found for "{searchQuery}"
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">
              Try searching with a different spelling or band name
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SearchBands;