import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { Group } from '../types';
import { authAPI } from '../services/api';

const SelectGroup: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useUser();

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const groupsParam = urlParams.get('groups');
    const userId = urlParams.get('userId');

    if (groupsParam && userId) {
      try {
        const parsedGroups = JSON.parse(decodeURIComponent(groupsParam));
        setGroups(parsedGroups);
      } catch (error) {
        console.error('Error parsing groups:', error);
        navigate('/login');
      }
    } else {
      navigate('/login');
    }
  }, [location, navigate]);

  const handleGroupSelection = async () => {
    if (!selectedGroup) return;

    setLoading(true);
    try {
      const urlParams = new URLSearchParams(location.search);
      const userId = urlParams.get('userId');

      if (!userId) {
        throw new Error('User ID not found');
      }

      const response = await authAPI.selectGroup(userId, selectedGroup);
      // Handle group selection logic here
      navigate('/dashboard');
    } catch (error) {
      console.error('Error selecting group:', error);
      alert('Error selecting group. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        minWidth: '400px'
      }}>
        <h2 style={{ marginBottom: '1rem', textAlign: 'center' }}>Select a Group</h2>
        <p style={{ marginBottom: '2rem', color: '#666', textAlign: 'center' }}>
          Choose which group you'd like to join. This cannot be changed later.
        </p>

        <div style={{ marginBottom: '2rem' }}>
          {groups.map((group) => (
            <div key={group._id} style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                padding: '12px',
                border: '2px solid #e0e0e0',
                borderRadius: '6px',
                backgroundColor: selectedGroup === group._id ? '#f0f8ff' : 'white',
                borderColor: selectedGroup === group._id ? '#1877f2' : '#e0e0e0'
              }}>
                <input
                  type="radio"
                  value={group._id}
                  checked={selectedGroup === group._id}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  style={{ marginRight: '12px' }}
                />
                <div>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                    {group.name}
                  </div>
                  {group.description && (
                    <div style={{ fontSize: '14px', color: '#666' }}>
                      {group.description}
                    </div>
                  )}
                </div>
              </label>
            </div>
          ))}
        </div>

        <button
          onClick={handleGroupSelection}
          disabled={!selectedGroup || loading}
          style={{
            width: '100%',
            backgroundColor: selectedGroup ? '#1877f2' : '#ccc',
            color: 'white',
            border: 'none',
            padding: '12px',
            borderRadius: '6px',
            fontSize: '16px',
            cursor: selectedGroup ? 'pointer' : 'not-allowed'
          }}
        >
          {loading ? 'Joining...' : 'Join Group'}
        </button>
      </div>
    </div>
  );
};

export default SelectGroup;