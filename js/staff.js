// Staff Module
class StaffModule {
  constructor() {
    this.staffList = document.getElementById('staff-list');
    this.currentPage = 1;
    this.itemsPerPage = 5;
    this.staff = null;
    this.init();
  }

  init() {
    this.setupStaffModal();
    this.setupSearch();
    // Force initial render
    setTimeout(() => this.render(), 100);
  }

  setupSearch() {
    window.AppUtils.setupSearch('staff-search', (query) => {
      this.searchQuery = query;
      this.currentPage = 1;
      this.render();
    });
  }

  setupStaffModal() {
    const addStaffBtn = document.getElementById('addStaffBtn');
    const staffModalOverlay = document.getElementById('staffModalOverlay');
    const staffModalForm = document.getElementById('staffForm');
    const staffModalClose = document.getElementById('staffModalClose');

    console.log('Staff modal elements found:', {
      addStaffBtn: !!addStaffBtn,
      staffModalOverlay: !!staffModalOverlay,
      staffModalForm: !!staffModalForm,
      staffModalClose: !!staffModalClose
    });

    if (!addStaffBtn || !staffModalOverlay || !staffModalForm) {
      console.error('Missing staff modal elements!');
      return;
    }

    // Add staff button click
    addStaffBtn.addEventListener('click', () => {
      staffModalOverlay.classList.remove('hidden');
      staffModalForm.reset();
    });

    // Close button click
    if (staffModalClose) {
      staffModalClose.addEventListener('click', () => {
        staffModalOverlay.classList.add('hidden');
      });
    }

    // Modal close setup
    window.AppUtils.setupModalClose(staffModalOverlay);

    // Form submission
    if (staffModalForm) {
      staffModalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Staff form submitted');
        this.handleStaffFormSubmission(staffModalForm);
      });
    } else {
      console.error('Staff form not found!');
    }
  }

  async handleStaffFormSubmission(form) {
    const formData = {
      name: document.getElementById('staffName')?.value?.trim(),
      email: document.getElementById('staffEmail')?.value?.trim(),
      phone: document.getElementById('staffPhone')?.value?.trim(),
      password: document.getElementById('staffPassword')?.value?.trim()
    };

    // Validation
    if (!formData.name || !formData.email || !formData.phone || !formData.password) {
      window.AppUtils.showNotification('Please fill in all required fields');
      return;
    }

    if (formData.password.length < 6) {
      window.AppUtils.showNotification('Password must be at least 6 characters long');
      return;
    }

    // Get button reference and original text before try block
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn?.textContent;

    try {
      // Show loading state
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Adding Staff...';
      }

      let apiSuccess = false;

      // Try to send to API first
      try {
        console.log('Attempting to save staff to database...', formData);
        const result = await window.apiService.post('add_staff', formData);
        
        if (result && result.success) {
          apiSuccess = true;
          console.log('✅ Staff saved to database successfully');
          
          // Force refresh data from API
          window.AppData.isLoaded = false;
          await window.AppData.init();
          
          // Also add to staff accounts for login (this stays local for security)
          const staffAccounts = JSON.parse(localStorage.getItem('staffAccounts') || '[]');
          staffAccounts.push({
            id: window.AppUtils.generateId(),
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            password: formData.password,
            role: 'staff'
          });
          localStorage.setItem('staffAccounts', JSON.stringify(staffAccounts));
          
          // Add staff save notification to internal panel
          window.AppUtils.addInternalNotification(
            'staff', 
            'Staff Member Added', 
            `${formData.name} has been added to the staff database`, 
            '👥'
          );
          
          window.AppUtils.showNotification('Staff member saved to database successfully!', 'success');
          
        } else {
          console.error('❌ Database save failed:', result);
          throw new Error(result?.error || result?.message || 'Database save failed');
        }
      } catch (apiError) {
        console.error('❌ API Error:', apiError);
        
        // Show error to user
        window.AppUtils.showNotification(`Database error: ${apiError.message}. Staff saved locally.`, 'error');
        
        // Only save locally if API completely failed
        const newStaff = {
          id: window.AppUtils.generateId(),
          name: formData.name,
          email: formData.email,
          phone: formData.phone
        };

        if (window.AppData) {
          if (!window.AppData.staff) window.AppData.staff = [];
          window.AppData.staff.push(newStaff);
          window.AppData.saveToLocalStorage();
        }

        // Also add to staff accounts for login
        const staffAccounts = JSON.parse(localStorage.getItem('staffAccounts') || '[]');
        staffAccounts.push({
          id: newStaff.id,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          role: 'staff'
        });
        localStorage.setItem('staffAccounts', JSON.stringify(staffAccounts));
        console.log('📱 Staff saved locally as fallback');
      }

      // Refresh data
      this.staff = null; // Force reload
      await this.render();

      // Close modal and reset form
      document.getElementById('staffModalOverlay').classList.add('hidden');
      form.reset();

      // Success message already shown above, no need to duplicate

    } catch (error) {
      console.error('Error adding staff:', error);
      window.AppUtils.showNotification('Error adding staff: ' + error.message);
    } finally {
      // Reset button state
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText || 'Add Staff';
      }
    }
  }

  async loadStaff() {
    // Use unified data system
    await window.AppData.init();
    this.staff = window.AppData.staff || [];
    console.log('Loaded staff from unified data system:', this.staff.length);
  }

  async render() {
    console.log('Staff render called');
    if (!this.staffList) {
      console.log('Staff list element not found');
      return;
    }

    // Always load fresh data
    await this.loadStaff();

    this.staffList.innerHTML = '';

    let filteredStaff = this.staff || [];
    console.log('Staff data for rendering:', filteredStaff);

    // Apply search filter
    if (this.searchQuery) {
      filteredStaff = window.AppUtils.filterItems(filteredStaff, this.searchQuery, ['name', 'email', 'phone']);
    }

    if (filteredStaff.length === 0) {
      this.staffList.innerHTML = '<div class="orders-empty-center">No staff members found.</div>';
      return;
    }

    // Get paginated staff
    const paginatedStaff = window.AppUtils.getPaginatedItems(filteredStaff, this.currentPage, this.itemsPerPage);

    const table = document.createElement('table');
    table.className = 'staff-table';
    
    const thead = document.createElement('thead');
    thead.innerHTML = `
      <tr>
        <th>Name</th>
        <th>Email</th>
        <th>Phone</th>
        <th>Password</th>
        <th>Actions</th>
      </tr>
    `;
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    paginatedStaff.forEach((staff, index) => {
      const row = document.createElement('tr');
      
      // Get password from staffAccounts
      const staffAccounts = JSON.parse(localStorage.getItem('staffAccounts') || '[]');
      const staffAccount = staffAccounts.find(acc => acc.email === staff.email);
      const password = staffAccount ? staffAccount.password : '••••••';
      
      row.innerHTML = `
        <td>${staff.name}</td>
        <td>${staff.email}</td>
        <td>${staff.phone}</td>
        <td>
          <span class="password-display" id="pwd-${index}">••••••</span>
          <button class="toggle-password-btn" onclick="window.staffModule.togglePassword(${index}, '${password}')" style="margin-left: 8px; padding: 4px 8px; border: none; background: #718EBF; color: white; border-radius: 4px; cursor: pointer; font-size: 12px;">Show</button>
        </td>
        <td>
          <button class="edit-btn" onclick="window.staffModule.editStaff('${staff.id || staff.email}')">Edit</button>
          <button class="delete-btn" onclick="window.staffModule.deleteStaff('${staff.id || staff.email}', '${staff.name}')" style="background: #DC2626; margin-left: 8px;">Delete</button>
        </td>
      `;
      tbody.appendChild(row);
    });
    table.appendChild(tbody);
    
    this.staffList.appendChild(table);

    // Add pagination
    window.AppUtils.createPagination(
      this.staffList.parentElement,
      filteredStaff,
      this.currentPage,
      this.itemsPerPage,
      (page) => {
        this.currentPage = page;
        this.render();
      }
    );
  }

  togglePassword(index, password) {
    const passwordDisplay = document.getElementById(`pwd-${index}`);
    const button = passwordDisplay.nextElementSibling;
    
    if (passwordDisplay.textContent === '••••••') {
      passwordDisplay.textContent = password;
      button.textContent = 'Hide';
    } else {
      passwordDisplay.textContent = '••••••';
      button.textContent = 'Show';
    }
  }

  editStaff(staffIdentifier) {
    console.log('Editing staff:', staffIdentifier);
    
    // Find staff member in staffAccounts
    const staffAccounts = JSON.parse(localStorage.getItem('staffAccounts') || '[]');
    const staffMember = staffAccounts.find(s => 
      s.id === staffIdentifier || 
      s.email === staffIdentifier
    );
    
    console.log('Found staff member:', staffMember);
    console.log('All staff accounts:', staffAccounts);
    
    if (!staffMember) {
      // Try to find in AppData.staff
      const appDataStaff = window.AppData.staff.find(s => 
        s.id === staffIdentifier || 
        s.email === staffIdentifier
      );
      
      if (appDataStaff) {
        // Create a staff account entry if it doesn't exist
        const newStaffAccount = {
          id: appDataStaff.id || window.AppUtils.generateId(),
          name: appDataStaff.name,
          email: appDataStaff.email,
          phone: appDataStaff.phone,
          password: '', // Blank password - admin should set it
          role: 'staff'
        };
        staffAccounts.push(newStaffAccount);
        localStorage.setItem('staffAccounts', JSON.stringify(staffAccounts));
        return this.editStaff(staffIdentifier);
      }
      
      window.AppUtils.showNotification('Staff member not found', 'error');
      console.error('Staff member not found:', staffIdentifier);
      return;
    }

    // Open edit modal
    const editModal = document.getElementById('editStaffModalOverlay');
    if (!editModal) {
      // Create edit modal if it doesn't exist
      this.createEditModal();
      setTimeout(() => this.editStaff(staffIdentifier), 100);
      return;
    }

    // Populate form
    document.getElementById('editStaffName').value = staffMember.name;
    document.getElementById('editStaffEmail').value = staffMember.email;
    document.getElementById('editStaffPhone').value = staffMember.phone;
    document.getElementById('editStaffPassword').value = staffMember.password;
    
    // Store current staff identifier for update
    this.currentEditingStaffIdentifier = staffIdentifier;
    this.currentEditingStaffEmail = staffMember.email;
    
    editModal.classList.remove('hidden');
  }

  async deleteStaff(staffIdentifier, staffName) {
    if (!confirm(`Are you sure you want to delete ${staffName}?`)) {
      return;
    }

    console.log('Deleting staff:', staffIdentifier);

    try {
      // Remove from staffAccounts (login accounts)
      let staffAccounts = JSON.parse(localStorage.getItem('staffAccounts') || '[]');
      const beforeCount = staffAccounts.length;
      staffAccounts = staffAccounts.filter(s => 
        s.id !== staffIdentifier && 
        s.email !== staffIdentifier
      );
      localStorage.setItem('staffAccounts', JSON.stringify(staffAccounts));
      console.log(`Removed from staffAccounts: ${beforeCount} -> ${staffAccounts.length}`);

      // Remove from AppData.staff (display list)
      const beforeAppDataCount = window.AppData.staff.length;
      window.AppData.staff = window.AppData.staff.filter(s => 
        s.id !== staffIdentifier && 
        s.email !== staffIdentifier
      );
      window.AppData.save();
      console.log(`Removed from AppData.staff: ${beforeAppDataCount} -> ${window.AppData.staff.length}`);

      // Try to delete from API
      try {
        if (window.apiService) {
          await window.apiService.delete('staff', { 
            id: staffIdentifier,
            email: staffIdentifier 
          });
        }
      } catch (apiError) {
        console.warn('Could not delete from API:', apiError.message);
      }

      // Add notification
      window.AppUtils.addInternalNotification(
        'staff',
        'Staff Member Deleted',
        `${staffName} has been removed from the staff database`,
        '🗑️'
      );

      window.AppUtils.showNotification(`${staffName} deleted successfully`, 'success');

      // Force cache invalidation to ensure fresh data on next page load
      window.AppData.isLoaded = false;

      // Refresh display
      this.staff = null;
      await this.render();
    } catch (error) {
      console.error('Error deleting staff:', error);
      window.AppUtils.showNotification('Error deleting staff member', 'error');
    }
  }

  createEditModal() {
    const modalHTML = `
      <div id="editStaffModalOverlay" class="modal-overlay hidden">
        <div class="modal">
          <button type="button" id="editStaffModalClose" 
            style="position:absolute;top:15px;right:20px;background:none;border:none;color:#666;font-size:1.5rem;cursor:pointer;width:30px;height:30px;display:flex;align-items:center;justify-content:center;border-radius:50%;transition:background 0.2s ease;"
            onmouseover="this.style.background='rgba(0,0,0,0.1)'" onmouseout="this.style.background='none'">×</button>
          <h2>Edit Staff Member</h2>
          <form id="editStaffForm" class="modal-form-single">
            <label for="editStaffName">Name</label>
            <input type="text" id="editStaffName" required>
            
            <label for="editStaffEmail">Email</label>
            <input type="email" id="editStaffEmail" required>
            
            <label for="editStaffPhone">Phone</label>
            <input type="tel" id="editStaffPhone" required>
            
            <label for="editStaffPassword">Password</label>
            <input type="text" id="editStaffPassword" required>
            
            <button type="submit" class="modal-add">Update Staff</button>
          </form>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Setup event listeners
    const editModal = document.getElementById('editStaffModalOverlay');
    const editForm = document.getElementById('editStaffForm');
    const closeBtn = document.getElementById('editStaffModalClose');

    closeBtn.addEventListener('click', () => {
      editModal.classList.add('hidden');
    });

    window.AppUtils.setupModalClose(editModal);

    editForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleEditStaffSubmission();
    });
  }

  async handleEditStaffSubmission() {
    const formData = {
      name: document.getElementById('editStaffName').value.trim(),
      email: document.getElementById('editStaffEmail').value.trim(),
      phone: document.getElementById('editStaffPhone').value.trim(),
      password: document.getElementById('editStaffPassword').value
    };

    // Validation
    if (!formData.name || !formData.email || !formData.phone || !formData.password) {
      window.AppUtils.showNotification('Please fill in all fields', 'warning');
      return;
    }

    if (formData.password.length < 6) {
      window.AppUtils.showNotification('Password must be at least 6 characters', 'warning');
      return;
    }

    try {
      // Update staffAccounts using email as primary identifier
      let staffAccounts = JSON.parse(localStorage.getItem('staffAccounts') || '[]');
      const staffIndex = staffAccounts.findIndex(s => 
        s.id === this.currentEditingStaffIdentifier || 
        s.email === this.currentEditingStaffIdentifier ||
        s.email === this.currentEditingStaffEmail
      );
      
      console.log('Updating staff at index:', staffIndex);
      
      if (staffIndex !== -1) {
        const oldEmail = staffAccounts[staffIndex].email;
        staffAccounts[staffIndex] = {
          ...staffAccounts[staffIndex],
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password
        };
        localStorage.setItem('staffAccounts', JSON.stringify(staffAccounts));
        console.log('Updated staffAccounts');
      }

      // Update AppData.staff using email as identifier
      const appDataIndex = window.AppData.staff.findIndex(s => 
        s.id === this.currentEditingStaffIdentifier || 
        s.email === this.currentEditingStaffIdentifier ||
        s.email === this.currentEditingStaffEmail
      );
      
      console.log('Updating AppData.staff at index:', appDataIndex);
      
      if (appDataIndex !== -1) {
        window.AppData.staff[appDataIndex] = {
          ...window.AppData.staff[appDataIndex],
          name: formData.name,
          email: formData.email,
          phone: formData.phone
        };
        window.AppData.save();
        console.log('Updated AppData.staff');
      }

      // Try to update in API
      try {
        if (window.apiService) {
          await window.apiService.put('staff', {
            id: this.currentEditingStaffIdentifier,
            email: this.currentEditingStaffEmail,
            ...formData
          });
        }
      } catch (apiError) {
        console.warn('Could not update in API:', apiError.message);
      }

      // Add notification
      window.AppUtils.addInternalNotification(
        'staff',
        'Staff Member Updated',
        `${formData.name}'s information has been updated`,
        '✏️'
      );

      window.AppUtils.showNotification('Staff member updated successfully', 'success');

      // Close modal and refresh
      document.getElementById('editStaffModalOverlay').classList.add('hidden');
      this.staff = null;
      await this.render();
    } catch (error) {
      console.error('Error updating staff:', error);
      window.AppUtils.showNotification('Error updating staff member', 'error');
    }
  }
}

// Initialize staff module
window.staffModule = new StaffModule();