import React, { useState, useEffect } from 'react';
import { FiPlus, FiDownload, FiUpload, FiFilter, FiSearch, FiEye, FiTrash2, FiRefreshCw, FiGrid, FiList } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { getDeals, getDealsByStage, deleteDeal } from '../services/dealService';
import { getPipelines } from '../services/pipelineService';
import { getCompanyTeam } from '../services/companyService';
import DealBoard from '../components/deals/DealBoard';
import CreateDealModal from '../components/deals/CreateDealModal';
import DealDetailModal from '../components/deals/DealDetailModal';
import Toast from '../components/common/Toast';

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' }
];

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' }
];

const Deals = () => {
  const { company } = useAuth();
  const [deals, setDeals] = useState([]);
  const [dealsByStage, setDealsByStage] = useState({});
  const [pipelines, setPipelines] = useState([]);
  const [selectedPipeline, setSelectedPipeline] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' or 'table'
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [toasts, setToasts] = useState([]);
  
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    assigned_to: '',
    priority: '',
    start_date: '',
    end_date: '',
    min_value: '',
    max_value: '',
    sort: 'created_at',
    direction: 'desc'
  });

  const pushToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(t => [...t, { id, message, type, timeout: 3000 }]);
  };
  const removeToast = (id) => setToasts(t => t.filter(x => x.id !== id));

  useEffect(() => {
    loadPipelines();
    loadTeam();
  }, []);

  useEffect(() => {
    if (selectedPipeline) {
      if (viewMode === 'kanban') {
        loadDealsByStage();
      } else {
        loadDeals();
      }
    }
  }, [selectedPipeline, viewMode, filters]);

  const loadPipelines = async () => {
    try {
      const data = await getPipelines(company?.id);
      const pipelineList = Array.isArray(data) ? data : [];
      setPipelines(pipelineList);
      if (pipelineList.length > 0) {
        const defaultPipeline = pipelineList.find(p => p.is_default) || pipelineList[0];
        setSelectedPipeline(defaultPipeline);
      }
    } catch (err) {
      console.error('Failed to load pipelines:', err);
    }
  };

  const loadTeam = async () => {
    try {
      const data = await getCompanyTeam();
      const list = Array.isArray(data?.team_members)
        ? data.team_members
        : Array.isArray(data)
        ? data
        : [];
      setTeamMembers(list);
    } catch (err) {
      console.error('Failed to load team:', err);
      setTeamMembers([]);
    }
  };

  const loadDeals = async () => {
    setLoading(true);
    try {
      const data = await getDeals({
        ...filters,
        pipeline: selectedPipeline?.id,
        company_id: company?.id
      });
      setDeals(Array.isArray(data) ? data : []);
    } catch (err) {
      pushToast('Failed to load deals', 'error');
      setDeals([]);
    } finally {
      setLoading(false);
    }
  };

  const loadDealsByStage = async () => {
    setLoading(true);
    try {
      const data = await getDealsByStage(selectedPipeline?.id);
      // Transform API response to { stageId: [deals] } format
      const transformed = {};
      if (data && typeof data === 'object') {
        Object.keys(data).forEach(stageId => {
          const stageData = data[stageId];
          // Handle both { stage: {...}, deals: [...] } and direct array formats
          if (stageData && typeof stageData === 'object') {
            if (Array.isArray(stageData.deals)) {
              transformed[stageId] = stageData.deals;
            } else if (Array.isArray(stageData)) {
              transformed[stageId] = stageData;
            } else {
              transformed[stageId] = [];
            }
          } else if (Array.isArray(stageData)) {
            transformed[stageId] = stageData;
          } else {
            transformed[stageId] = [];
          }
        });
      }
      setDealsByStage(transformed);
    } catch (err) {
      pushToast('Failed to load deals', 'error');
      setDealsByStage({});
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    if (viewMode === 'kanban') {
      loadDealsByStage();
    } else {
      loadDeals();
    }
  };

  const handleDelete = async (deal) => {
    if (!window.confirm(`Delete deal "${deal.title}"?`)) return;
    try {
      await deleteDeal(deal.id);
      pushToast('Deal deleted successfully', 'success');
      if (viewMode === 'kanban') {
        loadDealsByStage();
      } else {
        loadDeals();
      }
    } catch (err) {
      pushToast('Failed to delete deal', 'error');
    }
  };

  const handleViewDetail = (deal) => {
    setSelectedDeal(deal);
    setShowDetail(true);
  };

  const handleDealClick = (deal) => {
    handleViewDetail(deal);
  };

  const formatCurrency = (value, currency = 'USD') => {
    if (!value) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getPriorityColor = (priority) => {
    const option = PRIORITY_OPTIONS.find(p => p.value === priority);
    return option?.color || '#64748b';
  };

  const stages = selectedPipeline?.stages || [];

  return (
    <div style={{ color: '#0f172a' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 24,
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flex: 1, minWidth: 280 }}>
          <select
            value={selectedPipeline?.id || ''}
            onChange={(e) => {
              const pipeline = pipelines.find(p => p.id === parseInt(e.target.value));
              setSelectedPipeline(pipeline);
            }}
            style={{
              padding: '10px 16px',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              color: '#0f172a',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              outline: 'none',
              minWidth: 200,
              flex: '1 1 auto'
            }}
          >
            {pipelines.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} {p.is_default ? '(Default)' : ''}
              </option>
            ))}
          </select>

          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button
              onClick={() => setViewMode('kanban')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 16px',
                borderRadius: 8,
                border: viewMode === 'kanban' ? '2px solid #4c6fff' : '1px solid #e2e8f0',
                background: viewMode === 'kanban' ? '#eff6ff' : '#ffffff',
                color: viewMode === 'kanban' ? '#4c6fff' : '#475569',
                cursor: 'pointer',
                fontWeight: viewMode === 'kanban' ? 600 : 500,
                fontSize: 14,
                transition: 'all 0.2s ease'
              }}
            >
              <FiGrid size={16} /> Kanban
            </button>
            <button
              onClick={() => setViewMode('table')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 16px',
                borderRadius: 8,
                border: viewMode === 'table' ? '2px solid #4c6fff' : '1px solid #e2e8f0',
                background: viewMode === 'table' ? '#eff6ff' : '#ffffff',
                color: viewMode === 'table' ? '#4c6fff' : '#475569',
                cursor: 'pointer',
                fontWeight: viewMode === 'table' ? 600 : 500,
                fontSize: 14,
                transition: 'all 0.2s ease'
              }}
            >
              <FiList size={16} /> Table
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            onClick={() => {
              if (viewMode === 'kanban') {
                loadDealsByStage();
              } else {
                loadDeals();
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 16px',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              color: '#475569',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: 14,
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f8fafc';
              e.currentTarget.style.borderColor = '#cbd5e1';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#ffffff';
              e.currentTarget.style.borderColor = '#e2e8f0';
            }}
          >
            <FiRefreshCw size={16} /> Refresh
          </button>
          <button
            onClick={() => setShowCreate(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 20px',
              borderRadius: 8,
              border: 'none',
              background: '#4c6fff',
              color: '#ffffff',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 14,
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 4px rgba(76, 111, 255, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#3b5bdb';
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(76, 111, 255, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#4c6fff';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(76, 111, 255, 0.3)';
            }}
          >
            <FiPlus size={18} /> New Deal
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: '#ffffff', borderRadius: 12, padding: 20, marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showFilters ? 16 : 0 }}>
          <button
            onClick={() => setShowFilters(s => !s)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 16px',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              color: '#475569',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: 14,
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f8fafc';
              e.currentTarget.style.borderColor = '#cbd5e1';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#ffffff';
              e.currentTarget.style.borderColor = '#e2e8f0';
            }}
          >
            <FiFilter size={16} /> {showFilters ? 'Hide' : 'Show'} Filters
          </button>
          
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flex: 1, maxWidth: 450, marginLeft: 20, background: '#f8fafc', padding: '10px 16px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <FiSearch style={{ color: '#64748b', flexShrink: 0 }} size={18} />
            <input
              type="text"
              placeholder="Search deals..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && applyFilters()}
              style={{
                flex: 1,
                padding: 0,
                border: 'none',
                background: 'transparent',
                fontSize: 14,
                color: '#0f172a',
                outline: 'none'
              }}
            />
          </div>
        </div>

        {showFilters && (
          <>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: 16, 
              marginTop: 16 
            }}>
              <label>
                <div style={{ fontSize: 13, color: '#475569', marginBottom: 6, fontWeight: 500 }}>Status</div>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '10px 12px', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: 8, 
                    fontSize: 14,
                    color: '#0f172a',
                    background: '#ffffff',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  <option value="">All Statuses</option>
                  {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </label>
              <label>
                <div style={{ fontSize: 13, color: '#475569', marginBottom: 6, fontWeight: 500 }}>Priority</div>
                <select
                  value={filters.priority}
                  onChange={(e) => handleFilterChange('priority', e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '10px 12px', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: 8, 
                    fontSize: 14,
                    color: '#0f172a',
                    background: '#ffffff',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  <option value="">All Priorities</option>
                  {PRIORITY_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </label>
              <label>
                <div style={{ fontSize: 13, color: '#475569', marginBottom: 6, fontWeight: 500 }}>Assigned To</div>
                <select
                  value={filters.assigned_to}
                  onChange={(e) => handleFilterChange('assigned_to', e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '10px 12px', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: 8, 
                    fontSize: 14,
                    color: '#0f172a',
                    background: '#ffffff',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  <option value="">All Team Members</option>
                  {teamMembers.map(m => (
                    <option key={m.user_id} value={m.user_id}>
                      {m.first_name} {m.last_name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <div style={{ fontSize: 13, color: '#475569', marginBottom: 6, fontWeight: 500 }}>Sort By</div>
                <select
                  value={filters.sort}
                  onChange={(e) => handleFilterChange('sort', e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '10px 12px', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: 8, 
                    fontSize: 14,
                    color: '#0f172a',
                    background: '#ffffff',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  <option value="created_at">Created Date</option>
                  <option value="value">Value</option>
                  <option value="expected_close_date">Close Date</option>
                </select>
              </label>
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: 16, 
              marginTop: 16 
            }}>
              <label>
                <div style={{ fontSize: 13, color: '#475569', marginBottom: 6, fontWeight: 500 }}>Start Date</div>
                <input
                  type="date"
                  value={filters.start_date}
                  onChange={(e) => handleFilterChange('start_date', e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '10px 12px', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: 8, 
                    fontSize: 14,
                    color: '#0f172a',
                    background: '#ffffff',
                    outline: 'none'
                  }}
                />
              </label>
              <label>
                <div style={{ fontSize: 13, color: '#475569', marginBottom: 6, fontWeight: 500 }}>End Date</div>
                <input
                  type="date"
                  value={filters.end_date}
                  onChange={(e) => handleFilterChange('end_date', e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '10px 12px', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: 8, 
                    fontSize: 14,
                    color: '#0f172a',
                    background: '#ffffff',
                    outline: 'none'
                  }}
                />
              </label>
              <label>
                <div style={{ fontSize: 13, color: '#475569', marginBottom: 6, fontWeight: 500 }}>Min Value</div>
                <input
                  type="number"
                  placeholder="0"
                  value={filters.min_value}
                  onChange={(e) => handleFilterChange('min_value', e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '10px 12px', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: 8, 
                    fontSize: 14,
                    color: '#0f172a',
                    background: '#ffffff',
                    outline: 'none'
                  }}
                />
              </label>
              <label>
                <div style={{ fontSize: 13, color: '#475569', marginBottom: 6, fontWeight: 500 }}>Max Value</div>
                <input
                  type="number"
                  placeholder="∞"
                  value={filters.max_value}
                  onChange={(e) => handleFilterChange('max_value', e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '10px 12px', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: 8, 
                    fontSize: 14,
                    color: '#0f172a',
                    background: '#ffffff',
                    outline: 'none'
                  }}
                />
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}>
              <button
                onClick={() => {
                  setFilters({ search: '', status: '', assigned_to: '', priority: '', start_date: '', end_date: '', min_value: '', max_value: '', sort: 'created_at', direction: 'desc' });
                  setTimeout(() => {
                    if (viewMode === 'kanban') {
                      loadDealsByStage();
                    } else {
                      loadDeals();
                    }
                  }, 50);
                }}
                style={{
                  padding: '10px 20px',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  color: '#475569',
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: 14,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f8fafc';
                  e.currentTarget.style.borderColor = '#cbd5e1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#ffffff';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }}
              >
                Clear
              </button>
              <button
                onClick={applyFilters}
                style={{
                  padding: '10px 20px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#4c6fff',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 14,
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(76, 111, 255, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#3b5bdb';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(76, 111, 255, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#4c6fff';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(76, 111, 255, 0.3)';
                }}
              >
                Apply Filters
              </button>
            </div>
          </>
        )}
      </div>

      {/* Content */}
      {loading && !selectedPipeline ? (
        <div style={{ padding: 80, textAlign: 'center', color: '#64748b' }}>
          <div style={{ fontSize: 16, fontWeight: 500 }}>Loading...</div>
        </div>
      ) : !selectedPipeline ? (
        <div style={{ padding: 80, textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 20, opacity: 0.6 }}>📊</div>
          <h3 style={{ margin: '0 0 12px 0', color: '#0f172a', fontSize: 20, fontWeight: 600 }}>No pipelines available</h3>
          <div style={{ color: '#64748b', marginBottom: 24, fontSize: 14 }}>
            Please create a pipeline first to manage deals
          </div>
        </div>
      ) : viewMode === 'kanban' ? (
        <DealBoard
          stages={stages}
          dealsByStage={dealsByStage}
          onDealClick={handleDealClick}
          onMoveSuccess={() => {
            pushToast('Deal moved successfully', 'success');
            loadDealsByStage();
          }}
          onError={(msg) => pushToast(msg, 'error')}
        />
      ) : (
        <div style={{ background: '#ffffff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)' }}>
          {deals.length === 0 ? (
            <div style={{ padding: 80, textAlign: 'center' }}>
              <div style={{ fontSize: 64, marginBottom: 20, opacity: 0.6 }}>📊</div>
              <h3 style={{ margin: '0 0 12px 0', color: '#0f172a', fontSize: 20, fontWeight: 600 }}>No deals yet</h3>
              <div style={{ color: '#64748b', marginBottom: 24, fontSize: 14 }}>
                Get started by creating your first deal
              </div>
              <button
                onClick={() => setShowCreate(true)}
                style={{
                  padding: '12px 24px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#4c6fff',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 14,
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(76, 111, 255, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#3b5bdb';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(76, 111, 255, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#4c6fff';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(76, 111, 255, 0.3)';
                }}
              >
                Create Deal
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', background: '#f8fafc' }}>
                    <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Title</th>
                    <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Company</th>
                    <th style={{ padding: '16px 20px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Value</th>
                    <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Stage</th>
                    <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Assigned To</th>
                    <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Expected Close</th>
                    <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Priority</th>
                    <th style={{ padding: '16px 20px', textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {deals.map((deal, idx) => (
                    <tr 
                      key={deal.id} 
                      style={{ 
                        borderBottom: '1px solid #f1f5f9',
                        background: idx % 2 === 0 ? '#ffffff' : '#fafbfc',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#f8fafc';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = idx % 2 === 0 ? '#ffffff' : '#fafbfc';
                      }}
                    >
                      <td style={{ padding: '16px 20px', fontSize: 14, color: '#0f172a', fontWeight: 500 }}>
                        {deal.title}
                      </td>
                      <td style={{ padding: '16px 20px', fontSize: 14, color: '#64748b' }}>
                        {deal.company_name || '-'}
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'right', fontSize: 14, fontWeight: 600, color: '#10b981' }}>
                        {formatCurrency(deal.value, deal.currency)}
                      </td>
                      <td style={{ padding: '16px 20px', fontSize: 13, color: '#475569' }}>
                        {deal.stage?.name || '-'} ({deal.probability || 0}%)
                      </td>
                      <td style={{ padding: '16px 20px', fontSize: 13, color: '#64748b' }}>
                        {deal.assigned_to ? `${deal.assigned_to.first_name} ${deal.assigned_to.last_name}` : <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Unassigned</span>}
                      </td>
                      <td style={{ padding: '16px 20px', fontSize: 13, color: '#64748b' }}>
                        {formatDate(deal.expected_close_date) || '-'}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{
                          padding: '6px 12px',
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 600,
                          background: `${getPriorityColor(deal.priority)}20`,
                          color: getPriorityColor(deal.priority),
                          display: 'inline-block'
                        }}>
                          {PRIORITY_OPTIONS.find(p => p.value === deal.priority)?.label || deal.priority}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                          <button
                            onClick={() => handleViewDetail(deal)}
                            title="View Details"
                            style={{
                              padding: 8,
                              border: 'none',
                              background: 'transparent',
                              cursor: 'pointer',
                              color: '#4c6fff',
                              borderRadius: 6,
                              transition: 'all 0.2s ease',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#eff6ff';
                              e.currentTarget.style.color = '#3b5bdb';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.color = '#4c6fff';
                            }}
                          >
                            <FiEye size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(deal)}
                            title="Delete"
                            style={{
                              padding: 8,
                              border: 'none',
                              background: 'transparent',
                              cursor: 'pointer',
                              color: '#ef4444',
                              borderRadius: 6,
                              transition: 'all 0.2s ease',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#fef2f2';
                              e.currentTarget.style.color = '#dc2626';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.color = '#ef4444';
                            }}
                          >
                            <FiTrash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <CreateDealModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSuccess={(msg) => { 
          pushToast(msg, 'success'); 
          if (viewMode === 'kanban') {
            loadDealsByStage();
          } else {
            loadDeals();
          }
        }}
        onError={(msg) => pushToast(msg, 'error')}
        teamMembers={teamMembers}
      />

      <DealDetailModal
        open={showDetail}
        onClose={() => { setShowDetail(false); setSelectedDeal(null); }}
        dealId={selectedDeal?.id}
        onSuccess={(msg) => { 
          pushToast(msg, 'success'); 
          if (viewMode === 'kanban') {
            loadDealsByStage();
          } else {
            loadDeals();
          }
        }}
        onError={(msg) => pushToast(msg, 'error')}
        teamMembers={teamMembers}
        pipelines={pipelines}
      />

      <Toast toasts={toasts} remove={removeToast} />
    </div>
  );
};

export default Deals;

