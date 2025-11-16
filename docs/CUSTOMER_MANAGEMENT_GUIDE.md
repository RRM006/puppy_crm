# 👥 Customer Management Guide

## 📋 Table of Contents
- [Overview](#overview)
- [Getting Started](#getting-started)
- [Adding Customers](#adding-customers)
- [Verifying Customers](#verifying-customers)
- [Managing Orders](#managing-orders)
- [Tags & Segments](#tags--segments)
- [Interaction Tracking](#interaction-tracking)
- [Customer Portal](#customer-portal)
- [Analytics & Reporting](#analytics--reporting)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## Overview

The Customer Management system in Puppy CRM provides comprehensive tools for B2B companies to manage their customer relationships, track orders, and analyze customer behavior. This guide covers all aspects of customer management from initial setup to advanced features.

### Key Features
- **Customer Lifecycle Management**: Add, verify, and manage customers
- **Order Management**: Track orders from creation to delivery
- **Tagging System**: Organize customers with custom tags
- **Segmentation**: Create dynamic customer segments
- **Interaction Tracking**: Log all customer communications
- **Customer Portal**: Self-service portal for B2C customers
- **Analytics**: Comprehensive customer and order insights
- **Cross-Platform**: Available on web and mobile apps

### User Roles & Permissions

**CEO / Manager**:
- Full access to all customers and orders
- Can verify customers
- Can manage tags and segments
- Can view all analytics

**Sales Manager**:
- Access to team members' customers
- Can create and edit customers
- Can manage orders
- Can log interactions

**Support Staff**:
- Access to own customers only
- Can view customer details
- Can log interactions
- Limited order management

---

## Getting Started

### Prerequisites
1. Company account created
2. User assigned appropriate role (CEO, Manager, Sales Manager, or Support Staff)
3. Access to web dashboard or mobile app

### Initial Setup

**Web Dashboard**:
1. Log in to your account
2. Navigate to "Customers" from the sidebar
3. You'll see the customer management dashboard

**Mobile App**:
1. Open the Puppy CRM app
2. Tap on "Customers" tab
3. Access customer list and features

### Understanding the Dashboard

The customer dashboard displays:
- **Stats Cards**: Total customers, active customers, verified customers, lifetime value
- **Customer List**: Searchable table with filters
- **Quick Actions**: Add customer, view analytics, export data
- **Filter Options**: Status, verification, tags, date range

---

## Adding Customers

### Method 1: Manual Entry (Web)

1. Click **"Add Customer"** button
2. Fill in the customer information:
   - **Email** (required): Customer's email address
   - **First Name** (required): Customer's first name
   - **Last Name** (required): Customer's last name
   - **Phone** (optional): Contact phone number
   - **Customer Type**: Individual or Business
   - **Tags** (optional): Select existing tags
   - **Notes** (optional): Internal notes

3. For **Business Customers**, additional fields:
   - Company Size (e.g., 1-10, 11-50, 51-200, 201-500, 500+)
   - Industry (e.g., Technology, Healthcare, Finance, Retail)
   - Annual Revenue

4. Click **"Create Customer"**
5. Customer is added with "Unverified" status

### Method 2: Mobile App

1. Tap the **floating action button (+)** on CustomersScreen
2. Fill in customer details in the form
3. Select tags from the tag picker
4. Tap **"Save"**
5. Customer appears in your list

### Method 3: Customer Self-Registration

Customers can create their own accounts:
1. Customer visits the signup page
2. Selects "Customer" account type
3. Fills in personal information
4. Creates account
5. Appears in your system as "Unverified"

### Validation Rules

- **Email**: Must be unique within your company
- **Phone**: Optional, but recommended for better contact
- **Customer Type**: Defaults to "Individual" if not specified
- **Tags**: Can be added during creation or later

### Example API Request

```bash
curl -X POST http://localhost:8000/api/customers/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice.johnson@example.com",
    "first_name": "Alice",
    "last_name": "Johnson",
    "phone": "+1234567890",
    "customer_type": "individual",
    "tags": [1, 2],
    "notes": "Referred by existing customer"
  }'
```

---

## Verifying Customers

Customer verification is an important step that:
- Confirms the customer's identity
- Sets the "customer_since" date
- Unlocks full customer privileges
- Improves trust and relationship

### Verification Process

**Web Dashboard**:
1. Open customer detail view
2. Click **"Verify Customer"** button
3. Review customer information
4. Confirm verification
5. Customer status changes to "Verified"
6. "Customer Since" date is automatically set

**Mobile App**:
1. Tap customer card to open details
2. Tap **"Verify"** button (shield icon)
3. Confirm in the alert dialog
4. Customer is marked as verified

### When to Verify

✅ **Verify when**:
- Customer has made their first purchase
- Customer information has been validated
- Customer has completed onboarding process
- Payment method has been confirmed
- Business credentials have been checked

❌ **Don't verify if**:
- Customer is still in trial period
- Information seems incomplete or suspicious
- Customer hasn't responded to outreach
- Payment issues exist

### Verification Benefits

For **Company**:
- Better data quality
- Reduced fraud risk
- Improved analytics accuracy
- Trustworthy customer base

For **Customer**:
- Access to full features
- Priority support
- Special offers eligibility
- Faster order processing

### Auto-Verification

You can enable auto-verification for:
- Customers who complete their first order
- Customers referred by verified customers
- Customers who pass email verification
- Customers from trusted domains

---

## Managing Orders

### Creating Orders

**Web Dashboard**:
1. Navigate to **"Orders"** page
2. Click **"Create Order"**
3. **Step 1: Select Customer**
   - Search for existing customer
   - Or create new customer inline
4. **Step 2: Add Items**
   - Add product name and SKU
   - Set quantity and unit price
   - Apply discounts and tax
   - Repeat for multiple items
5. **Step 3: Order Details**
   - Enter shipping address
   - Enter billing address
   - Select payment method
   - Set expected delivery date
   - Add order notes
6. Click **"Create Order"**
7. Order number is auto-generated

**Mobile App**:
1. Tap FAB on OrdersScreen
2. Select customer from picker
3. Add order items one by one
4. Fill in delivery details
5. Tap **"Create Order"**

### Order Lifecycle

```
Pending → Processing → Shipped → Delivered
           ↓
        Cancelled
           ↓
        Refunded
```

**Status Descriptions**:
- **Pending**: Order placed, awaiting processing
- **Processing**: Order being prepared/packed
- **Shipped**: Order in transit to customer
- **Delivered**: Order successfully delivered
- **Cancelled**: Order cancelled by customer or company
- **Refunded**: Payment refunded to customer

### Updating Order Status

**Web Dashboard**:
1. Open order detail modal
2. Click **"Update Status"**
3. Select new status from dropdown
4. Add a note (optional but recommended)
5. Click **"Update"**
6. Status history is logged

**Mobile App**:
1. Open OrderDetailScreen
2. Tap **"Update Status"** button
3. Select new status
4. Add optional note
5. Confirm update

### Order Items

Each order can have multiple items with:
- **Product Name**: Name of the product/service
- **Product SKU**: Stock keeping unit (optional)
- **Quantity**: Number of units
- **Unit Price**: Price per unit
- **Discount**: Discount amount (optional)
- **Tax**: Tax amount (calculated or manual)
- **Total**: Automatically calculated

**Calculation Formula**:
```
Item Total = (Unit Price × Quantity) - Discount + Tax
Order Total = Sum of all Item Totals
```

### Tracking Numbers

Add tracking information:
1. Edit order
2. Enter tracking number in "Tracking Number" field
3. Optionally add carrier information in notes
4. Customer can track order in portal

### Delivery Management

**Expected Delivery**:
- Set when creating order
- Helps manage customer expectations
- Used for timeline calculations

**Actual Delivery**:
- Set when order is delivered
- Triggers delivery notifications
- Updates customer history

### Payment Status

Track payment separately from order status:
- **Pending**: Payment not received
- **Paid**: Payment confirmed
- **Failed**: Payment attempt failed
- **Refunded**: Payment refunded

---

## Tags & Segments

### Customer Tags

Tags are simple labels for organizing customers.

**Creating Tags**:
1. Open **Tag Management** modal
2. Click **"Add Tag"**
3. Enter tag name (e.g., "VIP", "Enterprise", "Priority")
4. Choose color (for visual identification)
5. Save tag

**Assigning Tags**:
- During customer creation
- From customer detail view
- Bulk assign via API
- Auto-assign based on criteria

**Tag Examples**:
- **VIP**: High-value customers
- **New**: Recently added customers
- **At Risk**: Customers with declining orders
- **Loyal**: Long-term customers
- **Premium**: Premium tier customers
- **Trial**: Trial period customers

**Tag Colors**:
```
Red (#ff6b6b) - Urgent/Important
Blue (#4c6fff) - Standard/Info
Green (#51cf66) - Positive/Active
Yellow (#ffd43b) - Warning/Attention
Purple (#b197fc) - Special/Premium
Gray (#868e96) - Inactive/Archived
```

### Customer Segments

Segments are dynamic groups based on criteria.

**Creating Segments**:
1. Open **Segment Management** modal
2. Click **"Create Segment"**
3. Enter segment name and description
4. Define criteria (JSON format):
   ```json
   {
     "lifetime_value_min": 5000,
     "verified": true,
     "status": "active",
     "total_orders_min": 10
   }
   ```
5. Save segment
6. Customers matching criteria are automatically included

**Segment Criteria Options**:
- **lifetime_value_min/max**: Filter by customer value
- **total_orders_min/max**: Filter by order count
- **customer_since_days**: Recent customers (e.g., last 30 days)
- **verified**: Verification status
- **status**: active, inactive, blocked
- **customer_type**: individual, business
- **tags**: Array of tag IDs

**Segment Examples**:

**High Value Customers**:
```json
{
  "lifetime_value_min": 10000,
  "verified": true,
  "status": "active"
}
```

**At Risk Customers**:
```json
{
  "last_order_days_ago_min": 90,
  "status": "active",
  "total_orders_min": 1
}
```

**New Customers**:
```json
{
  "customer_since_days": 30,
  "verified": false
}
```

**Enterprise Customers**:
```json
{
  "customer_type": "business",
  "company_size": ["201-500", "500+"],
  "verified": true
}
```

### Using Tags vs Segments

**Use Tags when**:
- You want manual control
- Categories are subjective
- Need visual identification
- Simple organization

**Use Segments when**:
- Need dynamic updates
- Based on measurable criteria
- For marketing campaigns
- Automated workflows

---

## Interaction Tracking

Track all communications and touchpoints with customers.

### Interaction Types

1. **Call**: Phone conversations
   - Log call duration
   - Note key discussion points
   - Set follow-up reminders

2. **Email**: Email communications
   - Subject and body
   - Attachments reference
   - Response tracking

3. **Meeting**: In-person or virtual meetings
   - Meeting agenda
   - Attendees
   - Action items

4. **Support**: Support tickets or help requests
   - Issue description
   - Resolution steps
   - Satisfaction rating

5. **Purchase**: Purchase-related interactions
   - Order discussion
   - Upsell opportunities
   - Product feedback

6. **Inquiry**: General inquiries
   - Question details
   - Response provided
   - Lead qualification

### Logging Interactions

**Web Dashboard**:
1. Open customer detail view
2. Navigate to **"Interactions"** tab
3. Click **"Add Interaction"**
4. Select interaction type
5. Enter subject and description
6. Choose sentiment (positive, neutral, negative)
7. Save interaction

**Mobile App**:
1. Open CustomerDetailScreen
2. Tap **"Add Interaction"** FAB
3. Fill in interaction form
4. Select type and sentiment
5. Save

### Sentiment Tracking

Track the tone of interactions:
- **Positive** 😊: Good experience, happy customer
- **Neutral** 😐: Standard interaction, no issues
- **Negative** 😞: Problem, complaint, dissatisfaction

### Best Practices for Interaction Logging

✅ **Do**:
- Log interactions promptly (same day)
- Be specific and detailed
- Include actionable information
- Track sentiment accurately
- Set follow-up tasks

❌ **Don't**:
- Use vague descriptions
- Skip important details
- Forget to log interactions
- Miss sentiment indicators
- Leave unresolved issues

### Interaction Timeline

View complete interaction history:
- Chronological order
- Filter by type
- Filter by sentiment
- Filter by date range
- Export for reporting

### Auto-Generated Interactions

System automatically logs:
- Order placements (purchase type)
- Support ticket creation (support type)
- Email campaign responses (email type)
- Portal activity (inquiry type)

---

## Customer Portal

Self-service portal for B2C customers.

### Portal Features

**For Customers**:
1. View order history
2. Track order status and delivery
3. Download invoices
4. Link to company accounts
5. Request verification
6. Update profile information
7. Contact support

### Order Tracking

**Web Portal**:
1. Customer logs in
2. Navigates to **"My Orders"**
3. Sees list of all orders
4. Clicks order to view details
5. Sees visual tracking timeline

**Mobile App**:
1. Open MyOrdersScreen
2. View orders grouped by company
3. Tap order to see details
4. Tap **"Track"** for active orders
5. See progress timeline with status

### Company Linking

Customers can link to multiple companies:

**Linking Process**:
1. Customer searches for company
2. Sends link request
3. Company receives notification
4. Company approves/rejects request
5. Customer gets access to company portal

**Verification Request**:
- Customer can request verification
- Company reviews request
- Approves or declines
- Customer notified of decision

### Portal Benefits

**For Customers**:
- 24/7 self-service access
- Real-time order tracking
- Reduced support calls
- Better transparency
- Account control

**For Companies**:
- Reduced support workload
- Improved customer satisfaction
- Better data accuracy
- Enhanced relationship
- Lower costs

---

## Analytics & Reporting

### Customer Analytics

Access from **Customers > Analytics**:

**Key Metrics**:
- **Total Customers**: All customers in system
- **Active Customers**: Customers with recent activity
- **Verified Customers**: Verified customer count
- **Total Lifetime Value**: Sum of all customer values
- **Average Lifetime Value**: Average per customer

**Breakdown Views**:
- Customers by status (active, inactive, blocked)
- Customers by type (individual, business)
- Customers by verification status
- Top customers by value
- Recent verifications

**Growth Trends**:
- New customers this month
- Growth rate vs last month
- Customer acquisition trend
- Churn rate (if applicable)

### Order Analytics

Access from **Orders > Analytics**:

**Key Metrics**:
- **Total Orders**: All orders placed
- **Total Revenue**: Sum of all order amounts
- **Average Order Value**: Revenue ÷ Orders
- **Orders by Status**: Breakdown by status
- **Payment Status**: Payment tracking

**Revenue Analysis**:
- Revenue this month
- Revenue last month
- Growth rate percentage
- Revenue trend chart
- Seasonal patterns

**Top Performers**:
- Top customers by orders
- Top customers by spend
- Most popular products
- Best-performing regions

### Exporting Data

**Web Dashboard**:
1. Navigate to Customers or Orders
2. Apply filters as needed
3. Click **"Export"** button
4. Choose format (CSV or PDF)
5. Download file

**Export Options**:
- **CSV**: For spreadsheet analysis
- **PDF**: For reports and sharing
- **Filtered Data**: Only matching records
- **All Data**: Complete dataset

---

## Best Practices

### Customer Data Management

1. **Keep Information Updated**
   - Regularly verify customer details
   - Update contact information
   - Remove duplicate entries
   - Archive inactive customers

2. **Use Tags Effectively**
   - Create consistent naming convention
   - Limit number of tags (5-10 core tags)
   - Use colors meaningfully
   - Review and clean up unused tags

3. **Segment Strategically**
   - Create segments for key groups
   - Use data-driven criteria
   - Review segment performance
   - Adjust criteria as needed

### Order Management

1. **Timely Updates**
   - Update order status promptly
   - Add tracking numbers quickly
   - Communicate delays proactively
   - Confirm deliveries

2. **Accurate Information**
   - Double-check addresses
   - Verify order items
   - Calculate totals correctly
   - Document special instructions

3. **Customer Communication**
   - Send order confirmations
   - Provide tracking updates
   - Notify of status changes
   - Follow up post-delivery

### Interaction Logging

1. **Consistency**
   - Log all interactions
   - Use standard format
   - Be thorough but concise
   - Tag sentiment accurately

2. **Timeliness**
   - Log same day or immediately
   - Include relevant context
   - Note action items
   - Set follow-up reminders

3. **Quality**
   - Write clear descriptions
   - Include key details
   - Avoid jargon
   - Be professional

### Data Security

1. **Access Control**
   - Use role-based permissions
   - Review user access regularly
   - Remove departed user access
   - Monitor sensitive actions

2. **Data Privacy**
   - Follow GDPR/privacy laws
   - Collect only needed data
   - Secure customer information
   - Allow data export/deletion

3. **Compliance**
   - Document processes
   - Train team on policies
   - Audit regularly
   - Update procedures as needed

---

## Troubleshooting

### Common Issues

**Issue**: Customer email already exists
**Solution**: Check if customer was previously added. Search by email. If found, update existing record rather than creating duplicate.

**Issue**: Cannot verify customer
**Solution**: Ensure you have "CanManageCustomers" permission. CEO, Manager roles have this by default. Contact admin if needed.

**Issue**: Order total calculation incorrect
**Solution**: Check item quantities, unit prices, discounts, and taxes. Total = (unit_price × quantity) - discount + tax for each item, then summed.

**Issue**: Customer not seeing orders in portal
**Solution**: Verify customer account is linked to company. Check verification status. Ensure orders are associated with correct customer ID.

**Issue**: Tags not appearing on customer
**Solution**: Save customer after adding tags. Check if tags are active. Refresh page or app.

**Issue**: Segment showing wrong count
**Solution**: Review segment criteria JSON. Ensure criteria match intended logic. Segments update automatically, may have delay.

**Issue**: Interaction not logging
**Solution**: Check required fields (type, subject, description). Ensure stable internet connection. Try again or contact support.

**Issue**: Export not downloading
**Solution**: Check browser popup settings. Try different format. Reduce filter scope. Clear browser cache.

### Getting Help

1. **Documentation**: Review this guide and API documentation
2. **Support Team**: Contact support@puppycrm.com
3. **Training**: Request team training session
4. **Community**: Join user community forum
5. **Feedback**: Submit feature requests via portal

### API Error Codes

- **400 Bad Request**: Invalid data submitted
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Customer/order not found
- **409 Conflict**: Duplicate entry (e.g., email exists)
- **500 Server Error**: Contact support

---

## Appendix

### Keyboard Shortcuts (Web)

- `Ctrl/Cmd + K`: Quick search
- `Ctrl/Cmd + N`: New customer/order
- `Ctrl/Cmd + F`: Filter panel
- `Ctrl/Cmd + E`: Export data
- `Escape`: Close modal
- `Enter`: Submit form

### Mobile Gestures

- **Swipe Left** (customer card): Quick actions
- **Swipe Right** (customer card): Archive
- **Long Press** (customer card): Bulk select
- **Pull Down**: Refresh list
- **Scroll to Bottom**: Load more

### Glossary

- **B2B**: Business-to-Business
- **B2C**: Business-to-Consumer
- **CRM**: Customer Relationship Management
- **Lifetime Value (LTV)**: Total revenue from a customer
- **Churn**: Customer cancellation/leaving
- **Segment**: Dynamic group of customers
- **Tag**: Static label for customers
- **Interaction**: Communication touchpoint
- **Verification**: Confirming customer identity
- **SKU**: Stock Keeping Unit

### Resources

- **API Documentation**: `/docs/API_BLUEPRINT.md`
- **Database Schema**: `/docs/DATABASE_SCHEMA.md`
- **Development Progress**: `/docs/DEVELOPMENT_PROGRESS.md`
- **Project Overview**: `/docs/PROJECT_OVERVIEW.md`

---

**Version**: 1.0  
**Last Updated**: November 16, 2025  
**Phase**: 5 - Customer Management & Order Management COMPLETED

For questions or feedback, contact: support@puppycrm.com
