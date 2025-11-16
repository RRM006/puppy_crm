import React, { useEffect, useState } from 'react';
import { getCompanyTeam } from '../../services/companyService.js';
import Skeleton from '../common/Skeleton.jsx';

const Row = ({ member }) => (
  <tr>
    <td>{member.full_name || `${member.first_name||''} ${member.last_name||''}`}</td>
    <td>{member.email}</td>
    <td style={{ textTransform: 'capitalize' }}>{member.role?.replace('_',' ')}</td>
    <td style={{ textTransform: 'capitalize' }}>{member.department || '-'}</td>
    <td>{member.is_active ? 'Active' : 'Inactive'}</td>
  </tr>
);

const TeamView = ({ onInviteClick, refreshKey }) => {
  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await getCompanyTeam();
        setTeam(data.team_members || []);
      } catch (e) {
        console.error('Failed to load team', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [refreshKey]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Team</h2>
        <button onClick={onInviteClick} className="btn-primary">Invite</button>
      </div>
      {loading ? (
        <div style={{ display: 'grid', gap: 8 }}>
          <Skeleton height={36} />
          <Skeleton height={36} />
          <Skeleton height={36} />
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                <th style={{ padding: 12 }}>Name</th>
                <th style={{ padding: 12 }}>Email</th>
                <th style={{ padding: 12 }}>Role</th>
                <th style={{ padding: 12 }}>Department</th>
                <th style={{ padding: 12 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {team.map(m => (
                <Row key={m.id} member={m} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TeamView;
