import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import { Group, User } from '../types';
import { groupAPI } from '../services/api';

const Groups: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', description: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const response = await groupAPI.getAll();
      setGroups(response.data);
    } catch (error) {
      console.error('Error loading groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const createGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroup.name.trim()) return;

    setCreating(true);
    try {
      const response = await groupAPI.create(newGroup);
      setGroups([...groups, response.data]);
      setNewGroup({ name: '', description: '' });
      setShowCreateForm(false);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error creating group');
    } finally {
      setCreating(false);
    }
  };

  const deleteGroup = async (id: string) => {
    if (!confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
      return;
    }

    try {
      await groupAPI.delete(id);
      setGroups(groups.filter(g => g._id !== id));
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error deleting group');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div>Loading groups...</div>
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
          <h2>Groups Management</h2>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            style={{
              backgroundColor: '#1877f2',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            {showCreateForm ? 'Cancel' : 'Create Group'}
          </button>
        </div>

        {showCreateForm && (
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            marginBottom: '2rem'
          }}>
            <h3>Create New Group</h3>
            <form onSubmit={createGroup}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                  Group Name *
                </label>
                <input
                  type="text"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '16px'
                  }}
                  required
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                  Description
                </label>
                <textarea
                  value={newGroup.description}
                  onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '16px',
                    minHeight: '80px'
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={creating || !newGroup.name.trim()}
                style={{
                  backgroundColor: newGroup.name.trim() ? '#28a745' : '#ccc',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '4px',
                  cursor: newGroup.name.trim() ? 'pointer' : 'not-allowed'
                }}
              >
                {creating ? 'Creating...' : 'Create Group'}
              </button>
            </form>
          </div>
        )}

        {groups.length === 0 ? (
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <p>No groups created yet. Create the first group!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {groups.map((group) => (
              <div
                key={group._id}
                style={{
                  backgroundColor: 'white',
                  padding: '1.5rem',
                  borderRadius: '8px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '1rem'
                }}>
                  <div>
                    <h3 style={{ margin: '0 0 0.5rem 0' }}>{group.name}</h3>
                    {group.description && (
                      <p style={{ margin: '0 0 0.5rem 0', color: '#666' }}>
                        {group.description}
                      </p>
                    )}
                    <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                      {group.members.length} member{group.members.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteGroup(group._id)}
                    style={{
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Delete
                  </button>
                </div>

                {group.members.length > 0 && (
                  <div>
                    <h4 style={{ marginBottom: '0.5rem' }}>Members:</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {group.members.map((member: any) => (
                        <span
                          key={member._id}
                          style={{
                            backgroundColor: '#e9ecef',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '14px'
                          }}
                        >
                          {member.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Groups;