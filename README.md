# Aquaruse Laundry Management System

A comprehensive, modern laundry management system with role-based access, intelligent notifications, inventory management, and offline support.

## 🌟 Key Features

### 🔐 Authentication & Authorization
- **Admin Access**: Full system control with staff management capabilities
- **Staff Access**: Limited access to daily operations only
- **Role-based UI**: Dynamic interface based on user permissions
- **Secure Login**: Password-protected accounts with validation
- **Session Management**: Auto-logout and session timeout options

### 📊 Business Management

#### Order Management
- Create, edit, and track laundry orders
- Multiple service types (Regular Laundry, Wash & Fold, Dry Cleaning, Iron & Press)
- Real-time payment tracking (paid/balance)
- Order status management (Pending, Ongoing, Complete)
- Professional receipt generation with print support
- Customer autocomplete for faster order entry

#### Customer Database
- Automatic customer creation from orders
- Customer activity tracking (active/inactive status based on 30-day activity)
- Order history per customer
- Phone number and contact information management

#### Inventory Control
- Real-time supply tracking for 7 supply types
- Automatic supply consumption based on service type
- Smart low-stock alerts (< 6 units)
- Critical out-of-stock notifications
- Quantity adjustment with +/- controls
- Stock status indicators (In Stock, Low Stock, No Stock)

#### Staff Management (Admin Only)
- Add, edit, and delete staff members
- Password management with visibility toggle
- Email and phone contact information
- Staff account creation for system access
- Role-based permissions

### 🔔 Intelligent Notification System

#### Toast Notifications
- Real-time alerts for immediate actions
- Auto-dismiss after 3 seconds
- Color-coded by type (info, success, warning, error)
- Non-intrusive slide-in animation

#### Internal Notifications Panel
- Persistent notification history
- Categorized by type (Orders, Alerts, Staff, System)
- Mark as read/unread functionality
- Clear all notifications option
- Notification badge counter

#### Smart Stock Alerts
- Throttled notifications (max once every 4 hours for same issues)
- Immediate alerts when supplies become low from order processing
- Separate tracking for different stock issues
- No notification spam on page visits

### 🎨 User Experience

#### Themes & Customization
- Light and Dark theme support
- Persistent theme preferences per user
- Smooth theme transitions
- Optimized for readability in both modes

#### Profile Management
- Custom profile picture upload
- Automatic image compression (200x200px, 70% quality)
- Profile picture preview
- Display name customization
- User initials fallback

#### Interface Design
- Clean, modern UI with card-based layout
- Responsive design for mobile and desktop
- Intuitive navigation with sidebar menu
- Search functionality across all modules
- Pagination for large datasets (3-5 items per page)
- Modal-based forms for data entry

### 🔧 Technical Features

#### Data Management
- **Dual Storage**: API/Database + localStorage
- **Offline Support**: Full functionality without internet
- **Data Synchronization**: Automatic sync when online
- **Fallback System**: localStorage backup if API fails
- **Data Validation**: Input validation and error handling

#### Backend Integration
- RESTful API with PHP/MySQL
- JSON-based communication
- Error handling and logging
- Connection status monitoring
- Graceful degradation

#### Performance Optimizations
- Lazy loading of modules
- Efficient pagination
- Debounced search (300ms)
- Throttled notifications
- Image compression for profile pictures
- Minimal re-renders

## 📋 Setup Instructions

### Prerequisites
- **Web Server**: Apache/Nginx
- **PHP**: 7.4 or higher
- **MySQL**: 5.7 or higher
- **Browser**: Chrome 70+, Firefox 65+, Safari 12+, Edge 79+

### Installation Steps

1. **Clone/Download the Project**
   ```bash
   git clone [repository-url]
   cd aquaruse
   ```

2. **Database Setup**
   ```bash
   # Create database
   mysql -u root -p -e "CREATE DATABASE aquaruse;"
   
   # Import schema
   mysql -u root -p aquaruse < tempdata.sql
   ```

3. **Configure Database Connection**
   
   Edit `php/api.php` (lines 5-8):
   ```php
   $servername = "localhost";
   $username = "root";
   $password = "your_password";
   $dbname = "aquaruse";
   ```

4. **Deploy to Web Server**
   ```bash
   # Copy files to web root
   cp -r * /var/www/html/aquaruse/
   
   # Set permissions
   chmod 755 /var/www/html/aquaruse
   ```

5. **Access Application**
   - Navigate to: `http://localhost/aquaruse/` or `http://localhost/aquaruse/index.html`
   - You'll be automatically redirected to the login page
   - Login with default credentials

## 🔑 Default Credentials

### Admin Account
- **Email**: `admin@aquaruse`
- **Password**: `admin123` (or any password in demo mode)
- **Access**: Full system access including staff management

### Demo Staff Account
- **Email**: `staff@aquaruse`
- **Password**: `staff123`
- **Access**: Orders, Customers, Supplies only

## 📁 Project Structure

```
aquaruse/
├── index.html                  # Entry point (redirects to login)
├── html/                       # HTML Pages
│   ├── login.html              # Login page
│   └── spa.html                # Main application (SPA)
├── css/                        # Stylesheets
│   ├── login.css               # Login page styles
│   └── style.css               # Main stylesheet (3700+ lines)
├── js/                         # JavaScript Modules
│   ├── app.js                  # Main app controller (1200+ lines)
│   ├── api-service.js          # API communication service
│   ├── utils.js                # Utilities & AppData (900+ lines)
│   ├── dashboard.js            # Dashboard module
│   ├── orders.js               # Order management (900+ lines)
│   ├── customers.js            # Customer management
│   ├── supplies.js             # Inventory management
│   ├── staff.js                # Staff management (400+ lines)
│   ├── accounts.js             # Account management
│   ├── sales.js                # Sales tracking
│   ├── adminPanel.js           # Admin utilities
│   └── login.js                # Login functionality
├── php/                        # Backend PHP Files
│   ├── api.php                 # Main RESTful API
│   ├── accounts_backend.php    # Legacy backend (deprecated)
│   ├── test-api.php            # API testing utility
│   └── test_db.php             # Database connection test
├── assets/                     # Static Assets
│   ├── logo.png                # Application logo
│   └── background.png          # Background image
├── image/                      # Additional Images
│   └── logo.png                # Alternative logo
├── database_setup.sql          # Database schema
└── tempdata.sql                # Sample data for testing
```

## 🎯 Usage Guide

### For Administrators

#### Managing Staff
1. Navigate to **Staff** section (admin only)
2. Click **+ Add Staff** button
3. Fill in: Name, Email, Phone, Password
4. Staff member can now login with their email

#### Editing Staff
1. Click **Edit** button next to staff member
2. Modify information (including password)
3. Click **Update Staff**

#### Deleting Staff
1. Click **Delete** button next to staff member
2. Confirm deletion
3. Staff account is removed from system

#### Viewing Reports
- **Dashboard**: Overview of income, receivables, orders, supplies
- **Balance Cards**: Total income and unpaid amounts
- **Order Status**: Pending, Ongoing, Completed counts

### For All Users

#### Processing Orders
1. Navigate to **Orders** section
2. Click **+ Add Order** button
3. Enter customer information (autocomplete available)
4. Select service type and load count
5. Enter amount paid (balance calculated automatically)
6. System checks supply availability
7. Click **Add Order** to save

#### Managing Inventory
1. Navigate to **Supplies** section
2. View current stock levels
3. Use **+** and **-** buttons to adjust quantities
4. Filter by: All Supplies, Low Stock, Full Stock
5. Receive automatic alerts for low stock

#### Viewing Customers
1. Navigate to **Customers** section
2. View all customers with order history
3. See activity status (Active: < 30 days, Inactive: > 30 days)
4. Search by name or phone number

#### Customizing Profile
1. Click **Settings** icon (gear icon)
2. **Profile Tab**: Upload profile picture, change display name
3. **Security Tab**: Update password
4. **Preferences Tab**: Choose theme, notification settings
5. Click **Save Settings**

## 🔌 API Endpoints

All API endpoints are located in `php/api.php`

### Authentication
```
POST /php/api.php?action=login
Body: { email, password }
Response: { success, user, role }
```

### Orders
```
GET    /php/api.php?action=orders
POST   /php/api.php?action=add_order
PUT    /php/api.php?action=update_order
DELETE /php/api.php?action=delete_order
```

### Customers
```
GET    /php/api.php?action=customers
POST   /php/api.php?action=search_customers
```

### Supplies
```
GET    /php/api.php?action=supplies
PUT    /php/api.php?action=update_supply
```

### Staff
```
GET    /php/api.php?action=staff
POST   /php/api.php?action=add_staff
PUT    /php/api.php?action=update_staff
DELETE /php/api.php?action=delete_staff
```

### Settings
```
GET    /php/api.php?action=user_settings
POST   /php/api.php?action=save_user_settings
POST   /php/api.php?action=change_password
```

### Admin
```
POST   /php/api.php?action=clear_data
POST   /php/api.php?action=add_sample_data
```

## 🎨 Customization

### Changing Colors
Edit CSS variables in `style.css`:
```css
:root {
  --primary-dark: #213555;
  --primary-blue: #718EBF;
  --secondary-blue: #3E5879;
  --light-gray: #DFE5EE;
  /* ... */
}
```

### Dark Theme Colors
```css
body.dark-theme {
  --main-bg: #1a202c;
  --card-bg: #2d3748;
  --text-primary: #e2e8f0;
  /* ... */
}
```

### Modifying Service Prices
Edit in `js/utils.js`:
```javascript
servicePrices: {
  'Regular Laundry': 60,
  'Wash and Fold': 65,
  'Dry Cleaning': 250,
  'Iron and Press': 70
}
```

### Supply Consumption Rates
Edit in `js/utils.js`:
```javascript
supplyConsumption: {
  'Regular Laundry': { 
    detergent: 1, 
    softener: 1, 
    bleach: 1, 
    /* ... */ 
  }
}
```

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check MySQL is running
sudo systemctl status mysql

# Test connection
mysql -u root -p -e "SHOW DATABASES;"

# Verify database exists
mysql -u root -p -e "USE aquaruse; SHOW TABLES;"
```

### Login Problems
1. Clear browser cache and localStorage
2. Check browser console (F12) for errors
3. Verify database tables exist
4. Check `php/api.php` database credentials

### Profile Picture Not Uploading
1. Image is automatically compressed to 200x200px
2. Max file size: ~5MB (compressed to ~30KB)
3. Supported formats: JPG, PNG, GIF
4. Check browser console for errors

### Supplies Not Updating
1. Check browser console for errors
2. Verify API connection
3. Check localStorage quota
4. Try refreshing the page

### Notifications Not Showing
1. Check notification permissions
2. Verify JavaScript is enabled
3. Check browser console for errors
4. Try different browser

## 🔒 Security Best Practices

### Production Deployment
- [ ] Change all default passwords
- [ ] Use HTTPS (SSL certificate)
- [ ] Enable PHP error logging (disable display_errors)
- [ ] Implement rate limiting on API
- [ ] Use prepared statements (already implemented)
- [ ] Regular database backups
- [ ] Update PHP and MySQL regularly
- [ ] Restrict file upload types
- [ ] Implement CSRF protection
- [ ] Add input sanitization

### Database Security
```sql
-- Create dedicated database user
CREATE USER 'aquaruse_user'@'localhost' IDENTIFIED BY 'strong_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON aquaruse.* TO 'aquaruse_user'@'localhost';
FLUSH PRIVILEGES;
```

## 📊 Database Schema

### Tables
- **orders**: Order records with customer info, service type, amounts
- **customers**: Customer contact information
- **staff**: Staff member accounts and credentials
- **supplies**: Inventory tracking
- **accounts**: User accounts and authentication
- **user_settings**: User preferences and customization

## 🚀 Performance Tips

1. **Enable PHP OPcache** for faster execution
2. **Use MySQL query cache** for repeated queries
3. **Enable gzip compression** on web server
4. **Minify CSS/JS** for production
5. **Use CDN** for static assets
6. **Enable browser caching** with proper headers

## 📝 Version History

### Version 2.0 (Current)
- ✅ Enhanced staff management with edit/delete
- ✅ Intelligent notification system with throttling
- ✅ Profile picture upload with compression
- ✅ Supply increment/decrement controls
- ✅ Improved pagination and UI
- ✅ Dark theme optimization
- ✅ Receipt download functionality
- ✅ Customer auto-generation from orders
- ✅ Removed Accounts and Sales pages
- ✅ Bug fixes and performance improvements

### Version 1.0
- Initial release with core features
- Basic order management
- Customer and staff tracking
- Inventory management
- Authentication system

## 🤝 Contributing

To contribute to this project:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - Feel free to use this project for personal or commercial purposes.

## 💬 Support

For issues, questions, or feature requests:
- Check the troubleshooting section
- Review the API documentation
- Check browser console for errors
- Verify database connection

---

**Developed with ❤️ for Aquaruse Laundry**  
**Version**: 2.0  
**Last Updated**: October 2025  
**Status**: Production Ready