// Supplies Module
class SuppliesModule {
  constructor() {
    this.suppliesList = document.getElementById('supplies-list');
    this.currentFilter = 'all';
    this.currentPage = 1;
    this.itemsPerPage = 3;
    this.supplies = null;
    this.isUpdating = false;
    this.init();
  }

  init() {
    this.setupFilters();
    this.setupSearch();
    // Force initial render
    setTimeout(() => this.render(), 100);
  }

  setupSearch() {
    window.AppUtils.setupSearch('supplies-search', (query) => {
      this.searchQuery = query;
      this.currentPage = 1;
      this.render();
    });
  }

  setupFilters() {
    const suppliesTabs = document.querySelectorAll('.supplies-table-header .table-tab');
    suppliesTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        suppliesTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        const tabText = tab.textContent.toLowerCase().trim();
        if (tabText.includes('all')) this.currentFilter = 'all';
        else if (tabText.includes('low')) this.currentFilter = 'low';
        else if (tabText.includes('full')) this.currentFilter = 'full';
        
        this.currentPage = 1;
        this.render();
      });
    });
  }

  async render() {
    if (!this.suppliesList) return;

    // Ensure data is loaded
    await window.AppData.init();

    this.suppliesList.innerHTML = '';

    // Get fresh supplies data
    const supplies = window.AppData.getSupplies();

    // Check and notify about current stock levels (only when viewing supplies page)
    const suppliesSection = document.getElementById('supplies-section');
    if (suppliesSection && suppliesSection.style.display !== 'none') {
      // Only show notifications if we're actually viewing the supplies page (throttled by hours)
      setTimeout(() => {
        window.AppUtils.checkAndNotifyStockLevels(true); // true = add to panel (but throttled)
      }, 500); // Small delay to avoid notification spam
    }

    // Convert supplies object to array
    let suppliesArray = Object.entries(supplies).map(([name, quantity]) => ({
      name: window.AppUtils.supplyLabels[name] || name,
      quantity: quantity,
      status: window.AppUtils.getStockStatus(quantity)
    }));

    // Filter supplies
    if (this.currentFilter === 'low') {
      suppliesArray = suppliesArray.filter(supply => supply.quantity < 6 && supply.quantity > 0);
    } else if (this.currentFilter === 'full') {
      suppliesArray = suppliesArray.filter(supply => supply.quantity >= 6);
    }

    // Apply search filter
    if (this.searchQuery) {
      suppliesArray = window.AppUtils.filterItems(suppliesArray, this.searchQuery, ['name']);
    }

    if (suppliesArray.length === 0) {
      this.suppliesList.innerHTML = '<div class="orders-empty-center">No supplies found for this filter.</div>';
      return;
    }

    // Get paginated supplies
    const paginatedSupplies = window.AppUtils.getPaginatedItems(suppliesArray, this.currentPage, this.itemsPerPage);

    const table = document.createElement('table');
    table.className = 'supplies-table';
    
    const thead = document.createElement('thead');
    thead.innerHTML = `
      <tr>
        <th>Supply Name</th>
        <th>Quantity</th>
        <th>Status</th>
      </tr>
    `;
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    paginatedSupplies.forEach((supply) => {
      const row = document.createElement('tr');
      
      // Get the original supply key for updating
      const supplyKey = Object.keys(window.AppUtils.supplyLabels).find(key => 
        window.AppUtils.supplyLabels[key] === supply.name
      ) || supply.name.toLowerCase().replace(/\s+/g, '_');
      
      row.innerHTML = `
        <td>${supply.name}</td>
        <td>
          <div class="quantity-controls">
            <button class="quantity-btn decrease-btn" data-supply="${supplyKey}" onclick="window.suppliesModule.changeQuantity('${supplyKey}', -1)">−</button>
            <span class="supply-quantity">${supply.quantity}</span>
            <button class="quantity-btn increase-btn" data-supply="${supplyKey}" onclick="window.suppliesModule.changeQuantity('${supplyKey}', 1)">+</button>
          </div>
        </td>
        <td><span class="supply-status ${supply.status.class}">${supply.status.text}</span></td>
      `;
      tbody.appendChild(row);
    });
    table.appendChild(tbody);
    
    this.suppliesList.appendChild(table);

    // No need for setupQuantityControls since we're using onclick handlers

    // Add pagination
    window.AppUtils.createPagination(
      this.suppliesList.parentElement,
      suppliesArray,
      this.currentPage,
      this.itemsPerPage,
      (page) => {
        this.currentPage = page;
        this.render();
      }
    );
  }

  // Removed setupQuantityControls method - using onclick handlers instead

  changeQuantity(supplyKey, change) {
    // Prevent rapid multiple clicks
    if (this.isUpdating) {
      console.log('Update already in progress, ignoring click');
      return;
    }
    
    this.isUpdating = true;
    
    const currentSupplies = window.AppData.getSupplies();
    // Ensure currentQuantity is a number, not a string
    const currentQuantity = parseInt(currentSupplies[supplyKey]) || 0;
    // Ensure change is a number
    const changeAmount = parseInt(change);
    const newQuantity = Math.max(0, currentQuantity + changeAmount);
    
    console.log(`Changing ${supplyKey} from ${currentQuantity} to ${newQuantity} (change: ${changeAmount})`);
    
    // Update the supply
    const updatedSupplies = { ...currentSupplies };
    updatedSupplies[supplyKey] = newQuantity;
    
    window.AppData.updateSupplies(updatedSupplies);
    
    // Show notification
    const supplyName = window.AppUtils.supplyLabels[supplyKey] || supplyKey;
    window.AppUtils.showNotification(`${supplyName}: ${currentQuantity} → ${newQuantity}`, 'info');
    
    // Re-render to show updated quantity
    this.render();
    
    // Also update dashboard if it's visible
    if (window.dashboardModule) {
      window.dashboardModule.renderSupplyList();
    }
    
    // Reset the flag after a short delay
    setTimeout(() => {
      this.isUpdating = false;
    }, 300);
  }
}

// Initialize supplies module
window.suppliesModule = new SuppliesModule();