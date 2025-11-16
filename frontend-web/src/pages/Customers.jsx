import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Download, Upload, Tag, Grid3x3, 
  Search, Filter, ChevronDown, Eye, Edit, CheckCircle, 
  UserMinus, MoreVertical, TrendingUp, TrendingDown 
} from 'lucide-react';
import companyCustomerService from '../services/companyCustomerService';
import AddCustomerModal from '../components/customers/AddCustomerModal';
import CustomerDetailModal from '../components/customers/CustomerDetailModal';
import VerifyCustomerModal from '../components/customers/VerifyCustomerModal';
import TagManagementModal from '../components/customers/TagManagementModal';
import SegmentManagementModal from '../components/customers/SegmentManagementModal';
import './Customers.css';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState({});
  const [tags, setTags] = useState([]);
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [showSegmentModal, setShowSegmentModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  
  // Filters
  const [filters, setFilters] = useState({
    status: '',
    verified: undefined,
    tags: [],
    account_manager: '',
    since_from: '',
    since_to: '',
    search: '',
    sort_by: '-created_at',
    page: 1,
    page_size: 20
  });
  
  // Active tab
  const [activeTab, setActiveTab] = useState('all');
  
  // Pagination
  const [pagination, setPagination] = useState({
    count: 0,
    total_pages: 1,
    current_page: 1
  });

  useEffect(() => {
    loadCustomers();
    loadStats();
    loadTags();
    loadSegments();
  }, [filters]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await companyCustomerService.getCustomers(filters);
      setCustomers(data.results || []);
      setPagination({
        count: data.count,
        total_pages: data.total_pages,
        current_page: data.page
      });
    } catch (err) {
      setError('Failed to load customers');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await companyCustomerService.getCustomerStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const loadTags = async () => {
    try {
      const data = await companyCustomerService.getTags();
      setTags(data);
    } catch (err) {
      console.error('Failed to load tags:', err);
    }
  };

  const loadSegments = async () => {
    try {
      const data = await companyCustomerService.getSegments();
      setSegments(data);
    } catch (err) {
      console.error('Failed to load segments:', err);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    switch (tab) {
      case 'active':
        setFilters(prev => ({ ...prev, status: 'active', page: 1 }));
        break;
      case 'inactive':
        setFilters(prev => ({ ...prev, status: 'inactive', page: 1 }));
        break;
      case 'unverified':
        setFilters(prev => ({ ...prev, verified: false, page: 1 }));
        break;
      default:
        setFilters(prev => ({ ...prev, status: '', verified: undefined, page: 1 }));
    }
  };

  const handleSearch = (e) => {
    setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }));
  };

  const handleSort = (field) => {
    const currentSort = filters.sort_by;
    const newSort = currentSort === field ? `-${field}` : field;
    setFilters(prev => ({ ...prev, sort_by: newSort }));
  };

  const handleVerify = (customer) => {
    setSelectedCustomer(customer);
    setShowVerifyModal(true);
  };

  const handleView = (customer) => {
    setSelectedCustomer(customer);
    setShowDetailModal(true);
  };

  const handleUnlink = async (customerId) => {
    if (!window.confirm('Are you sure you want to unlink this customer?')) return;
    
    try {
      await companyCustomerService.unlinkCustomer(customerId);
      loadCustomers();
      loadStats();
    } catch (err) {
      alert('Failed to unlink customer');
      console.error(err);
    }
  };

  const exportCustomers = () => {
    // TODO: Implement CSV export
    alert('Export functionality coming soon');
  };

  const importCustomers = () => {
    // TODO: Implement CSV import
    alert('Import functionality coming soon');
  };

  const getStatusBadge = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      blocked: 'bg-red-100 text-red-800'
    };
    return colors[status] || colors.inactive;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="customers-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <Users className="page-icon" />
          <h1>Customers</h1>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={importCustomers}>
            <Upload size={18} />
            Import
          </button>
          <button className="btn-secondary" onClick={exportCustomers}>
            <Download size={18} />
            Export
          </button>
          <button className="btn-secondary" onClick={() => setShowTagModal(true)}>
            <Tag size={18} />
            Manage Tags
          </button>
          <button className="btn-secondary" onClick={() => setShowSegmentModal(true)}>
            <Grid3x3 size={18} />
            Segments
          </button>
          <button className="btn-primary" onClick={() => setShowAddModal(true)}>
            <UserPlus size={18} />
            Add Customer
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Total Customers</span>
            <Users className="stat-icon" />
          </div>
          <div className="stat-value">{stats.total_customers || 0}</div>
          <div className="stat-change positive">
            <TrendingUp size={16} />
            <span>+{stats.new_this_month || 0} this month</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Active Customers</span>
            <CheckCircle className="stat-icon" />
          </div>
          <div className="stat-value">{stats.active_customers || 0}</div>
          <div className="stat-change">
            <span>{stats.active_percentage || 0}% of total</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Total Lifetime Value</span>
            <TrendingUp className="stat-icon" />
          </div>
          <div className="stat-value">{formatCurrency(stats.total_lifetime_value || 0)}</div>
          <div className="stat-change positive">
            <span>Avg: {formatCurrency(stats.average_lifetime_value || 0)}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">New This Month</span>
            <UserPlus className="stat-icon" />
          </div>
          <div className="stat-value">{stats.new_this_month || 0}</div>
          <div className="stat-change">
            <span>{stats.unverified_count || 0} unverified</span>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="filters-section">
        <div className="search-box">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search customers by name, email, or phone..."
            value={filters.search}
            onChange={handleSearch}
          />
        </div>

        <div className="filter-buttons">
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
            className="filter-select"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="blocked">Blocked</option>
          </select>

          <select
            value={filters.verified !== undefined ? filters.verified.toString() : ''}
            onChange={(e) => setFilters(prev => ({ 
              ...prev, 
              verified: e.target.value === '' ? undefined : e.target.value === 'true',
              page: 1 
            }))}
            className="filter-select"
          >
            <option value="">All Verification</option>
            <option value="true">Verified</option>
            <option value="false">Unverified</option>
          </select>

          {tags.length > 0 && (
            <select
              multiple
              value={filters.tags}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, option => option.value);
                setFilters(prev => ({ ...prev, tags: selected, page: 1 }));
              }}
              className="filter-select"
            >
              {tags.map(tag => (
                <option key={tag.id} value={tag.id}>{tag.name}</option>
              ))}
            </select>
          )}

          <button className="btn-icon" title="More filters">
            <Filter size={18} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => handleTabChange('all')}
        >
          All Customers
        </button>
        <button
          className={`tab ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => handleTabChange('active')}
        >
          Active
        </button>
        <button
          className={`tab ${activeTab === 'inactive' ? 'active' : ''}`}
          onClick={() => handleTabChange('inactive')}
        >
          Inactive
        </button>
        <button
          className={`tab ${activeTab === 'unverified' ? 'active' : ''}`}
          onClick={() => handleTabChange('unverified')}
        >
          Unverified ({stats.unverified_count || 0})
        </button>
      </div>

      {/* Customers Table */}
      {loading ? (
        <div className="loading-state">Loading customers...</div>
      ) : error ? (
        <div className="error-state">{error}</div>
      ) : customers.length === 0 ? (
        <div className="empty-state">
          <Users size={48} />
          <h3>No customers found</h3>
          <p>Get started by adding your first customer</p>
          <button className="btn-primary" onClick={() => setShowAddModal(true)}>
            <UserPlus size={18} />
            Add Customer
          </button>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="customers-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('name')}>
                    Name
                    <ChevronDown size={16} className="sort-icon" />
                  </th>
                  <th onClick={() => handleSort('email')}>
                    Email
                    <ChevronDown size={16} className="sort-icon" />
                  </th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Tags</th>
                  <th onClick={() => handleSort('lifetime_value')}>
                    Lifetime Value
                    <ChevronDown size={16} className="sort-icon" />
                  </th>
                  <th onClick={() => handleSort('total_orders')}>
                    Total Orders
                    <ChevronDown size={16} className="sort-icon" />
                  </th>
                  <th onClick={() => handleSort('last_order_date')}>
                    Last Order
                    <ChevronDown size={16} className="sort-icon" />
                  </th>
                  <th>Account Manager</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(customer => (
                  <tr key={customer.id}>
                    <td>
                      <div className="customer-name">
                        {customer.customer_name}
                        {!customer.verified && (
                          <span className="unverified-badge" title="Unverified">!</span>
                        )}
                      </div>
                    </td>
                    <td>{customer.customer_email}</td>
                    <td>{customer.customer_phone || 'N/A'}</td>
                    <td>
                      <span className={`status-badge ${getStatusBadge(customer.customer_status)}`}>
                        {customer.customer_status}
                      </span>
                    </td>
                    <td>
                      <div className="tags-cell">
                        {customer.tags && customer.tags.slice(0, 2).map(tag => (
                          <span 
                            key={tag.id} 
                            className="tag-badge"
                            style={{ backgroundColor: tag.color + '20', color: tag.color }}
                          >
                            {tag.name}
                          </span>
                        ))}
                        {customer.tags && customer.tags.length > 2 && (
                          <span className="tag-more">+{customer.tags.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="numeric">{formatCurrency(customer.lifetime_value || 0)}</td>
                    <td className="numeric">{customer.total_orders || 0}</td>
                    <td>{formatDate(customer.last_order_date)}</td>
                    <td>
                      {customer.account_manager ? (
                        <span className="manager-name">
                          {customer.account_manager.first_name} {customer.account_manager.last_name}
                        </span>
                      ) : (
                        <span className="text-muted">Not assigned</span>
                      )}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-icon"
                          onClick={() => handleView(customer)}
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        {!customer.verified && (
                          <button
                            className="btn-icon"
                            onClick={() => handleVerify(customer)}
                            title="Verify Customer"
                          >
                            <CheckCircle size={16} />
                          </button>
                        )}
                        <button
                          className="btn-icon"
                          onClick={() => handleUnlink(customer.id)}
                          title="Unlink Customer"
                        >
                          <UserMinus size={16} />
                        </button>
                        <button className="btn-icon" title="More actions">
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.total_pages > 1 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                disabled={pagination.current_page === 1}
                onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
              >
                Previous
              </button>
              <span className="pagination-info">
                Page {pagination.current_page} of {pagination.total_pages}
              </span>
              <button
                className="pagination-btn"
                disabled={pagination.current_page === pagination.total_pages}
                onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {showAddModal && (
        <AddCustomerModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadCustomers();
            loadStats();
          }}
          tags={tags}
        />
      )}

      {showDetailModal && selectedCustomer && (
        <CustomerDetailModal
          customer={selectedCustomer}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedCustomer(null);
          }}
          onUpdate={() => {
            loadCustomers();
            loadStats();
          }}
          tags={tags}
        />
      )}

      {showVerifyModal && selectedCustomer && (
        <VerifyCustomerModal
          customer={selectedCustomer}
          onClose={() => {
            setShowVerifyModal(false);
            setSelectedCustomer(null);
          }}
          onVerify={() => {
            setShowVerifyModal(false);
            setSelectedCustomer(null);
            loadCustomers();
            loadStats();
          }}
        />
      )}

      {showTagModal && (
        <TagManagementModal
          tags={tags}
          onClose={() => setShowTagModal(false)}
          onUpdate={() => {
            loadTags();
            loadCustomers();
          }}
        />
      )}

      {showSegmentModal && (
        <SegmentManagementModal
          segments={segments}
          onClose={() => setShowSegmentModal(false)}
          onUpdate={() => {
            loadSegments();
          }}
        />
      )}
    </div>
  );
};

export default Customers;
