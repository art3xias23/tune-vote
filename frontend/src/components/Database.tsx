import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import { Band } from '../types';
import { bandAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';

const Database: React.FC = () => {
  const { showToast } = useToast();
  const [bands, setBands] = useState<Band[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterQuery, setFilterQuery] = useState('');

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

  // Delete band function
  const deleteBand = async (bandId: string) => {
    if (!window.confirm('Are you sure you want to delete this band?')) return;

    try {
      await bandAPI.delete(bandId);
      setBands(bands.filter(b => b._id !== bandId));
      showToast('Band deleted successfully', 'success');
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to delete band', 'error');
    }
  };

  const filteredBands = bands.filter(band =>
    band.name.toLowerCase().includes(filterQuery.toLowerCase())
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
        <h2 style={{ marginBottom: '2rem' }}>Band Database</h2>

        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          marginBottom: '2rem'
        }}>
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Filter bands in database..."
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '16px'
            }}
          />

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
              <p>{filterQuery ? `No bands matching "${filterQuery}"` : 'No bands in database yet. Go to Search to add some!'}</p>
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
                    textAlign: 'center',
                    position: 'relative'
                  }}
                >
                  {/* Delete Button */}
                  <button
                    onClick={() => deleteBand(band._id)}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      backgroundColor: '#ff4d4f',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      fontSize: '14px',
                      cursor: 'pointer',
                      lineHeight: 0,
                    }}
                    title="Delete Band"
                  >
                    ×
                  </button>

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
                    {band.addedBy && (
                      <span>Added by <strong>{band.addedBy}</strong> • </span>
                    )}
                    {new Date(band.createdAt).toLocaleDateString()}
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