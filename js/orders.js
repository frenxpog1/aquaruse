// Orders Module
class OrdersModule {
  constructor() {
    this.ordersList = document.getElementById('orders-list');
    this.currentFilter = 'all';
    this.currentPage = 1;
    this.itemsPerPage = 5;
    this.orders = null; // Will be loaded from API
    this.init();
    // Force initial render
    setTimeout(() => this.render(), 100);
  }

  init() {
    this.setupOrderModal();
    this.setupEditOrderModal();
    this.setupFilters();
    this.setupSearch();
  }

  setupSearch() {
    window.AppUtils.setupSearch('orders-search', (query) => {
      this.searchQuery = query;
      this.currentPage = 1; // Reset to first page
      this.render();
    });
  }

  setupFilters() {
    // Setup order filter tabs
    const orderTabs = document.querySelectorAll('.orders-table-header .table-tab');
    orderTabs.forEach((tab, index) => {
      tab.addEventListener('click', () => {
        // Remove active class from all tabs
        orderTabs.forEach(t => t.classList.remove('active'));
        // Add active class to clicked tab
        tab.classList.add('active');
        
        // Set filter based on tab text
        const tabText = tab.textContent.toLowerCase();
        if (tabText.includes('all')) this.currentFilter = 'all';
        else if (tabText.includes('pending')) this.currentFilter = 'pending';
        else if (tabText.includes('ongoing')) this.currentFilter = 'ongoing';
        else if (tabText.includes('completed')) this.currentFilter = 'completed';
        
        // Reset to first page when filter changes
        this.currentPage = 1;
        this.render();
      });
    });
  }

  setupEditOrderModal() {
    const editModal = document.getElementById('editOrderModalOverlay');
    const editForm = document.getElementById('editOrderForm');
    const editCloseBtn = document.getElementById('editOrderModalClose');
    const editAmountPaidInput = document.getElementById('editAmountPaid');
    const editBalanceInput = document.getElementById('editBalance');
    const editTotalAmountInput = document.getElementById('editTotalAmount');

    if (!editModal || !editForm) return;

    // Close button
    if (editCloseBtn) {
      editCloseBtn.addEventListener('click', () => {
        editModal.classList.add('hidden');
      });
    }

    // Modal close setup
    window.AppUtils.setupModalClose(editModal);

    // Auto-calculate balance when amount paid changes
    if (editAmountPaidInput && editBalanceInput && editTotalAmountInput) {
      editAmountPaidInput.addEventListener('input', () => {
        const totalAmount = parseFloat(editTotalAmountInput.value) || 0;
        const amountPaid = parseFloat(editAmountPaidInput.value) || 0;
        const balance = Math.max(0, totalAmount - amountPaid);
        editBalanceInput.value = balance.toFixed(2);
      });
    }

    // Form submission
    editForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleEditOrderSubmission();
    });
  }

  setupOrderModal() {
    const addOrderBtn = document.getElementById('addOrderBtnOrders');
    const orderModalOverlay = document.getElementById('orderModalOverlay');
    const orderModalForm = document.querySelector('#orderModalOverlay .modal-form');
    const orderModalClose = document.getElementById('orderModalClose');

    if (!addOrderBtn || !orderModalOverlay || !orderModalForm) return;

    // Add order button click
    addOrderBtn.addEventListener('click', () => {
      orderModalOverlay.classList.remove('hidden');
      // Reset form when opening
      orderModalForm.reset();
      this.hideSupplyWarning();
      // Reset form when opening - no date field in order modal
    });

    // Close button click
    if (orderModalClose) {
      orderModalClose.addEventListener('click', () => {
        orderModalOverlay.classList.add('hidden');
        this.hideSupplyWarning();
      });
    }

    // Modal close setup
    window.AppUtils.setupModalClose(orderModalOverlay);

    // Setup customer name autocomplete
    this.setupCustomerAutocomplete();

    // Auto-calculate remaining balance
    const orderTypeSelect = document.getElementById('orderType');
    const orderLoadCountInput = document.getElementById('orderLoadCount');
    const orderAmountPaidInput = document.getElementById('orderAmountPaid');
    const orderRemainingBalanceInput = document.getElementById('orderRemainingBalance');
    
    const calculateBalance = () => {
      const serviceType = orderTypeSelect?.value;
      const loadCount = parseInt(orderLoadCountInput?.value) || 0;
      const amountPaid = parseFloat(orderAmountPaidInput?.value) || 0;
      
      if (serviceType && loadCount > 0) {
        const basePrice = window.AppUtils.servicePrices[serviceType] || 0;
        const totalAmount = basePrice * loadCount;
        const remainingBalance = Math.max(0, totalAmount - amountPaid);
        
        if (orderRemainingBalanceInput) {
          orderRemainingBalanceInput.value = remainingBalance.toFixed(2);
        }
      }
    };
    
    // Add event listeners for auto-calculation
    if (orderTypeSelect) orderTypeSelect.addEventListener('change', () => {
      calculateBalance();
      this.checkSupplyRequirements();
    });
    if (orderLoadCountInput) orderLoadCountInput.addEventListener('input', () => {
      calculateBalance();
      this.checkSupplyRequirements();
    });
    if (orderAmountPaidInput) orderAmountPaidInput.addEventListener('input', calculateBalance);

    // Form submission
    orderModalForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleOrderFormSubmission(orderModalForm);
    });
  }

  setupCustomerAutocomplete() {
    const customerNameInput = document.getElementById('orderCustomer');
    const customerNumberInput = document.getElementById('orderCustomerNumber');
    
    if (!customerNameInput || !customerNumberInput) return;

    let debounceTimer;
    let suggestionsList;

    // Create suggestions dropdown
    const createSuggestionsList = () => {
      if (suggestionsList) return suggestionsList;
      
      suggestionsList = document.createElement('div');
      suggestionsList.className = 'customer-suggestions';
      suggestionsList.style.cssText = `
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: white;
        border: 1px solid #ddd;
        border-top: none;
        border-radius: 0 0 4px 4px;
        max-height: 200px;
        overflow-y: auto;
        z-index: 1000;
        display: none;
      `;
      
      customerNameInput.parentElement.style.position = 'relative';
      customerNameInput.parentElement.appendChild(suggestionsList);
      return suggestionsList;
    };

    // Handle customer name input
    customerNameInput.addEventListener('input', (e) => {
      const query = e.target.value.trim();
      
      clearTimeout(debounceTimer);
      
      if (query.length < 2) {
        this.hideSuggestions();
        return;
      }

      debounceTimer = setTimeout(async () => {
        try {
          // Try API search first
          const result = await window.apiService.searchCustomers(query);
          if (result && result.success && result.data && result.data.length > 0) {
            this.showCustomerSuggestions(result.data, customerNameInput, customerNumberInput);
            return;
          }
        } catch (error) {
          console.warn('API search failed, using local data:', error.message);
        }

        // Fallback to local data search
        if (window.dataManager) {
          window.dataManager.generateCustomersFromOrders();
        }
        
        if (window.AppData && window.AppData.customers) {
          const localMatches = window.AppData.customers
            .filter(customer => customer.name.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 10)
            .map(customer => ({
              name: customer.name,
              phone: customer.number
            }));
          
          if (localMatches.length > 0) {
            this.showCustomerSuggestions(localMatches, customerNameInput, customerNumberInput);
          } else {
            this.hideSuggestions();
          }
        } else {
          this.hideSuggestions();
        }
      }, 300);
    });

    // Hide suggestions when clicking outside
    document.addEventListener('click', (e) => {
      if (!customerNameInput.parentElement.contains(e.target)) {
        this.hideSuggestions();
      }
    });
  }

  showCustomerSuggestions(customers, nameInput, numberInput) {
    const suggestionsList = document.querySelector('.customer-suggestions') || this.createSuggestionsList();
    
    suggestionsList.innerHTML = '';
    
    customers.forEach(customer => {
      const suggestionItem = document.createElement('div');
      suggestionItem.className = 'suggestion-item';
      suggestionItem.style.cssText = `
        padding: 10px;
        cursor: pointer;
        border-bottom: 1px solid #eee;
        transition: background-color 0.2s;
      `;
      
      suggestionItem.innerHTML = `
        <div style="font-weight: 500;">${customer.name}</div>
        <div style="font-size: 12px; color: #666;">${customer.phone}</div>
      `;
      
      suggestionItem.addEventListener('mouseenter', () => {
        suggestionItem.style.backgroundColor = '#f5f5f5';
      });
      
      suggestionItem.addEventListener('mouseleave', () => {
        suggestionItem.style.backgroundColor = 'white';
      });
      
      suggestionItem.addEventListener('click', () => {
        nameInput.value = customer.name;
        numberInput.value = customer.phone;
        this.hideSuggestions();
        
        // Focus next input
        const nextInput = document.getElementById('orderLoadCount');
        if (nextInput) nextInput.focus();
      });
      
      suggestionsList.appendChild(suggestionItem);
    });
    
    suggestionsList.style.display = 'block';
  }

  hideSuggestions() {
    const suggestionsList = document.querySelector('.customer-suggestions');
    if (suggestionsList) {
      suggestionsList.style.display = 'none';
    }
  }

  checkSupplyRequirements() {
    const orderTypeSelect = document.getElementById('orderType');
    const orderLoadCountInput = document.getElementById('orderLoadCount');
    
    if (!orderTypeSelect || !orderLoadCountInput) return;
    
    const serviceType = orderTypeSelect.value;
    const loadCount = parseInt(orderLoadCountInput.value) || 0;
    
    if (!serviceType || loadCount <= 0) {
      this.hideSupplyWarning();
      return;
    }
    
    const supplyCheck = window.AppUtils.checkSupplySufficiency(serviceType, loadCount);
    
    if (!supplyCheck.sufficient) {
      this.showSupplyWarning(supplyCheck.shortages);
    } else {
      this.hideSupplyWarning();
    }
  }

  showSupplyWarning(shortages) {
    // Remove existing warning
    this.hideSupplyWarning();
    
    const orderForm = document.querySelector('#orderModalOverlay .modal-form');
    if (!orderForm) return;
    
    const warningDiv = document.createElement('div');
    warningDiv.id = 'supply-warning';
    warningDiv.style.cssText = `
      background: #fff3cd;
      border: 1px solid #ffeaa7;
      border-radius: 4px;
      padding: 12px;
      margin: 10px 0;
      color: #856404;
    `;
    
    let warningHTML = '<strong>⚠️ Insufficient Supplies:</strong><br>';
    shortages.forEach(shortage => {
      warningHTML += `• ${shortage.supply}: Need ${shortage.needed}, have ${shortage.available}<br>`;
    });
    
    warningDiv.innerHTML = warningHTML;
    orderForm.insertBefore(warningDiv, orderForm.querySelector('button[type="submit"]'));
  }

  hideSupplyWarning() {
    const existingWarning = document.getElementById('supply-warning');
    if (existingWarning) {
      existingWarning.remove();
    }
  }

  createSuggestionsList() {
    const customerNameInput = document.getElementById('orderCustomer');
    if (!customerNameInput) return null;
    
    const suggestionsList = document.createElement('div');
    suggestionsList.className = 'customer-suggestions';
    suggestionsList.style.cssText = `
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: white;
      border: 1px solid #ddd;
      border-top: none;
      border-radius: 0 0 4px 4px;
      max-height: 200px;
      overflow-y: auto;
      z-index: 1000;
      display: none;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    `;
    
    customerNameInput.parentElement.style.position = 'relative';
    customerNameInput.parentElement.appendChild(suggestionsList);
    return suggestionsList;
  }

  handleEditOrderSubmission() {
    if (!this.currentEditingOrder) return;

    const { order, index } = this.currentEditingOrder;
    
    // Get form data
    const newStatus = document.getElementById('editOrderStatus').value;
    const newAmountPaid = parseFloat(document.getElementById('editAmountPaid').value) || 0;
    const totalAmount = parseFloat(document.getElementById('editTotalAmount').value) || 0;
    const newBalance = Math.max(0, totalAmount - newAmountPaid);

    // Validation
    if (newAmountPaid < 0 || newAmountPaid > totalAmount) {
      window.AppUtils.showNotification('Invalid payment amount');
      return;
    }

    // Update the order
    const updatedOrder = {
      ...order,
      statusValue: newStatus,
      paid: newAmountPaid.toString(),
      balance: newBalance.toString()
    };

    // Update in AppData
    const orderIndex = window.AppData.orders.findIndex(o => o.orderId === order.orderId);
    if (orderIndex !== -1) {
      window.AppData.orders[orderIndex] = updatedOrder;
      window.AppData.save();
    }

    // Note: Customer refresh removed - customers are managed separately

    // Refresh displays
    this.orders = null; // Force reload
    this.render();
    
    if (window.customersModule) {
      window.customersModule.customers = null;
      window.customersModule.render();
    }

    // Close modal
    document.getElementById('editOrderModalOverlay').classList.add('hidden');
    this.currentEditingOrder = null;

    // Add order update notification to internal panel
    window.AppUtils.addInternalNotification(
      'orders', 
      'Order Updated', 
      `Order #${order.orderId} has been updated successfully`, 
      '📝'
    );
    
    window.AppUtils.showNotification('Order updated successfully!');
  }

  async handleOrderFormSubmission(form) {
    const formData = {
      customerName: document.getElementById('orderCustomer')?.value?.trim(),
      customerNumber: document.getElementById('orderCustomerNumber')?.value?.trim(),
      loadCount: document.getElementById('orderLoadCount')?.value,
      orderType: document.getElementById('orderType')?.value,
      amountPaid: document.getElementById('orderAmountPaid')?.value,
      remainingBalance: document.getElementById('orderRemainingBalance')?.value
    };

    // Validation
    if (!formData.customerName || !formData.customerNumber || !formData.loadCount || !formData.orderType || !formData.amountPaid) {
      window.AppUtils.showNotification('Please fill in all required fields');
      return;
    }

    // Validate amounts are positive numbers
    const amountPaid = parseFloat(formData.amountPaid);
    const remainingBalance = parseFloat(formData.remainingBalance);
    const loadCount = parseInt(formData.loadCount);
    
    if (isNaN(amountPaid) || amountPaid < 0) {
      window.AppUtils.showNotification('Please enter a valid amount paid');
      return;
    }
    
    if (isNaN(loadCount) || loadCount <= 0) {
      window.AppUtils.showNotification('Please enter a valid load count');
      return;
    }

    // Check supply sufficiency
    const supplyCheck = window.AppUtils.checkSupplySufficiency(formData.orderType, loadCount);
    if (!supplyCheck.sufficient) {
      const shortageMessage = window.AppUtils.formatShortageMessage(supplyCheck.shortages);
      window.AppUtils.showNotification(shortageMessage);
      return;
    }

    // Calculate total amount (paid + remaining balance)
    const totalAmount = amountPaid + (remainingBalance || 0);

    // Generate order ID
    const orderId = String(window.AppData.orderIdCounter).padStart(5, '0');

    // Prepare order data for API
    const orderData = {
      order_id: orderId,
      customer_name: formData.customerName,
      number: formData.customerNumber,
      date: new Date().toISOString().split('T')[0],
      service_type: formData.orderType,
      kg: loadCount,
      total_amount: totalAmount,
      amount_paid: amountPaid,
      balance: remainingBalance || 0,
      status: 'pending'
    };

    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn?.textContent;
    
    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Adding Order...';
      }

      // Create local order object
      const newOrder = {
        name: formData.customerName,
        number: formData.customerNumber,
        service: formData.orderType,
        load: loadCount,
        amount: totalAmount.toString(),
        paid: amountPaid.toString(),
        balance: (remainingBalance || 0).toString(),
        orderId: orderId,
        dateValue: new Date().toISOString().split('T')[0],
        statusValue: 'pending',
        notes: ''
      };

      let apiSuccess = false;

      // Try to send to API first - with better error handling
      try {
        console.log('Attempting to save order to database...', orderData);
        const result = await window.apiService.addOrder(orderData);
        
        if (result && result.success) {
          apiSuccess = true;
          console.log('✅ Order saved to database successfully');
          
          // Increment counter for successful API save
          window.AppData.orderIdCounter++;
          
          // Force refresh data from API to get updated data
          window.AppData.isLoaded = false;
          await window.AppData.init();
          
          // Add order save notification to internal panel
          window.AppUtils.addInternalNotification(
            'orders', 
            'Order Saved', 
            `Order #${orderId} for ${formData.customerName} has been saved to database`, 
            '💾'
          );
          
          window.AppUtils.showNotification('Order saved to database successfully!', 'success');
        } else {
          console.error('❌ Database save failed:', result);
          throw new Error(result?.error || result?.message || 'Database save failed');
        }
      } catch (apiError) {
        console.error('❌ API Error:', apiError);
        
        // Show error to user
        window.AppUtils.showNotification(`Database error: ${apiError.message}. Order saved locally.`, 'error');
        
        // Only save locally if API completely failed
        if (window.AppData) {
          window.AppData.orders.push(newOrder);
          window.AppData.orderIdCounter++;
          window.AppData.generateCustomersFromOrders();
          window.AppData.saveToLocalStorage();
          console.log('📱 Order saved locally as fallback');
        }
      }

      // Consume supplies for this order
      const supplyConsumed = window.AppUtils.consumeSupplies(formData.orderType, loadCount);
      if (supplyConsumed) {
        console.log(`Supplies consumed for ${formData.orderType} - ${loadCount}kg`);
        
        // Add order completion notification to internal panel
        window.AppUtils.addInternalNotification(
          'orders', 
          'Order Processed', 
          `Order #${orderId} for ${formData.customerName} has been processed successfully`, 
          '✅'
        );
        
        // Force refresh all modules that display supplies
        if (window.dashboardModule) {
          setTimeout(() => window.dashboardModule.render(), 100);
        }
        if (window.suppliesModule) {
          setTimeout(() => window.suppliesModule.render(), 100);
        }
      }

      // Note: Customer generation removed - customers are managed separately

      // Refresh data
      this.orders = null; // Force reload
      await this.render();
      
      // Refresh customers data too
      if (window.customersModule) {
        window.customersModule.customers = null; // Force reload
        await window.customersModule.render();
      }
      
      // Refresh supplies display
      if (window.suppliesModule) {
        window.suppliesModule.render();
      }
      
      if (window.dashboardModule) {
        window.dashboardModule.render();
        if (window.dashboardModule.renderSupplyList) {
          window.dashboardModule.renderSupplyList();
        }
      }

      // Close modal and reset form
      document.getElementById('orderModalOverlay').classList.add('hidden');
      form.reset();
      this.hideSuggestions();

      const message = apiSuccess ? 'Order added successfully!' : 'Order saved locally (API unavailable)';
      window.AppUtils.showNotification(message);

    } catch (error) {
      console.error('Error adding order:', error);
      window.AppUtils.showNotification('Error adding order: ' + error.message);
    } finally {
      // Reset button state
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText || 'Add Order';
      }
    }
  }

  getStatusClass(status) {
    if (status === 'pending') return 'order-status pending';
    if (status === 'ongoing') return 'order-status ongoing';
    if (status === 'complete' || status === 'completed') return 'order-status completed';
    return 'order-status';
  }

  createOrderRow(order, index) {
    const row = document.createElement('tr');
    row.className = 'order-row';
    
    const statusClass = this.getStatusClass(order.statusValue).replace('order-status ', '');
    const statusText = order.statusValue ? order.statusValue.charAt(0).toUpperCase() + order.statusValue.slice(1) : '';
    
    row.innerHTML = `
      <td class="customer-cell">${order.name || ''}</td>
      <td class="order-id-cell">#${order.orderId || ''}</td>
      <td class="type-cell">${order.service || ''}</td>
      <td class="date-cell">${window.AppUtils.formatDate(order.dateValue) || ''}</td>
      <td class="status-cell">
        <span class="status-badge ${statusClass}">${statusText}</span>
      </td>
      <td class="amount-cell">
        <div>₱${order.amount || '0'}</div>
        <div style="font-size: 11px; color: #666;">Paid: ₱${order.paid || '0'} | Balance: ₱${order.balance || '0'}</div>
      </td>
      <td class="actions-cell">
        <button class="edit-btn">Edit</button>
        <button class="download-btn">Receipt</button>
      </td>
    `;

    row.querySelector('.download-btn').addEventListener('click', () => {
      this.downloadReceipt(order);
    });

    row.querySelector('.edit-btn').addEventListener('click', () => {
      this.editOrder(order, index);
    });

    return row;
  }

  editOrder(order, index) {
    const editModal = document.getElementById('editOrderModalOverlay');
    if (!editModal) return;

    // Populate the form with current order data
    document.getElementById('editOrderId').value = order.orderId;
    document.getElementById('editCustomerName').value = order.name;
    document.getElementById('editCustomerNumber').value = order.number;
    document.getElementById('editOrderStatus').value = order.statusValue;
    document.getElementById('editTotalAmount').value = order.amount;
    document.getElementById('editAmountPaid').value = order.paid;
    document.getElementById('editBalance').value = order.balance;

    // Show the modal
    editModal.classList.remove('hidden');

    // Store the order data for updating
    this.currentEditingOrder = { order, index };
  }

  downloadReceipt(order) {
    // Generate receipt HTML
    const receiptHTML = this.generateReceiptHTML(order);
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(receiptHTML);
    printWindow.document.close();
    
    // Wait for content to load then print
    printWindow.onload = function() {
      printWindow.print();
      printWindow.close();
    };
    
    window.AppUtils.showNotification(`Receipt for order #${order.orderId} opened for download/print`);
  }

  generateReceiptHTML(order) {
    const currentDate = new Date().toLocaleDateString();
    const currentTime = new Date().toLocaleTimeString();
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - Order #${order.orderId}</title>
        <style>
          body {
            font-family: 'Courier New', monospace;
            max-width: 400px;
            margin: 0 auto;
            padding: 20px;
            background: white;
          }
          .receipt-header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
            margin-bottom: 20px;
          }
          .receipt-title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .receipt-subtitle {
            font-size: 14px;
            margin-bottom: 10px;
          }
          .receipt-info {
            margin-bottom: 20px;
          }
          .receipt-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
          }
          .receipt-row.total {
            border-top: 1px solid #000;
            padding-top: 5px;
            font-weight: bold;
            font-size: 16px;
          }
          .receipt-footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #000;
            font-size: 12px;
          }
          .dashed-line {
            border-top: 1px dashed #000;
            margin: 10px 0;
          }
          @media print {
            body { margin: 0; padding: 10px; }
          }
        </style>
      </head>
      <body>
        <div class="receipt-header">
          <div class="receipt-title">AQUARUSE LAUNDRY</div>
          <div class="receipt-subtitle">Laundry & Dry Cleaning Services</div>
          <div style="font-size: 12px;">Phone: (123) 456-7890</div>
        </div>
        
        <div class="receipt-info">
          <div class="receipt-row">
            <span>Receipt #:</span>
            <span>${order.orderId}</span>
          </div>
          <div class="receipt-row">
            <span>Date:</span>
            <span>${window.AppUtils.formatDate(order.dateValue) || currentDate}</span>
          </div>
          <div class="receipt-row">
            <span>Time:</span>
            <span>${currentTime}</span>
          </div>
          <div class="receipt-row">
            <span>Customer:</span>
            <span>${order.name}</span>
          </div>
          <div class="receipt-row">
            <span>Phone:</span>
            <span>${order.number}</span>
          </div>
        </div>
        
        <div class="dashed-line"></div>
        
        <div class="receipt-info">
          <div class="receipt-row">
            <span>Service:</span>
            <span>${order.service}</span>
          </div>
          <div class="receipt-row">
            <span>Load Count:</span>
            <span>${order.kg || order.load || 0} kg</span>
          </div>
          <div class="receipt-row">
            <span>Status:</span>
            <span>${order.statusValue ? order.statusValue.charAt(0).toUpperCase() + order.statusValue.slice(1) : 'Pending'}</span>
          </div>
        </div>
        
        <div class="dashed-line"></div>
        
        <div class="receipt-info">
          <div class="receipt-row">
            <span>Total Amount:</span>
            <span>₱${order.amount || '0.00'}</span>
          </div>
          <div class="receipt-row">
            <span>Amount Paid:</span>
            <span>₱${order.paid || '0.00'}</span>
          </div>
          <div class="receipt-row total">
            <span>Balance Due:</span>
            <span>₱${order.balance || '0.00'}</span>
          </div>
        </div>
        
        <div class="receipt-footer">
          <p>Thank you for choosing Aquaruse Laundry!</p>
          <p>Please keep this receipt for your records.</p>
          <p>Generated on ${currentDate} at ${currentTime}</p>
        </div>
      </body>
      </html>
    `;
  }

  async loadOrders() {
    // Use unified data system
    await window.AppData.init();
    this.orders = window.AppData.orders || [];
    console.log('Loaded orders from unified data system:', this.orders.length);
  }

  async render() {
    console.log('Orders render called');
    if (!this.ordersList) {
      console.log('Orders list element not found');
      return;
    }

    // Always load fresh data
    await this.loadOrders();

    // Filter orders based on current filter
    let filteredOrders = this.orders || [];
    
    if (this.currentFilter !== 'all') {
      filteredOrders = this.orders.filter(order => 
        order.statusValue === this.currentFilter
      );
    }

    // Apply search filter
    if (this.searchQuery) {
      filteredOrders = window.AppUtils.filterItems(filteredOrders, this.searchQuery, ['name', 'orderId', 'service']);
    }

    if (filteredOrders.length === 0) {
      this.ordersList.innerHTML = '<div class="orders-empty-center">No orders found for this filter.</div>';
      return;
    }

    // Get paginated orders
    const paginatedOrders = window.AppUtils.getPaginatedItems(filteredOrders, this.currentPage, this.itemsPerPage);

    // Create table structure
    const table = document.createElement('table');
    table.className = 'orders-table';
    
    // Create table header
    const thead = document.createElement('thead');
    thead.innerHTML = `
      <tr>
        <th>Customer</th>
        <th>Order ID</th>
        <th>Type</th>
        <th>Date</th>
        <th>Status</th>
        <th>Payment Details</th>
        <th>Actions</th>
      </tr>
    `;
    table.appendChild(thead);

    // Create table body
    const tbody = document.createElement('tbody');
    
    paginatedOrders.forEach((order, idx) => {
      const row = this.createOrderRow(order, idx);
      tbody.appendChild(row);
    });

    table.appendChild(tbody);
    
    this.ordersList.innerHTML = '';
    this.ordersList.appendChild(table);

    // Add pagination
    window.AppUtils.createPagination(
      this.ordersList.parentElement,
      filteredOrders,
      this.currentPage,
      this.itemsPerPage,
      (page) => {
        this.currentPage = page;
        this.render();
      }
    );
  }
}

// Initialize orders module
window.ordersModule = new OrdersModule();