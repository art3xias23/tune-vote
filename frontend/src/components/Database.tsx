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
        <h2 className="text-slate-900 dark:text-slate-100 text-2xl font-bold mb-8">Band Database</h2>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg dark:shadow-gray-900/20 mb-8 border border-gray-200 dark:border-gray-700">
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Filter bands in database..."
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-base bg-white dark:bg-gray-700 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

        </div>

        <div>
          <h3 className="text-slate-900 dark:text-slate-100 text-xl font-semibold mb-4">Bands in Database ({filteredBands.length})</h3>
          {filteredBands.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg dark:shadow-gray-900/20 text-center border border-gray-200 dark:border-gray-700">
              <p className="text-slate-600 dark:text-slate-400">{filterQuery ? `No bands matching "${filterQuery}"` : 'No bands in database yet. Go to Search to add some!'}</p>
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
                  className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg dark:shadow-gray-900/20 text-center relative border border-gray-200 dark:border-gray-700"
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
                  <h4 className="my-2 text-slate-900 dark:text-slate-100 font-semibold">{band.name}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 m-0">
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