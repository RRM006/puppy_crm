import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, AlertCircle } from 'lucide-react';
import orderService from '../../services/orderService';
import companyCustomerService from '../../services/companyCustomerService';
import './CreateOrderModal.css';

const CreateOrderModal = ({ onClose, onSuccess }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    customer_id: '',
    title: '',
    description: '',
    order_date: new Date().toISOString().split('T')[0],
    delivery_date: '',
    status: 'pending',
    notes: '',
    items: [{ description: '', quantity: 1, unit_price: 0, total: 0 }]
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const data = await companyCustomerService.getCustomers({ status: 'active' });
      setCustomers(data.results || data);
    } catch (err) {
      console.error('Failed to load customers:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = field === 'quantity' || field === 'unit_price' ? parseFloat(value) || 0 : value;
    
    // Calculate total for this item
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].total = newItems[index].quantity * newItems[index].unit_price;
    }
    
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, unit_price: 0, total: 0 }]
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length === 1) {
      alert('Order must have at least one item');
      return;
    }
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + item.total, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.customer_id) {
      setError('Please select a customer');
      return;
    }

    if (formData.items.length === 0 || formData.items.every(item => !item.description)) {
      setError('Please add at least one item with a description');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const orderData = {
        ...formData,
        total_amount: calculateTotal()
      };
      
      await orderService.createOrder(orderData);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create order');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content create-order-modal large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <Plus size={24} />
            Create New Order
          </h2>
          <button className="btn-icon" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div className="alert alert-error">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            {/* Order Information */}
            <div className="form-section">
              <h3 className="section-title">Order Information</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="customer_id">
                    Customer <span className="required">*</span>
                  </label>
                  <select
                    id="customer_id"
                    name="customer_id"
                    value={formData.customer_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select a customer</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>
                        {customer.customer_name} ({customer.customer_email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="status">Status</label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="title">
                  Order Title <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., Custom Widget Order"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Order description..."
                  rows={3}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="order_date">
                    Order Date <span className="required">*</span>
                  </label>
                  <input
                    type="date"
                    id="order_date"
                    name="order_date"
                    value={formData.order_date}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="delivery_date">Expected Delivery</label>
                  <input
                    type="date"
                    id="delivery_date"
                    name="delivery_date"
                    value={formData.delivery_date}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="form-section">
              <div className="section-header">
                <h3 className="section-title">Order Items</h3>
                <button type="button" className="btn-secondary" onClick={addItem}>
                  <Plus size={18} />
                  Add Item
                </button>
              </div>

              <div className="items-container">
                {formData.items.map((item, index) => (
                  <div key={index} className="order-item">
                    <div className="item-number">{index + 1}</div>
                    <div className="item-fields">
                      <div className="form-group">
                        <label>Description <span className="required">*</span></label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                          placeholder="Item description"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Quantity</label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          min="1"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Unit Price</label>
                        <input
                          type="number"
                          value={item.unit_price}
                          onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Total</label>
                        <input
                          type="text"
                          value={formatCurrency(item.total)}
                          disabled
                          className="total-display"
                        />
                      </div>
                    </div>
                    {formData.items.length > 1 && (
                      <button
                        type="button"
                        className="btn-icon delete-item"
                        onClick={() => removeItem(index)}
                        title="Remove item"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="order-total">
                <span>Order Total:</span>
                <span className="total-amount">{formatCurrency(calculateTotal())}</span>
              </div>
            </div>

            {/* Additional Notes */}
            <div className="form-section">
              <h3 className="section-title">Additional Notes</h3>
              <div className="form-group">
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Internal notes about this order..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateOrderModal;
