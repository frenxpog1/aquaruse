// Customers Module
class CustomersModule {
  constructor() {
    this.customersList = document.getElementById('customers-list');
    this.currentFilter = 'all';
    this.currentPage = 1;
    this.itemsPerPage = 5;
    this.customers = null; // Will be loaded from API
    this.init();
  }

  init() {
    this.setupFilters();
    this.setupSearch();
    // Force initial render
    setTimeout(() => this.render(), 100);
  }

  setupSearch() {
    window.AppUtils.setupSearch('customers-search', (query) => {
      this.searchQuery = query;
      this.currentPage = 1; // Reset to first page
      this.render();
    });
  }

  setupFilters() {
    // Setup customer filter tabs
    const customerTabs = document.querySelectorAll('.customers-table-header .table-tab');
    customerTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        // Remove active class from all tabs
        customerTabs.forEach(t => t.classList.remove('active'));
        // Add active class to clicked tab
        tab.classList.add('active');
        
        // Set filter based on tab text
        const tabText = tab.textContent.toLowerCase().trim();
        if (tabText.includes('all')) this.currentFilter = 'all';
        else if (tabText === 'inactive') this.currentFilter = 'inactive';
        else if (tabText === 'active') this.currentFilter = 'active';
        
        // Reset to first page when filter changes
        this.currentPage = 1;
        console.log('Filter changed to:', this.currentFilter);
        this.render();
      });
    });
  }

  async loadCustomers() {
    // Use unified data system
    await window.AppData.init();
    this.customers = window.AppData.customers || [];
    console.log('Loaded customers from unified data system:', this.customers.length);
  }

  async render() {
    if (!this.customersList) return;

    // Always load fresh data
    await this.loadCustomers();

    this.customersList.innerHTML = '';

    // Filter customers based on current filter
    let filteredCustomers = this.customers || [];
    
    console.log('All customers:', this.customers);
    console.log('Current filter:', this.currentFilter);
    
    if (this.currentFilter !== 'all') {
      filteredCustomers = this.customers.filter(customer => 
        customer.status === this.currentFilter
      );
    }

    // Apply search filter
    if (this.searchQuery) {
      filteredCustomers = window.AppUtils.filterItems(filteredCustomers, this.searchQuery, ['name', 'number']);
    }
    
    console.log('Filtered customers:', filteredCustomers);

    if (filteredCustomers.length === 0) {
      this.customersList.innerHTML = '<div class="orders-empty-center">No customers found for this filter.</div>';
      return;
    }

    // Get paginated customers
    const paginatedCustomers = window.AppUtils.getPaginatedItems(filteredCustomers, this.currentPage, this.itemsPerPage);

    const table = document.createElement('table');
    table.className = 'customers-table';
    
    const thead = document.createElement('thead');
    thead.innerHTML = `
      <tr>
        <th>Name</th>
        <th>Number</th>
        <th>Status</th>
      </tr>
    `;
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    paginatedCustomers.forEach((customer) => {
      const row = document.createElement('tr');
      const status = customer.status || 'active'; // Default to active if undefined
      const statusClass = status === 'active' ? 'active' : 'pending';
      const statusDisplay = status.charAt(0).toUpperCase() + status.slice(1); // Capitalize first letter
      const daysInfo = customer.daysSinceLastOrder !== undefined ? 
        `<div style="font-size: 11px; color: #666; margin-top: 2px;">${customer.daysSinceLastOrder} days ago</div>` : '';
      
      row.innerHTML = `
        <td>${customer.name || 'Unknown'}</td>
        <td>${customer.number || customer.phone || 'No number'}</td>
        <td>
          <span class="status-badge ${statusClass}">${statusDisplay}</span>
          ${daysInfo}
        </td>
      `;
      tbody.appendChild(row);
    });
    table.appendChild(tbody);
    
    this.customersList.appendChild(table);

    // Add pagination
    window.AppUtils.createPagination(
      this.customersList.parentElement,
      filteredCustomers,
      this.currentPage,
      this.itemsPerPage,
      (page) => {
        this.currentPage = page;
        this.render();
      }
    );
  }
}

// Initialize customers module
window.customersModule = new CustomersModule();