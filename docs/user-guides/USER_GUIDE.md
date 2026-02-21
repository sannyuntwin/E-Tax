# E-Tax Invoice System - User Guide

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [Company Management](#company-management)
4. [Customer Management](#customer-management)
5. [Invoice Management](#invoice-management)
6. [Product Management](#product-management)
7. [Reports and Analytics](#reports-and-analytics)
8. [Settings and Configuration](#settings-and-configuration)
9. [Troubleshooting](#troubleshooting)

## Getting Started

### First Login

1. Navigate to `https://yourdomain.com`
2. Enter your email and password
3. Click "Sign In"

### Dashboard Tour

Upon login, you'll see the main dashboard with:

- **Quick Stats**: Total invoices, unpaid amount, recent activity
- **Recent Invoices**: Your latest 5 invoices
- **Quick Actions**: Create new invoice, add customer, view reports
- **Navigation Menu**: Access all system features

## Dashboard Overview

### Key Metrics

- **Total Revenue**: Sum of all paid invoices
- **Unpaid Amount**: Total outstanding payments
- **This Month**: Revenue generated in current month
- **Invoice Count**: Total number of invoices created

### Quick Actions

- **Create Invoice**: Start a new invoice immediately
- **Add Customer**: Quickly add a new customer
- **View Reports**: Access detailed analytics

## Company Management

### Setting Up Your Company

1. Go to **Settings** → **Company Profile**
2. Fill in your company information:
   - Company Name (required)
   - Tax ID (required)
   - Address
   - Phone Number
   - Email Address
3. Click **Save Changes**

### Digital Certificate Setup

1. Go to **Settings** → **Digital Certificates**
2. Upload your digital certificate file
3. Enter certificate password
4. Click **Verify Certificate**

## Customer Management

### Adding a New Customer

1. Navigate to **Customers** → **Add Customer**
2. Fill in customer details:
   - **Name** (required)
   - **Tax ID**
   - **Email** (required for invoicing)
   - **Phone Number**
   - **Billing Address**
3. Click **Save Customer**

### Managing Existing Customers

1. Go to **Customers**
2. Click on any customer to:
   - **View Details**: See all customer information
   - **Edit**: Update customer details
   - **View Invoices**: See all invoices for this customer
   - **Delete**: Remove customer (with confirmation)

### Customer Search

Use the search bar to find customers by:
- Name
- Email
- Tax ID
- Phone Number

## Invoice Management

### Creating a New Invoice

#### Method 1: Quick Create

1. Click **Create Invoice** from dashboard
2. Select customer from dropdown
3. Add invoice items:
   - **Product/Service Name**
   - **Description**
   - **Quantity**
   - **Unit Price**
4. Review totals (VAT calculated automatically)
5. Click **Create Invoice**

#### Method 2: Detailed Create

1. Go to **Invoices** → **Create New Invoice**
2. Fill in invoice details:
   - **Invoice Number** (auto-generated)
   - **Issue Date** (defaults to today)
   - **Due Date** (defaults to 30 days)
   - **Customer** (select from list)
3. Add items using the **Add Item** button
4. Set payment terms and notes
5. Click **Save as Draft** or **Send Invoice**

### Invoice Status Management

Invoices can have the following statuses:

- **Draft**: Not yet sent to customer
- **Sent**: Delivered to customer
- **Paid**: Payment received
- **Partial**: Partial payment received
- **Overdue**: Payment due date passed
- **Cancelled**: Invoice voided

### Managing Invoices

#### Viewing Invoices

1. Go to **Invoices**
2. Click on any invoice to see:
   - Full invoice details
   - Payment status
   - Customer information
   - Line items
   - Payment history

#### Invoice Actions

For each invoice, you can:

- **Edit**: Modify draft invoices
- **Send**: Email invoice to customer
- **Download PDF**: Get printable version
- **Download XML**: Get e-Tax compliant XML
- **Record Payment**: Mark as paid
- **Duplicate**: Create similar invoice
- **Delete**: Remove invoice (with confirmation)

#### Bulk Actions

Select multiple invoices to:
- **Send**: Email multiple invoices
- **Export**: Download CSV/Excel
- **Mark as Paid**: Record payments
- **Delete**: Remove multiple invoices

### Payment Recording

1. Click on an invoice
2. Click **Record Payment**
3. Enter payment details:
   - **Payment Amount**
   - **Payment Date**
   - **Payment Method** (Cash, Bank Transfer, Credit Card, etc.)
   - **Reference Number**
4. Click **Record Payment**

### Invoice Templates

Create reusable invoice templates:

1. Go to **Settings** → **Invoice Templates**
2. Click **Create Template**
3. Configure template:
   - **Template Name**
   - **Default Items**
   - **Payment Terms**
   - **Notes**
4. Click **Save Template**

Use templates when creating invoices for faster data entry.

## Product Management

### Adding Products

1. Go to **Products** → **Add Product**
2. Fill in product details:
   - **Product Name** (required)
   - **Description**
   - **SKU** (Stock Keeping Unit)
   - **Unit Price** (required)
   - **VAT Rate** (default 7%)
   - **Category**
   - **Inventory Quantity**
3. Click **Save Product**

### Managing Products

- **Edit**: Update product details
- **View Sales**: See sales history
- **Set Active/Inactive**: Control availability
- **Bulk Import**: Import from CSV/Excel

### Using Products in Invoices

When creating invoices:
1. Click **Add from Products**
2. Search and select products
3. Adjust quantities if needed
4. Products auto-fill with saved prices and descriptions

## Reports and Analytics

### Available Reports

#### Financial Reports

1. **Sales Report**
   - Date range selection
   - Revenue breakdown
   - VAT summary
   - Payment method analysis

2. **Aging Report**
   - Outstanding invoices
   - Aging buckets (0-30, 31-60, 61-90, 90+ days)
   - Customer payment history

3. **Tax Report**
   - VAT collected
   - Taxable sales
   - Exempt sales
   - Monthly/Quarterly summaries

#### Customer Reports

1. **Customer Sales History**
   - Total sales per customer
   - Average order value
   - Payment patterns

2. **Customer Aging**
   - Outstanding amounts by customer
   - Contact information
   - Payment terms

#### Product Reports

1. **Product Sales**
   - Best-selling products
   - Sales by category
   - Inventory movements

### Exporting Reports

All reports can be exported as:
- **PDF**: For printing and sharing
- **Excel**: For further analysis
- **CSV**: For data import
- **JSON**: For integration

### Custom Reports

Create custom reports:

1. Go to **Reports** → **Custom Reports**
2. Click **Create Report**
3. Configure:
   - **Data Sources** (Invoices, Customers, Products)
   - **Filters** (Date range, status, customer)
   - **Columns** to include
   - **Grouping** and sorting
4. Save and run report

## Settings and Configuration

### User Profile

1. Go to **Settings** → **Profile**
2. Update:
   - **Name**
   - **Email**
   - **Phone**
   - **Password**
3. Click **Update Profile**

### Security Settings

1. Go to **Settings** → **Security**
2. Configure:
   - **Two-Factor Authentication**
   - **Session Timeout**
   - **Login Notifications**
   - **API Key Management**

### Notification Settings

Control how you receive notifications:

1. Go to **Settings** → **Notifications**
2. Set preferences for:
   - **Email Notifications** (New invoices, payments, overdue notices)
   - **SMS Notifications** (if enabled)
   - **In-App Notifications**
   - **Digest Frequency** (Daily, Weekly, Monthly)

### Integration Settings

Connect with external services:

1. **Accounting Software** (QuickBooks, Xero)
2. **Payment Gateways** (Stripe, PayPal)
3. **Email Providers** (SendGrid, Mailgun)
4. **Webhooks** for custom integrations

### Backup Settings

Configure automatic backups:

1. Go to **Settings** → **Backup**
2. Set:
   - **Backup Frequency** (Daily, Weekly)
   - **Retention Period** (30, 60, 90 days)
   - **Backup Location** (Cloud storage settings)
   - **Email Notifications** for backup status

## Troubleshooting

### Common Issues

#### Invoice Creation Problems

**Issue**: Cannot create invoice
**Solutions**:
- Check customer information is complete
- Verify all required fields are filled
- Ensure product prices are valid numbers
- Check internet connection

**Issue**: VAT calculation incorrect
**Solutions**:
- Verify VAT rate settings (default 7% for Thailand)
- Check product VAT settings
- Ensure amounts are in correct currency

#### Payment Recording Issues

**Issue**: Cannot record payment
**Solutions**:
- Verify payment amount doesn't exceed invoice total
- Check payment date is valid
- Ensure payment method is selected
- Verify user has payment recording permissions

#### PDF Generation Problems

**Issue**: PDF not downloading
**Solutions**:
- Check browser pop-up blocker settings
- Verify invoice is saved (not draft)
- Try refreshing the page
- Check internet connection

#### Login Issues

**Issue**: Cannot log in
**Solutions**:
- Verify correct email and password
- Check if account is locked (contact admin)
- Clear browser cache and cookies
- Try password reset

### Performance Issues

**Slow Loading Times**:
- Check internet connection speed
- Clear browser cache
- Try different browser
- Contact support if persistent

### Getting Help

#### In-App Support

1. Click **Help** → **Support Center**
2. Browse knowledge base articles
3. Submit support ticket with details

#### Contact Information

- **Email**: support@yourdomain.com
- **Phone**: +66-2-XXX-XXXX
- **Live Chat**: Available 9 AM - 6 PM, Mon-Fri
- **Support Hours**: 24/7 for critical issues

#### Reporting Bugs

When reporting bugs, include:
1. **Description**: What you were trying to do
2. **Steps**: Exact steps to reproduce
3. **Expected**: What should have happened
4. **Actual**: What actually happened
5. **Browser**: Browser name and version
6. **Screenshots**: If applicable

### Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Create Invoice | Ctrl + N |
| Search | Ctrl + F |
| Save | Ctrl + S |
| Print | Ctrl + P |
| Help | F1 |

### Mobile App

The E-Tax mobile app provides:

- **Invoice Creation**: Create invoices on the go
- **Payment Recording**: Accept payments anywhere
- **Customer Management**: Access customer data
- **Offline Mode**: Work without internet connection
- **Push Notifications**: Real-time updates

Download from:
- **iOS**: App Store
- **Android**: Google Play Store

## Best Practices

### Invoice Management

1. **Use Sequential Numbers**: Maintain consistent invoice numbering
2. **Complete Information**: Ensure all required fields are filled
3. **Regular Backups**: Export important data regularly
4. **Review Before Sending**: Double-check all invoice details
5. **Follow Up**: Monitor unpaid invoices and send reminders

### Security

1. **Strong Passwords**: Use complex passwords and change regularly
2. **Two-Factor Authentication**: Enable 2FA when available
3. **Secure Connection**: Always use HTTPS
4. **Log Out**: Sign out when using shared computers
5. **Monitor Access**: Review login history regularly

### Data Management

1. **Regular Backups**: Set up automatic backups
2. **Data Validation**: Verify data accuracy
3. **Clean Up**: Archive old data periodically
4. **Documentation**: Keep records of important transactions

---

For additional help, visit our support portal at [support.yourdomain.com](https://support.yourdomain.com) or contact our support team.
