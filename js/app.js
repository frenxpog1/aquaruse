// Main Application Controller
class LaundryApp {
  constructor() {
    this.userEmail = localStorage.getItem('userEmail');

    // Check if user is authenticated
    if (!this.userEmail) {
      window.location.href = 'login.html';
      return;
    }

    // Initialize API service if not already done
    if (!window.apiService) {
      this.initializeApiService();
    }

    this.init();
  }

  async init() {
    this.initializeElements();
    this.setupNavigation();
    this.setupUserPermissions();
    this.setupLogout();
    this.setupSettings();
    this.setupNotifications();
    this.setupConnectionMonitoring();
    this.initializeDemoAccounts();
    this.initializeNotifications();
    this.applyTheme();
    this.loadUserSettings();
    this.syncProfilePictures(); // Ensure profile pictures are synced on startup
    window.AppUtils.setupGlobalModalClose();
    
    // Initialize data before showing dashboard
    await window.AppData.init();
    
    this.showSection('dashboard');
  }

  initializeApiService() {
    // Use the existing API service from api-service.js if available
    if (!window.apiService) {
      console.warn('API service not found, creating basic fallback');
      // Basic fallback API service
      window.apiService = {
        async get(endpoint) {
          try {
            const response = await fetch(`../php/api.php?action=${endpoint}`);
            return await response.json();
          } catch (error) {
            console.warn(`API GET ${endpoint} failed:`, error.message);
            return { success: false, error: error.message };
          }
        },

        async post(endpoint, data) {
          try {
            const response = await fetch(`../php/api.php?action=${endpoint}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
            });
            return await response.json();
          } catch (error) {
            console.warn(`API POST ${endpoint} failed:`, error.message);
            return { success: false, error: error.message };
          }
        },

        async put(endpoint, data) {
          try {
            const response = await fetch(`../php/api.php?action=${endpoint}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
            });
            return await response.json();
          } catch (error) {
            console.warn(`API PUT ${endpoint} failed:`, error.message);
            return { success: false, error: error.message };
          }
        }
      };
    }
  }

  initializeElements() {
    // Section elements
    this.sections = {
      dashboard: document.getElementById('dashboard-section'),
      orders: document.getElementById('orders-section'),
      customers: document.getElementById('customers-section'),
      supplies: document.getElementById('supplies-section'),
      staff: document.getElementById('staff-section')
    };

    // Navigation elements
    this.navElements = {
      dashboard: document.getElementById('nav-dashboard'),
      orders: document.getElementById('nav-orders'),
      customers: document.getElementById('nav-customers'),
      supplies: document.getElementById('nav-supplies'),
      staff: document.getElementById('nav-staff')
    };

    this.sidebarBtns = document.querySelectorAll('.sidebar-btn');
  }

  setupUserPermissions() {
    // Get user role
    const userRole = this.getUserRole();

    // Update user profile display
    this.updateUserProfile(userRole);

    if (userRole === 'admin') {
      // Admin has access to all features including staff management
      if (this.navElements.staff) this.navElements.staff.style.display = '';
    } else if (userRole === 'staff') {
      // Staff has limited access - hide admin-only features
      if (this.navElements.staff) this.navElements.staff.style.display = 'none';
    }
  }

  getUserRole() {
    if (this.userEmail === 'admin@aquaruse') {
      return 'admin';
    }

    // Check if user is in staff accounts
    const staffAccounts = JSON.parse(localStorage.getItem('staffAccounts') || '[]');
    const staffMember = staffAccounts.find(staff => staff.email === this.userEmail);

    if (staffMember) {
      return 'staff';
    }

    return 'guest';
  }

  updateUserProfile(role) {
    // Get user info
    let userName = 'Unknown User';
    let userRole = role.charAt(0).toUpperCase() + role.slice(1);

    if (this.userEmail === 'admin@aquaruse') {
      userName = 'Admin User';
      userRole = 'Administrator';
    } else {
      // Get staff member details
      const staffAccounts = JSON.parse(localStorage.getItem('staffAccounts') || '[]');
      const staffMember = staffAccounts.find(staff => staff.email === this.userEmail);
      if (staffMember) {
        userName = staffMember.name;
        userRole = 'Staff Member';
      }
    }

    // Update all user profile sections
    const userNameElements = document.querySelectorAll('.user-name');
    const userRoleElements = document.querySelectorAll('.user-role');
    const userAvatarElements = document.querySelectorAll('.user-avatar');

    userNameElements.forEach(el => el.textContent = userName);
    userRoleElements.forEach(el => el.textContent = userRole);

    // Check for saved profile picture and update all avatar elements
    const userSettingsKey = `userSettings_${this.userEmail}`;
    const savedSettings = JSON.parse(localStorage.getItem(userSettingsKey) || '{}');
    const allAvatarElements = document.querySelectorAll('.user-avatar, .current-avatar');

    if (savedSettings.profilePicture) {
      allAvatarElements.forEach(el => {
        el.style.backgroundImage = `url(${savedSettings.profilePicture})`;
        el.style.backgroundSize = 'cover';
        el.style.backgroundPosition = 'center';
        el.textContent = '';
      });
    } else {
      // Update avatar with initials
      const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase();
      allAvatarElements.forEach(el => {
        el.style.backgroundImage = '';
        el.textContent = initials;
      });
    }
  }

  setupLogout() {
    // Sidebar logout button
    const sidebarLogoutBtn = document.getElementById('sidebarLogoutBtn');
    if (sidebarLogoutBtn) {
      sidebarLogoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        // Clear user session
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userRole');

        // Redirect to login
        window.location.href = 'login.html';
      });
    }

    // Legacy logout button (if exists)
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userRole');
        window.location.href = 'login.html';
      });
    }
  }

  initializeDemoAccounts() {
    // Initialize demo staff account if none exist
    const existingStaffAccounts = JSON.parse(localStorage.getItem('staffAccounts') || '[]');

    if (existingStaffAccounts.length === 0) {
      const demoStaff = {
        id: 'demo-staff-1',
        name: 'John Staff',
        email: 'staff@aquaruse',
        phone: '+1234567890',
        password: 'staff123',
        role: 'staff'
      };

      existingStaffAccounts.push(demoStaff);
      localStorage.setItem('staffAccounts', JSON.stringify(existingStaffAccounts));

      // Also add to display staff list
      if (window.AppData && window.AppData.staff) {
        const displayStaff = {
          id: demoStaff.id,
          name: demoStaff.name,
          email: demoStaff.email,
          phone: demoStaff.phone
        };
        window.AppData.staff.push(displayStaff);
        window.AppData.save();
      }
    }
  }

  setupNavigation() {
    // Dashboard navigation
    this.navElements.dashboard?.addEventListener('click', async (e) => {
      e.preventDefault();
      this.showSection('dashboard');
      if (window.dashboardModule) {
        await window.dashboardModule.render();
      }
    });

    // Orders navigation
    this.navElements.orders?.addEventListener('click', async (e) => {
      e.preventDefault();
      this.showSection('orders');
      if (window.ordersModule) {
        await window.ordersModule.render();
      }
    });

    // Customers navigation
    this.navElements.customers?.addEventListener('click', async (e) => {
      e.preventDefault();
      this.showSection('customers');
      if (window.customersModule) {
        await window.customersModule.render();
      }
    });

    // Supplies navigation
    this.navElements.supplies?.addEventListener('click', async (e) => {
      e.preventDefault();
      this.showSection('supplies');
      if (window.suppliesModule) {
        await window.suppliesModule.render();
      }
    });

    // Staff navigation
    this.navElements.staff?.addEventListener('click', async (e) => {
      e.preventDefault();
      this.showSection('staff');
      if (window.staffModule) {
        await window.staffModule.render();
      }
    });

  }

  showSection(sectionName) {
    // Hide all sections
    Object.values(this.sections).forEach(section => {
      if (section) section.style.display = 'none';
    });

    // Show selected section
    if (this.sections[sectionName]) {
      this.sections[sectionName].style.display = '';
    }

    // Update active navigation
    this.sidebarBtns.forEach(btn => btn.classList.remove('active'));
    if (this.navElements[sectionName]) {
      this.navElements[sectionName].classList.add('active');
    }
  }

  setupSettings() {
    const settingsBtns = document.querySelectorAll('#settingsBtn');
    const settingsModalOverlay = document.getElementById('settingsModalOverlay');
    const settingsModalClose = document.getElementById('settingsModalClose');
    const settingsForm = document.querySelector('#settingsModalOverlay .modal-form');

    // Attach event listeners to all settings buttons
    settingsBtns.forEach(settingsBtn => {
      if (settingsBtn && settingsModalOverlay) {
        settingsBtn.addEventListener('click', () => {
          this.openSettingsModal();
        });
      }
    });

    if (settingsModalClose) {
      settingsModalClose.addEventListener('click', () => {
        settingsModalOverlay.classList.add('hidden');
      });
    }

    if (settingsForm) {
      settingsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveSettings();
      });
    }

    // Setup settings tabs
    const settingsTabs = document.querySelectorAll('.settings-tab');
    const settingsTabContents = document.querySelectorAll('.settings-tab-content');

    settingsTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetTab = tab.dataset.tab;

        // Remove active class from all tabs and contents
        settingsTabs.forEach(t => t.classList.remove('active'));
        settingsTabContents.forEach(content => content.classList.remove('active'));

        // Add active class to clicked tab and corresponding content
        tab.classList.add('active');
        document.getElementById(`${targetTab}-tab`).classList.add('active');
      });
    });

    // Setup profile picture upload
    // Profile picture buttons now use inline onclick handlers in HTML
    // No need for addEventListener here to avoid duplicate calls
    console.log('Profile picture buttons use inline handlers');

    // Setup modal close
    if (settingsModalOverlay) {
      window.AppUtils.setupModalClose(settingsModalOverlay);
    }
  }

  setupNotifications() {
    const notificationBtns = document.querySelectorAll('#notificationBtn');
    const notificationsModalOverlay = document.getElementById('notificationsModalOverlay');
    const notificationsModalClose = document.getElementById('notificationsModalClose');
    const closeNotificationsBtn = document.getElementById('closeNotificationsBtn');

    // Attach event listeners to all notification buttons
    notificationBtns.forEach(notificationBtn => {
      if (notificationBtn && notificationsModalOverlay) {
        notificationBtn.addEventListener('click', () => {
          this.openNotificationsModal();
        });
      }
    });

    if (notificationsModalClose) {
      notificationsModalClose.addEventListener('click', () => {
        notificationsModalOverlay.classList.add('hidden');
      });
    }

    if (closeNotificationsBtn) {
      closeNotificationsBtn.addEventListener('click', () => {
        notificationsModalOverlay.classList.add('hidden');
      });
    }

    // Setup notification actions
    const markAllReadBtn = document.getElementById('markAllReadBtn');
    const clearAllBtn = document.getElementById('clearAllBtn');

    if (markAllReadBtn) {
      markAllReadBtn.addEventListener('click', () => {
        this.markAllNotificationsRead();
      });
    }

    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', () => {
        this.clearAllNotifications();
      });
    }

    // Setup notification filters
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.filterNotifications(btn.dataset.filter);
      });
    });

    // Setup modal close
    if (notificationsModalOverlay) {
      window.AppUtils.setupModalClose(notificationsModalOverlay);
    }
  }

  openSettingsModal() {
    const settingsModalOverlay = document.getElementById('settingsModalOverlay');

    // Get current user info
    const userRole = this.getUserRole();
    let userName = 'Unknown User';
    let userEmail = this.userEmail;

    if (this.userEmail === 'admin@aquaruse') {
      userName = 'Admin User';
    } else {
      const staffAccounts = JSON.parse(localStorage.getItem('staffAccounts') || '[]');
      const staffMember = staffAccounts.find(staff => staff.email === this.userEmail);
      if (staffMember) {
        userName = staffMember.name;
      }
    }

    // Populate form
    document.getElementById('settingsName').value = userName;
    document.getElementById('settingsEmail').value = userEmail;
    document.getElementById('settingsRole').value = userRole.charAt(0).toUpperCase() + userRole.slice(1);

    // Load saved settings
    const userSettingsKey = `userSettings_${this.userEmail}`;
    const savedSettings = JSON.parse(localStorage.getItem(userSettingsKey) || '{}');
    document.getElementById('settingsTheme').value = savedSettings.theme || 'default';
    document.getElementById('settingsNotifications').value = savedSettings.notifications || 'all';
    document.getElementById('autoLogout').value = savedSettings.autoLogout || '0';

    // Update profile picture preview
    const currentAvatar = document.getElementById('currentAvatar');
    if (savedSettings.profilePicture) {
      currentAvatar.style.backgroundImage = `url(${savedSettings.profilePicture})`;
      currentAvatar.style.backgroundSize = 'cover';
      currentAvatar.style.backgroundPosition = 'center';
      currentAvatar.textContent = '';
    } else {
      const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase();
      currentAvatar.style.backgroundImage = '';
      currentAvatar.textContent = initials;
    }

    // Clear password fields
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';

    settingsModalOverlay.classList.remove('hidden');

    // Profile picture buttons use inline onclick handlers - no need for JS event listeners
    setTimeout(() => {
      this.syncProfilePictures();
    }, 100);
  }

  saveSettings() {
    const newName = document.getElementById('settingsName').value.trim();
    const theme = document.getElementById('settingsTheme').value;
    const notifications = document.getElementById('settingsNotifications').value;
    const autoLogout = document.getElementById('autoLogout').value;

    // Handle password change
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (newPassword && newPassword !== confirmPassword) {
      window.AppUtils.showNotification('New passwords do not match!');
      return;
    }

    if (newPassword && newPassword.length < 6) {
      window.AppUtils.showNotification('Password must be at least 6 characters long!');
      return;
    }

    // Handle password change for staff (localStorage only)
    if (newPassword && this.getUserRole() === 'staff') {
      const staffAccounts = JSON.parse(localStorage.getItem('staffAccounts') || '[]');
      const staffIndex = staffAccounts.findIndex(staff => staff.email === this.userEmail);
      if (staffIndex !== -1) {
        // Verify current password
        if (currentPassword !== staffAccounts[staffIndex].password) {
          window.AppUtils.showNotification('Current password is incorrect!');
          return;
        }
        staffAccounts[staffIndex].password = newPassword;
        localStorage.setItem('staffAccounts', JSON.stringify(staffAccounts));
      }
    }

    // Get current profile picture
    const userSettingsKey = `userSettings_${this.userEmail}`;
    const savedSettings = JSON.parse(localStorage.getItem(userSettingsKey) || '{}');

    // Prepare settings data
    const settingsData = {
      email: this.userEmail,
      display_name: newName,
      theme: theme,
      notifications: notifications,
      auto_logout: parseInt(autoLogout),
      profilePicture: savedSettings.profilePicture || null
    };

    // Save settings to localStorage with user-specific key
    localStorage.setItem(userSettingsKey, JSON.stringify(settingsData));

    // Update staff account if user is staff
    if (this.getUserRole() === 'staff') {
      const staffAccounts = JSON.parse(localStorage.getItem('staffAccounts') || '[]');
      const staffIndex = staffAccounts.findIndex(staff => staff.email === this.userEmail);
      if (staffIndex !== -1) {
        staffAccounts[staffIndex].name = newName;
        localStorage.setItem('staffAccounts', JSON.stringify(staffAccounts));
      }
    }

    try {
      // Apply theme immediately
      this.applyTheme(theme);

      // Update UI
      this.updateUserProfile(this.getUserRole());
      
      // Ensure profile pictures are restored after theme change
      this.syncProfilePictures();
    } catch (error) {
      console.error('Error in saveSettings:', error);
    }

    // Always close modal regardless of errors above
    const settingsModal = document.getElementById('settingsModalOverlay');
    if (settingsModal) {
      settingsModal.classList.add('hidden');
    }

    // Backup close mechanism with delay
    setTimeout(() => {
      const modal = document.getElementById('settingsModalOverlay');
      if (modal && !modal.classList.contains('hidden')) {
        console.log('Backup modal close triggered');
        modal.classList.add('hidden');
      }
    }, 100);

    // Clear password fields
    try {
      document.getElementById('currentPassword').value = '';
      document.getElementById('newPassword').value = '';
      document.getElementById('confirmPassword').value = '';
    } catch (error) {
      console.error('Error clearing password fields:', error);
    }

    window.AppUtils.showNotification('Settings saved successfully!');
  }

  handleProfilePictureUpload(event) {
    console.log('=== handleProfilePictureUpload called ===');
    console.log('Event:', event);
    console.log('Event target:', event.target);
    console.log('Files:', event.target.files);
    
    const file = event.target.files[0];
    console.log('Selected file:', file);
    
    if (!file) {
      console.log('No file selected');
      alert('No file selected');
      return;
    }

    console.log('File type:', file.type);
    console.log('File size:', file.size);
    console.log('File name:', file.name);

    if (!file.type.startsWith('image/')) {
      console.log('Invalid file type:', file.type);
      window.AppUtils.showNotification('Please select a valid image file!');
      alert('Please select a valid image file!');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      console.log('File too large:', file.size);
      window.AppUtils.showNotification('Image size must be less than 5MB!');
      return;
    }

    console.log('File is valid, processing...');
    
    // Compress image before saving
    const reader = new FileReader();
    reader.onload = (e) => {
      console.log('File read successfully');
      const imageData = e.target.result;
      console.log('Original image data length:', imageData.length);
      
      // Create an image element to compress
      const img = new Image();
      img.onload = () => {
        console.log('Image loaded, compressing...');
        
        // Create canvas for compression
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set max dimensions (200x200 for profile picture)
        const maxSize = 200;
        let width = img.width;
        let height = img.height;
        
        // Calculate new dimensions maintaining aspect ratio
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress image
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to base64 with compression (0.7 quality)
        const compressedImageData = canvas.toDataURL('image/jpeg', 0.7);
        console.log('Compressed image data length:', compressedImageData.length);
        console.log('Compression ratio:', ((1 - compressedImageData.length / imageData.length) * 100).toFixed(1) + '% smaller');
        
        try {
          // Save to localStorage with user-specific key
          const userSettingsKey = `userSettings_${this.userEmail}`;
          const userSettings = JSON.parse(localStorage.getItem(userSettingsKey) || '{}');
          userSettings.profilePicture = compressedImageData;
          localStorage.setItem(userSettingsKey, JSON.stringify(userSettings));
          console.log('Saved to localStorage');
          
          // Update UI
          this.updateProfilePicture(compressedImageData);
          console.log('Updated UI');
          
          window.AppUtils.showNotification('Profile picture updated successfully!', 'success');
        } catch (error) {
          console.error('Error saving to localStorage:', error);
          if (error.name === 'QuotaExceededError') {
            window.AppUtils.showNotification('Image is too large. Please use a smaller image.', 'error');
          } else {
            window.AppUtils.showNotification('Error saving profile picture!', 'error');
          }
        }
      };
      
      img.onerror = () => {
        console.error('Error loading image');
        window.AppUtils.showNotification('Error loading image!', 'error');
      };
      
      img.src = imageData;
    };
    
    reader.onerror = (e) => {
      console.error('FileReader error:', e);
      window.AppUtils.showNotification('Error reading file!', 'error');
    };
    
    reader.readAsDataURL(file);
  }

  openCropModal(imageData) {
    const cropModal = document.getElementById('cropModalOverlay');
    const cropImage = document.getElementById('cropImage');

    cropImage.src = imageData;
    cropImage.style.display = 'block';

    cropModal.classList.remove('hidden');

    // Initialize crop functionality
    setTimeout(() => this.initializeCrop(), 100);
  }

  initializeCrop() {
    const cropImage = document.getElementById('cropImage');
    const cropSelection = document.getElementById('cropSelection');
    const previewCanvas = document.getElementById('previewCanvas');
    const previewCtx = previewCanvas.getContext('2d');

    let isDragging = false;
    let isResizing = false;
    let startX, startY;
    let currentHandle = null;

    // Set initial crop selection (center square)
    const imageRect = cropImage.getBoundingClientRect();
    const size = Math.min(imageRect.width, imageRect.height) * 0.6;
    const left = (imageRect.width - size) / 2;
    const top = (imageRect.height - size) / 2;

    cropSelection.style.left = left + 'px';
    cropSelection.style.top = top + 'px';
    cropSelection.style.width = size + 'px';
    cropSelection.style.height = size + 'px';

    this.updatePreview();

    // Crop selection dragging
    cropSelection.addEventListener('mousedown', (e) => {
      if (e.target.classList.contains('crop-handle')) {
        isResizing = true;
        currentHandle = e.target;
      } else {
        isDragging = true;
      }
      startX = e.clientX;
      startY = e.clientY;
      e.preventDefault();
    });

    const handleMouseMove = (e) => {
      if (isDragging) {
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;

        const rect = cropSelection.getBoundingClientRect();
        const parentRect = cropImage.getBoundingClientRect();

        let newLeft = rect.left - parentRect.left + deltaX;
        let newTop = rect.top - parentRect.top + deltaY;

        // Constrain to image bounds
        newLeft = Math.max(0, Math.min(newLeft, parentRect.width - rect.width));
        newTop = Math.max(0, Math.min(newTop, parentRect.height - rect.height));

        cropSelection.style.left = newLeft + 'px';
        cropSelection.style.top = newTop + 'px';

        startX = e.clientX;
        startY = e.clientY;

        this.updatePreview();
      } else if (isResizing && currentHandle) {
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;

        const rect = cropSelection.getBoundingClientRect();
        const parentRect = cropImage.getBoundingClientRect();

        let newWidth = rect.width;
        let newHeight = rect.height;
        let newLeft = rect.left - parentRect.left;
        let newTop = rect.top - parentRect.top;

        if (currentHandle.classList.contains('bottom-right')) {
          newWidth += deltaX;
          newHeight += deltaY;
        } else if (currentHandle.classList.contains('top-left')) {
          newWidth -= deltaX;
          newHeight -= deltaY;
          newLeft += deltaX;
          newTop += deltaY;
        }

        // Keep square aspect ratio
        const size = Math.min(newWidth, newHeight);
        newWidth = newHeight = Math.max(50, size);

        // Constrain to image bounds
        if (newLeft + newWidth > parentRect.width) {
          newWidth = parentRect.width - newLeft;
          newHeight = newWidth;
        }
        if (newTop + newHeight > parentRect.height) {
          newHeight = parentRect.height - newTop;
          newWidth = newHeight;
        }

        cropSelection.style.width = newWidth + 'px';
        cropSelection.style.height = newHeight + 'px';
        cropSelection.style.left = newLeft + 'px';
        cropSelection.style.top = newTop + 'px';

        startX = e.clientX;
        startY = e.clientY;

        this.updatePreview();
      }
    };

    const handleMouseUp = () => {
      isDragging = false;
      isResizing = false;
      currentHandle = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    // Crop controls
    document.getElementById('cropApplyBtn').onclick = () => {
      this.applyCrop();
    };

    document.getElementById('cropCancelBtn').onclick = () => {
      this.closeCropModal();
    };

    document.getElementById('cropModalClose').onclick = () => {
      this.closeCropModal();
    };
  }

  updatePreview() {
    const cropImage = document.getElementById('cropImage');
    const cropSelection = document.getElementById('cropSelection');
    const previewCanvas = document.getElementById('previewCanvas');
    const previewCtx = previewCanvas.getContext('2d');

    const imageRect = cropImage.getBoundingClientRect();
    const selectionRect = cropSelection.getBoundingClientRect();

    // Calculate crop coordinates relative to the actual image
    const scaleX = cropImage.naturalWidth / imageRect.width;
    const scaleY = cropImage.naturalHeight / imageRect.height;

    const cropX = (selectionRect.left - imageRect.left) * scaleX;
    const cropY = (selectionRect.top - imageRect.top) * scaleY;
    const cropWidth = selectionRect.width * scaleX;
    const cropHeight = selectionRect.height * scaleY;

    // Draw preview
    previewCtx.clearRect(0, 0, 100, 100);
    previewCtx.drawImage(
      cropImage,
      cropX, cropY, cropWidth, cropHeight,
      0, 0, 100, 100
    );
  }

  applyCrop() {
    const previewCanvas = document.getElementById('previewCanvas');
    const croppedImageData = previewCanvas.toDataURL('image/jpeg', 0.9);

    // Save to localStorage
    const userSettings = JSON.parse(localStorage.getItem('userSettings') || '{}');
    userSettings.profilePicture = croppedImageData;
    localStorage.setItem('userSettings', JSON.stringify(userSettings));

    // Update UI
    this.updateProfilePicture(croppedImageData);

    // Close modal
    this.closeCropModal();

    window.AppUtils.showNotification('Profile picture updated successfully!');
  }

  closeCropModal() {
    document.getElementById('cropModalOverlay').classList.add('hidden');
    document.getElementById('cropImage').style.display = 'none';
  }

  removeProfilePicture() {
    const userSettingsKey = `userSettings_${this.userEmail}`;
    const userSettings = JSON.parse(localStorage.getItem(userSettingsKey) || '{}');
    delete userSettings.profilePicture;
    localStorage.setItem(userSettingsKey, JSON.stringify(userSettings));

    // Update UI
    this.updateProfilePicture(null);
    window.AppUtils.showNotification('Profile picture removed successfully!');
  }

  updateProfilePicture(imageData) {
    const avatarElements = document.querySelectorAll('.user-avatar, .current-avatar');

    if (imageData) {
      avatarElements.forEach(el => {
        el.style.backgroundImage = `url(${imageData})`;
        el.style.backgroundSize = 'cover';
        el.style.backgroundPosition = 'center';
        el.textContent = '';
      });
    } else {
      // Reset to initials
      const userRole = this.getUserRole();
      let userName = 'Unknown User';

      if (this.userEmail === 'admin@aquaruse') {
        userName = 'Admin User';
      } else {
        const staffAccounts = JSON.parse(localStorage.getItem('staffAccounts') || '[]');
        const staffMember = staffAccounts.find(staff => staff.email === this.userEmail);
        if (staffMember) {
          userName = staffMember.name;
        }
      }

      const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase();
      avatarElements.forEach(el => {
        el.style.backgroundImage = '';
        el.style.backgroundSize = '';
        el.style.backgroundPosition = '';
        el.textContent = initials;
      });
    }
  }

  syncProfilePictures() {
    console.log('Syncing profile pictures...');
    const userSettingsKey = `userSettings_${this.userEmail}`;
    const savedSettings = JSON.parse(localStorage.getItem(userSettingsKey) || '{}');
    const avatarElements = document.querySelectorAll('.user-avatar, .current-avatar');
    
    console.log('Found avatar elements:', avatarElements.length);
    console.log('Profile picture in settings:', savedSettings.profilePicture ? 'Yes' : 'No');

    if (savedSettings.profilePicture) {
      avatarElements.forEach((el, index) => {
        console.log(`Updating avatar ${index}`);
        // Force remove any existing background
        el.style.background = '';
        el.style.backgroundImage = `url("${savedSettings.profilePicture}")`;
        el.style.backgroundSize = 'cover';
        el.style.backgroundPosition = 'center';
        el.style.backgroundRepeat = 'no-repeat';
        el.textContent = '';
      });
    } else {
      console.log('No profile picture found, using initials');
      this.updateProfilePicture(null);
    }
  }

  // Test function - call this from browser console: window.app.testProfileSync()
  testProfileSync() {
    console.log('=== TESTING PROFILE SYNC ===');
    const savedSettings = JSON.parse(localStorage.getItem('userSettings') || '{}');
    console.log('LocalStorage userSettings:', savedSettings);

    const userAvatars = document.querySelectorAll('.user-avatar');
    const currentAvatars = document.querySelectorAll('.current-avatar');

    console.log('User avatars found:', userAvatars.length);
    console.log('Current avatars found:', currentAvatars.length);

    userAvatars.forEach((el, i) => {
      console.log(`User avatar ${i}:`, el, 'Background:', el.style.backgroundImage);
    });

    currentAvatars.forEach((el, i) => {
      console.log(`Current avatar ${i}:`, el, 'Background:', el.style.backgroundImage);
    });

    // Force sync
    this.syncProfilePictures();
  }

  applyTheme(theme) {
    const userSettingsKey = `userSettings_${this.userEmail}`;
    const savedSettings = JSON.parse(localStorage.getItem(userSettingsKey) || '{}');
    const currentTheme = theme || savedSettings.theme || 'default';

    // Remove existing theme classes
    document.body.classList.remove('dark-theme', 'light-theme');

    // Apply new theme
    if (currentTheme === 'dark') {
      document.body.classList.add('dark-theme');
      console.log('Applied dark theme');
    } else {
      // Both 'default' and 'light' use the same beautiful default styling
      console.log('Applied default/light theme');
    }

    // Update theme in settings if modal is open
    const themeSelect = document.getElementById('settingsTheme');
    if (themeSelect) {
      themeSelect.value = currentTheme;
    }

    // Save theme preference
    if (theme) {
      savedSettings.theme = theme;
      localStorage.setItem('userSettings', JSON.stringify(savedSettings));
    }

    // Restore profile pictures after theme change
    setTimeout(() => {
      this.syncProfilePictures();
    }, 100);
  }

  initializeNotifications() {
    // Initialize with sample notifications if none exist
    const existingNotifications = JSON.parse(localStorage.getItem('notifications') || '[]');

    if (existingNotifications.length === 0) {
      const sampleNotifications = [
        {
          id: 1,
          type: 'orders',
          title: 'New Order Received',
          message: 'Order #00123 from John Doe',
          time: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
          read: false,
          icon: '🔔'
        },
        {
          id: 2,
          type: 'alerts',
          title: 'Low Stock Alert',
          message: 'Detergent running low',
          time: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          read: false,
          icon: '⚠️'
        },
        {
          id: 3,
          type: 'orders',
          title: 'Order Completed',
          message: 'Order #00120 ready for pickup',
          time: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          read: true,
          icon: '✅'
        }
      ];

      localStorage.setItem('notifications', JSON.stringify(sampleNotifications));
    }

    this.updateNotificationBadge();
  }

  openNotificationsModal() {
    document.getElementById('notificationsModalOverlay').classList.remove('hidden');
    this.renderNotifications();
  }

  renderNotifications(filter = 'all') {
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    const notificationsList = document.getElementById('notificationsList');

    let filteredNotifications = notifications;

    if (filter === 'unread') {
      filteredNotifications = notifications.filter(n => !n.read);
    } else if (filter !== 'all') {
      filteredNotifications = notifications.filter(n => n.type === filter);
    }

    if (filteredNotifications.length === 0) {
      notificationsList.innerHTML = '<div class="no-notifications">No notifications found</div>';
      return;
    }

    notificationsList.innerHTML = filteredNotifications.map(notification => `
      <div class="notification-item ${notification.read ? '' : 'unread'}" data-id="${notification.id}">
        <div class="notification-icon">${notification.icon}</div>
        <div class="notification-content">
          <div class="notification-title">${notification.title}</div>
          <div class="notification-text">${notification.message}</div>
          <div class="notification-time">${this.formatNotificationTime(notification.time)}</div>
        </div>
      </div>
    `).join('');

    // Add click handlers to mark as read
    notificationsList.querySelectorAll('.notification-item').forEach(item => {
      item.addEventListener('click', () => {
        this.markNotificationRead(parseInt(item.dataset.id));
      });
    });
  }

  formatNotificationTime(timeString) {
    const time = new Date(timeString);
    const now = new Date();
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  }

  markNotificationRead(id) {
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    const notification = notifications.find(n => n.id === id);
    if (notification && !notification.read) {
      notification.read = true;
      localStorage.setItem('notifications', JSON.stringify(notifications));
      this.updateNotificationBadge();
      this.renderNotifications();
    }
  }

  markAllNotificationsRead() {
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    notifications.forEach(n => n.read = true);
    localStorage.setItem('notifications', JSON.stringify(notifications));
    this.updateNotificationBadge();
    this.renderNotifications();
    window.AppUtils.showNotification('All notifications marked as read');
  }

  clearAllNotifications() {
    if (confirm('Are you sure you want to clear all notifications?')) {
      localStorage.setItem('notifications', '[]');
      this.updateNotificationBadge();
      this.renderNotifications();
      window.AppUtils.showNotification('All notifications cleared');
    }
  }

  filterNotifications(filter) {
    this.renderNotifications(filter);
  }

  updateNotificationBadge() {
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    const unreadCount = notifications.filter(n => !n.read).length;
    const badges = document.querySelectorAll('.notification-badge');

    badges.forEach(badge => {
      if (unreadCount > 0) {
        badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
        badge.style.display = 'flex';
      } else {
        badge.style.display = 'none';
      }
    });
  }

  addNotification(type, title, message, icon = '🔔') {
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    const newNotification = {
      id: Date.now(),
      type: type,
      title: title,
      message: message,
      time: new Date().toISOString(),
      read: false,
      icon: icon
    };

    notifications.unshift(newNotification);

    // Keep only last 50 notifications
    if (notifications.length > 50) {
      notifications.splice(50);
    }

    localStorage.setItem('notifications', JSON.stringify(notifications));
    this.updateNotificationBadge();
  }

  setupConnectionMonitoring() {
    const updateConnectionStatus = () => {
      const indicator = document.getElementById('connectionIndicator');
      const text = document.getElementById('connectionText');

      if (indicator && text) {
        // Show online status
        indicator.className = 'connection-indicator online';
        text.textContent = 'Online';
        text.title = 'Connected to database';
      }
    };

    // Initial status
    updateConnectionStatus();

    // Local mode notification removed per user request
  }

  loadUserSettings() {
    // Load settings from localStorage only
    const userSettingsKey = `userSettings_${this.userEmail}`;
    const savedSettings = JSON.parse(localStorage.getItem(userSettingsKey) || '{}');

    if (savedSettings.theme) {
      this.applyTheme(savedSettings.theme);
    }

    console.log('Loaded user settings from localStorage');
  }
}

// Global app instance
window.laundryApp = null;

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
  window.laundryApp = new LaundryApp();
});