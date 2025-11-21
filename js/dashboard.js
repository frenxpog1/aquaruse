// Dashboard Module
class DashboardModule {
  constructor() {
    this.ordersTable = document.getElementById('dashboard-orders-table');
    this.supplyTable = document.getElementById('dashboard-supply-table');
    this.balanceAmount = document.getElementById('balance-amount');
    this.unpaidAmount = document.getElementById('unpaid-amount');
    this.currentOrdersFilter = 'all';
    this.currentSupplyFilter = 'all';
    this.currentOrdersPage = 1;
    this.ordersPerPage = 3;
    this.currentSupplyPage = 1;
    this.suppliesPerPage = 3;
    this.init();
  }

  init() {
    this.setupFilters();
    this.setupSearch();
    // Force initial render
    setTimeout(() => this.render(), 100);
  }

  setupSearch() {
    window.AppUtils.setupSearch('dashboard-search', (query) => {
      this.searchQuery = query;
      this.renderOrdersTable();
    });
  }

  setupFilters() {
    // Orders filter tabs
    const orderTabs = document.querySelectorAll('#dashboard-section .orders-table-header .table-tab');
    orderTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        orderTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        const tabText = tab.textContent.toLowerCase().trim();
        if (tabText.includes('all')) this.currentOrdersFilter = 'all';
        else if (tabText.includes('pending')) this.currentOrdersFilter = 'pending';
        else if (tabText.includes('ongoing')) this.currentOrdersFilter = 'ongoing';
        else if (tabText.includes('completed')) this.currentOrdersFilter = 'completed';
        
        this.currentOrdersPage = 1; // Reset to first page when filter changes
        this.renderOrdersTable();
      });
    });

    // Supply filter tabs
    const supplyTabs = document.querySelectorAll('#dashboard-section .supply-tab');
    supplyTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        supplyTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        const tabText = tab.textContent.toLowerCase().trim();
        if (tabText.includes('all')) this.currentSupplyFilter = 'all';
        else if (tabText.includes('low')) this.currentSupplyFilter = 'low';
        else if (tabText.includes('full')) this.currentSupplyFilter = 'full';
        
        this.currentSupplyPage = 1; // Reset to first page when filter changes
        this.renderSupplyList();
      });
    });
  }

  async render() {
    // Ensure data is loaded
    await window.AppData.init();
    
    await this.renderBalanceCards();
    await this.renderOrdersTable();
    this.renderSupplyList();
    
    // Check stock levels when dashboard loads (throttled to prevent spam)
    setTimeout(() => {
      window.AppUtils.checkAndNotifyStockLevels(true); // true = add to internal notifications panel (but throttled by hours)
    }, 1000);
  }

  async renderBalanceCards() {
    try {
      // Calculate totals from orders data
      const orders = window.AppData.orders || [];
      
      console.log('Dashboard: Calculating balance from', orders.length, 'orders');
      
      let totalIncome = 0;
      let totalReceivable = 0;
      
      orders.forEach((order, index) => {
        const amount = parseFloat(order.amount) || 0;
        const paid = parseFloat(order.paid) || 0;
        const balance = parseFloat(order.balance) || 0;
        
        console.log(`Order ${index + 1} (${order.orderId}): amount=${amount}, paid=${paid}, balance=${balance}`);
        
        totalIncome += paid;
        totalReceivable += balance;
      });

      console.log('Dashboard: Total income calculated:', totalIncome);
      console.log('Dashboard: Total receivable calculated:', totalReceivable);

      if (this.balanceAmount) {
        this.balanceAmount.textContent = `₱${totalIncome.toLocaleString()}`;
      }
      
      if (this.unpaidAmount) {
        this.unpaidAmount.textContent = `₱${totalReceivable.toLocaleString()}`;
      }
    } catch (error) {
      console.error('Error rendering balance cards:', error);
    }
  }

  async renderOrdersTable() {
    if (!this.ordersTable) return;

    try {
      // Get orders data
      let orders = window.AppData.orders || [];
      
      // Filter orders
      if (this.currentOrdersFilter !== 'all') {
        orders = orders.filter(order => order.statusValue === this.currentOrdersFilter);
      }

      // Apply search filter
      if (this.searchQuery) {
        orders = window.AppUtils.filterItems(orders, this.searchQuery, ['name', 'orderId', 'service']);
      }

      // Store all filtered orders for pagination
      const allFilteredOrders = [...orders];

      // Get paginated orders for dashboard
      const paginatedOrders = window.AppUtils.getPaginatedItems(orders, this.currentOrdersPage, this.ordersPerPage);
      orders = paginatedOrders;

      if (orders.length === 0) {
        this.ordersTable.innerHTML = '<div class="orders-empty-center">No orders found.</div>';
        return;
      }

      const table = document.createElement('table');
      table.className = 'orders-table';
      
      const thead = document.createElement('thead');
      thead.innerHTML = `
        <tr>
          <th>Customer</th>
          <th>Order ID</th>
          <th>Type</th>
          <th>Date</th>
          <th>Status</th>
          <th>Amount</th>
        </tr>
      `;
      table.appendChild(thead);

      const tbody = document.createElement('tbody');
      orders.forEach((order) => {
        const row = document.createElement('tr');
        const statusClass = order.statusValue === 'completed' ? 'completed' : 
                           order.statusValue === 'ongoing' ? 'ongoing' : 'pending';
        const statusText = order.statusValue ? 
          order.statusValue.charAt(0).toUpperCase() + order.statusValue.slice(1) : 'Pending';
        
        row.innerHTML = `
          <td class="customer-cell">${order.name || ''}</td>
          <td class="order-id-cell">#${order.orderId || ''}</td>
          <td class="type-cell">${order.service || ''}</td>
          <td class="date-cell">${window.AppUtils.formatDate(order.dateValue) || ''}</td>
          <td class="status-cell">
            <span class="status-badge ${statusClass}">${statusText}</span>
          </td>
          <td class="amount-cell">₱${order.amount || '0'}</td>
        `;
        tbody.appendChild(row);
      });
      table.appendChild(tbody);
      
      this.ordersTable.innerHTML = '';
      this.ordersTable.appendChild(table);

      // Add pagination for dashboard orders
      console.log('Creating dashboard orders pagination:', {
        container: this.ordersTable.parentElement,
        totalItems: allFilteredOrders.length,
        currentPage: this.currentOrdersPage,
        itemsPerPage: this.ordersPerPage
      });

      window.AppUtils.createPagination(
        this.ordersTable.parentElement,
        allFilteredOrders,
        this.currentOrdersPage,
        this.ordersPerPage,
        (page) => {
          console.log('Dashboard orders pagination callback called with page:', page);
          this.currentOrdersPage = page;
          this.renderOrdersTable();
        }
      );

    } catch (error) {
      console.error('Error rendering orders table:', error);
      this.ordersTable.innerHTML = '<div class="orders-empty-center">Error loading orders.</div>';
    }
  }

  renderSupplyList() {
    if (!this.supplyTable) return;

    try {
      // Get fresh supplies data
      const supplies = window.AppData.getSupplies();
      
      // Convert to array and filter
      let suppliesArray = Object.entries(supplies).map(([name, quantity]) => ({
        name: window.AppUtils.supplyLabels[name] || name,
        quantity: quantity,
        status: window.AppUtils.getStockStatus(quantity)
      }));

      // Filter supplies
      if (this.currentSupplyFilter === 'low') {
        suppliesArray = suppliesArray.filter(supply => supply.quantity < 6 && supply.quantity > 0);
      } else if (this.currentSupplyFilter === 'full') {
        suppliesArray = suppliesArray.filter(supply => supply.quantity >= 6);
      }

      // Store all filtered supplies for pagination
      const allFilteredSupplies = [...suppliesArray];

      // Get paginated supplies for dashboard
      const paginatedSupplies = window.AppUtils.getPaginatedItems(suppliesArray, this.currentSupplyPage, this.suppliesPerPage);
      suppliesArray = paginatedSupplies;

      if (suppliesArray.length === 0) {
        this.supplyTable.innerHTML = '<div class="orders-empty-center">No supplies found.</div>';
        return;
      }

      const table = document.createElement('table');
      table.className = 'supply-table';
      
      const thead = document.createElement('thead');
      thead.innerHTML = `
        <tr>
          <th>Supply</th>
          <th>Qty</th>
          <th>Status</th>
        </tr>
      `;
      table.appendChild(thead);

      const tbody = document.createElement('tbody');
      suppliesArray.forEach((supply) => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${supply.name}</td>
          <td><span class="supply-quantity">${supply.quantity}</span></td>
          <td><span class="supply-status ${supply.status.class}">${supply.status.text}</span></td>
        `;
        tbody.appendChild(row);
      });
      table.appendChild(tbody);
      
      this.supplyTable.innerHTML = '';
      this.supplyTable.appendChild(table);

      // Add pagination for dashboard supplies
      console.log('Creating dashboard supplies pagination:', {
        container: this.supplyTable.parentElement,
        totalItems: allFilteredSupplies.length,
        currentPage: this.currentSupplyPage,
        itemsPerPage: this.suppliesPerPage
      });

      window.AppUtils.createPagination(
        this.supplyTable.parentElement,
        allFilteredSupplies,
        this.currentSupplyPage,
        this.suppliesPerPage,
        (page) => {
          console.log('Dashboard supplies pagination callback called with page:', page);
          this.currentSupplyPage = page;
          this.renderSupplyList();
        }
      );

    } catch (error) {
      console.error('Error rendering supply list:', error);
      this.supplyTable.innerHTML = '<div class="orders-empty-center">Error loading supplies.</div>';
    }
  }
}

// Initialize dashboard module
window.dashboardModule = new DashboardModule();