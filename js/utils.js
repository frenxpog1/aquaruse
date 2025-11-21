// Shared Utilities and Constants
window.AppUtils = {
    // Service prices
    servicePrices: {
        'Regular Laundry': 60,
        'Wash and Fold': 65,
        'Dry Cleaning': 250,
        'Iron and Press': 70
    },

    // Supply consumption per service
    supplyConsumption: {
        'Regular Laundry': { detergent: 1, softener: 1, bleach: 1, fragrance: 1, stain_remover: 1, steam_water: 0, garment_bag: 0 },
        'Wash and Fold': { detergent: 1, softener: 1, bleach: 1, fragrance: 1, stain_remover: 1, steam_water: 0, garment_bag: 1 },
        'Dry Cleaning': { detergent: 0, softener: 0, bleach: 0, fragrance: 1, stain_remover: 1, steam_water: 0, garment_bag: 1 },
        'Iron and Press': { detergent: 0, softener: 0, bleach: 0, fragrance: 1, stain_remover: 0, steam_water: 1, garment_bag: 0 }
    },

    // Supply labels
    supplyLabels: {
        detergent: 'Detergent',
        softener: 'Softener',
        bleach: 'Bleach',
        fragrance: 'Fragrance',
        stain_remover: 'Stain Remover',
        steam_water: 'Steam Water',
        garment_bag: 'Garment Bag'
    },

    // Format date utility
    formatDate(inputDate) {
        if (!inputDate) return '';
        const date = new Date(inputDate);
        const options = { month: 'long', day: '2-digit', year: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    },

    // Get status class and text
    getStatusClassAndText(statusValue) {
        if (statusValue === 'pending') return { class: 'pending', text: 'Pending' };
        if (statusValue === 'ongoing') return { class: 'ongoing', text: 'Ongoing' };
        if (statusValue === 'complete') return { class: 'completed', text: 'Complete' };
        return { class: 'pending', text: 'Pending' };
    },

    // Get stock status
    getStockStatus(qty) {
        if (qty >= 6) return { text: 'In Stock', class: 'in-stock' };
        if (qty >= 1) return { text: 'Low Stock', class: 'low-stock' };
        return { text: 'No Stock', class: 'no-stock' };
    },

    // Modal utilities
    setupModalClose(modalOverlay) {
        if (!modalOverlay) return;

        // Close on overlay click
        modalOverlay.addEventListener('click', function (e) {
            if (e.target === modalOverlay) {
                modalOverlay.classList.add('hidden');
            }
        });
    },

    // Setup global escape key handler for all modals
    setupGlobalModalClose() {
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                // Close all visible modals
                const modals = document.querySelectorAll('.modal-overlay');
                modals.forEach(modal => {
                    if (!modal.classList.contains('hidden')) {
                        modal.classList.add('hidden');
                    }
                });
            }
        });
    },

    // Generate unique ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // Show notification - optimized and clean
    showNotification(message, type = 'info') {
        // Create notification container if it doesn't exist
        let notificationContainer = document.getElementById('notification-container');
        if (!notificationContainer) {
            notificationContainer = document.createElement('div');
            notificationContainer.id = 'notification-container';
            notificationContainer.className = 'notification-container';
            document.body.appendChild(notificationContainer);
        }

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        // Clean text-only notification without logos or icons
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-message">${message}</div>
                <button class="notification-close" aria-label="Close notification">&times;</button>
            </div>
        `;

        // Add to container (prepend to show newest first)
        notificationContainer.insertBefore(notification, notificationContainer.firstChild);

        // Auto remove after 3 seconds (reduced for better UX)
        const autoRemove = setTimeout(() => {
            this.removeNotification(notification);
        }, 3000);

        // Manual close button
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            clearTimeout(autoRemove);
            this.removeNotification(notification);
        });

        // Slide in animation
        requestAnimationFrame(() => {
            notification.classList.add('notification-show');
        });
    },

    // Helper method to remove notifications
    removeNotification(notification) {
        if (notification && notification.parentElement) {
            notification.classList.remove('notification-show');
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }
    },

    // Pagination utility
    createPagination(container, items, currentPage, itemsPerPage, onPageChange) {
        const totalPages = Math.ceil(items.length / itemsPerPage);
        
        if (totalPages <= 1) {
            // Remove existing pagination if not needed
            const existingPagination = container.querySelector('.supply-pagination');
            if (existingPagination) {
                existingPagination.remove();
            }
            return;
        }

        // Remove existing pagination
        const existingPagination = container.querySelector('.supply-pagination');
        if (existingPagination) {
            existingPagination.remove();
        }

        const pagination = document.createElement('div');
        pagination.className = 'supply-pagination';

        let paginationHTML = '<div class="supply-pagination-info supply-prev">← Previous</div><div class="supply-pagination-controls">';
        
        // Show all page numbers (since we have 3 items per page, there won't be too many pages)
        for (let i = 1; i <= totalPages; i++) {
            const activeClass = i === currentPage ? ' active' : '';
            paginationHTML += `<div class="supply-pagination-btn${activeClass}" data-page="${i}">${i}</div>`;
        }
        
        paginationHTML += '</div><div class="supply-pagination-info supply-next">Next →</div>';
        pagination.innerHTML = paginationHTML;
        
        container.appendChild(pagination);

        // Add event listeners with better error handling
        pagination.querySelectorAll('.supply-pagination-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const page = parseInt(btn.dataset.page);
                console.log('Pagination button clicked:', page, 'Current page:', currentPage);
                if (page && page !== currentPage && onPageChange) {
                    onPageChange(page);
                }
            });
        });

        const prevBtn = pagination.querySelector('.supply-prev');
        if (prevBtn) {
            prevBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Previous button clicked, current page:', currentPage);
                if (currentPage > 1 && onPageChange) {
                    onPageChange(currentPage - 1);
                }
            });
        }

        const nextBtn = pagination.querySelector('.supply-next');
        if (nextBtn) {
            nextBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Next button clicked, current page:', currentPage, 'total pages:', totalPages);
                if (currentPage < totalPages && onPageChange) {
                    onPageChange(currentPage + 1);
                }
            });
        }
    },

    // Get paginated items
    getPaginatedItems(items, currentPage, itemsPerPage) {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return items.slice(startIndex, startIndex + itemsPerPage);
    },

    // Search functionality
    setupSearch(searchInputId, searchCallback) {
        const searchInput = document.getElementById(searchInputId);
        if (!searchInput) return;

        let searchTimeout;
        
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const query = e.target.value.toLowerCase().trim();
                searchCallback(query);
            }, 300); // Debounce search
        });

        // Clear search on escape
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                searchInput.value = '';
                searchCallback('');
            }
        });
    },

    // Generic search filter function
    filterItems(items, query, searchFields) {
        if (!query) return items;
        
        return items.filter(item => {
            return searchFields.some(field => {
                const value = item[field];
                if (typeof value === 'string') {
                    return value.toLowerCase().includes(query);
                }
                if (typeof value === 'number') {
                    return value.toString().includes(query);
                }
                return false;
            });
        });
    },

    // Check if supplies are sufficient for an order
    checkSupplySufficiency(serviceType, loadCount) {
        const consumption = this.supplyConsumption[serviceType];
        if (!consumption) return { sufficient: true, shortages: [] };

        const shortages = [];
        
        // Check each supply requirement
        for (const [supply, perKgConsumption] of Object.entries(consumption)) {
            if (perKgConsumption > 0) {
                const totalNeeded = perKgConsumption * loadCount;
                const available = window.AppData.supplies[supply] || 0;
                
                if (available < totalNeeded) {
                    shortages.push({
                        supply: this.supplyLabels[supply] || supply,
                        needed: totalNeeded,
                        available: available,
                        shortage: totalNeeded - available
                    });
                }
            }
        }

        return {
            sufficient: shortages.length === 0,
            shortages: shortages
        };
    },

    // Consume supplies for an order
    consumeSupplies(serviceType, loadCount) {
        const consumption = this.supplyConsumption[serviceType];
        if (!consumption) return false;

        // First check if we have enough supplies
        const check = this.checkSupplySufficiency(serviceType, loadCount);
        if (!check.sufficient) return false;

        const lowStockSupplies = [];
        const outOfStockSupplies = [];

        // Consume the supplies and track stock levels
        for (const [supply, perKgConsumption] of Object.entries(consumption)) {
            if (perKgConsumption > 0) {
                const totalNeeded = perKgConsumption * loadCount;
                const currentAmount = window.AppData.supplies[supply] || 0;
                const newAmount = Math.max(0, currentAmount - totalNeeded);
                window.AppData.supplies[supply] = newAmount;
                
                console.log(`Consumed ${totalNeeded} ${supply}, remaining: ${newAmount}`);
                
                // Check if supply is now low or out of stock
                const supplyName = this.supplyLabels[supply] || supply;
                if (newAmount === 0) {
                    outOfStockSupplies.push(supplyName);
                } else if (newAmount < 6 && newAmount >= 1) {
                    lowStockSupplies.push(supplyName);
                }
            }
        }

        // Save the updated supplies
        window.AppData.save();
        
        // Also try to update supplies in database via API
        this.updateSuppliesInDatabase();
        
        // Show stock notifications
        this.showStockNotifications(lowStockSupplies, outOfStockSupplies);
        
        return true;
    },

    // Show stock level notifications
    showStockNotifications(lowStockSupplies, outOfStockSupplies) {
        // Show out of stock notifications first (more critical)
        if (outOfStockSupplies.length > 0) {
            const message = outOfStockSupplies.length === 1 
                ? `${outOfStockSupplies[0]} is now out of stock!`
                : `${outOfStockSupplies.length} supplies are now out of stock: ${outOfStockSupplies.join(', ')}`;
            
            // Add to internal notifications panel (critical)
            this.addInternalNotification('alerts', 'Critical Stock Alert', message, '🚨');
            
            // Also show toast for immediate attention
            this.showNotification(message, 'error');
        }
        
        // Show low stock notifications
        if (lowStockSupplies.length > 0) {
            const message = lowStockSupplies.length === 1 
                ? `${lowStockSupplies[0]} is now low stock (less than 6 units)`
                : `${lowStockSupplies.length} supplies are now low stock: ${lowStockSupplies.join(', ')}`;
            
            // Add to internal notifications panel (important)
            this.addInternalNotification('alerts', 'Low Stock Alert', message, '⚠️');
            
            // Also show toast for immediate attention
            this.showNotification(message, 'warning');
        }
    },

    // Add notification to internal notifications panel
    addInternalNotification(type, title, message, icon = '🔔') {
        // Check if the app's addNotification method is available
        if (window.laundryApp && typeof window.laundryApp.addNotification === 'function') {
            window.laundryApp.addNotification(type, title, message, icon);
        } else {
            // Fallback: add directly to localStorage if app not available
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
            
            // Update badge if possible
            if (window.laundryApp && typeof window.laundryApp.updateNotificationBadge === 'function') {
                window.laundryApp.updateNotificationBadge();
            }
        }
    },

    // Check current stock levels and show notifications if needed
    checkAndNotifyStockLevels(addToPanel = false) {
        // Quick throttle to prevent multiple calls in short succession
        const now = Date.now();
        if (this.lastStockCheck && (now - this.lastStockCheck) < 5000) {
            return; // Don't check more than once every 5 seconds
        }
        this.lastStockCheck = now;

        const supplies = window.AppData.getSupplies();
        const lowStockSupplies = [];
        const outOfStockSupplies = [];

        for (const [supply, quantity] of Object.entries(supplies)) {
            const supplyName = this.supplyLabels[supply] || supply;
            if (quantity === 0) {
                outOfStockSupplies.push(supplyName);
            } else if (quantity < 6 && quantity >= 1) {
                lowStockSupplies.push(supplyName);
            }
        }

        // Only show notifications if there are issues
        if (lowStockSupplies.length > 0 || outOfStockSupplies.length > 0) {
            if (addToPanel) {
                // Check if we should notify about stock issues (throttled by hours)
                if (this.shouldNotifyStockIssues(lowStockSupplies, outOfStockSupplies)) {
                    // Add to internal notifications panel for persistent tracking
                    if (outOfStockSupplies.length > 0) {
                        const message = outOfStockSupplies.length === 1 
                            ? `${outOfStockSupplies[0]} is out of stock`
                            : `${outOfStockSupplies.length} supplies are out of stock: ${outOfStockSupplies.join(', ')}`;
                        this.addInternalNotification('alerts', 'Stock Alert', message, '🚨');
                    }
                    
                    if (lowStockSupplies.length > 0) {
                        const message = lowStockSupplies.length === 1 
                            ? `${lowStockSupplies[0]} is running low (${supplies[Object.keys(this.supplyLabels).find(key => this.supplyLabels[key] === lowStockSupplies[0])]} units left)`
                            : `${lowStockSupplies.length} supplies are running low: ${lowStockSupplies.join(', ')}`;
                        this.addInternalNotification('alerts', 'Low Stock Alert', message, '⚠️');
                    }
                    
                    // Update last notification time
                    this.updateStockNotificationTime(lowStockSupplies, outOfStockSupplies);
                }
            } else {
                // Just show toast notifications (these are immediate, not throttled)
                this.showStockNotifications(lowStockSupplies, outOfStockSupplies);
            }
        }
    },

    // Check if we should notify about stock issues (throttled by hours)
    shouldNotifyStockIssues(lowStockSupplies, outOfStockSupplies) {
        const NOTIFICATION_INTERVAL = 4 * 60 * 60 * 1000; // 4 hours in milliseconds
        const now = Date.now();
        
        // Get last notification times from localStorage
        const lastNotifications = JSON.parse(localStorage.getItem('stockNotificationTimes') || '{}');
        
        // Create a signature for current stock issues
        const currentIssues = [...outOfStockSupplies.map(s => `out:${s}`), ...lowStockSupplies.map(s => `low:${s}`)].sort().join(',');
        
        // Check if we've notified about these exact issues recently
        const lastNotificationTime = lastNotifications[currentIssues] || 0;
        const timeSinceLastNotification = now - lastNotificationTime;
        
        // Only notify if it's been more than 4 hours since last notification for these specific issues
        return timeSinceLastNotification > NOTIFICATION_INTERVAL;
    },

    // Update the last notification time for current stock issues
    updateStockNotificationTime(lowStockSupplies, outOfStockSupplies) {
        const now = Date.now();
        const lastNotifications = JSON.parse(localStorage.getItem('stockNotificationTimes') || '{}');
        
        // Create a signature for current stock issues
        const currentIssues = [...outOfStockSupplies.map(s => `out:${s}`), ...lowStockSupplies.map(s => `low:${s}`)].sort().join(',');
        
        // Update the notification time for these issues
        lastNotifications[currentIssues] = now;
        
        // Clean up old entries (keep only last 20 to prevent localStorage bloat)
        const entries = Object.entries(lastNotifications);
        if (entries.length > 20) {
            const sortedEntries = entries.sort((a, b) => b[1] - a[1]); // Sort by time, newest first
            const cleanedNotifications = Object.fromEntries(sortedEntries.slice(0, 20));
            localStorage.setItem('stockNotificationTimes', JSON.stringify(cleanedNotifications));
        } else {
            localStorage.setItem('stockNotificationTimes', JSON.stringify(lastNotifications));
        }
        
        console.log(`Stock notification time updated for: ${currentIssues}`);
    },

    // Force check stock levels and show notifications (bypasses throttling)
    forceCheckStockLevels() {
        const supplies = window.AppData.getSupplies();
        const lowStockSupplies = [];
        const outOfStockSupplies = [];

        for (const [supply, quantity] of Object.entries(supplies)) {
            const supplyName = this.supplyLabels[supply] || supply;
            if (quantity === 0) {
                outOfStockSupplies.push(supplyName);
            } else if (quantity < 6 && quantity >= 1) {
                lowStockSupplies.push(supplyName);
            }
        }

        if (lowStockSupplies.length > 0 || outOfStockSupplies.length > 0) {
            // Force add to internal notifications panel
            if (outOfStockSupplies.length > 0) {
                const message = outOfStockSupplies.length === 1 
                    ? `${outOfStockSupplies[0]} is out of stock`
                    : `${outOfStockSupplies.length} supplies are out of stock: ${outOfStockSupplies.join(', ')}`;
                this.addInternalNotification('alerts', 'Stock Alert', message, '🚨');
            }
            
            if (lowStockSupplies.length > 0) {
                const message = lowStockSupplies.length === 1 
                    ? `${lowStockSupplies[0]} is running low`
                    : `${lowStockSupplies.length} supplies are running low: ${lowStockSupplies.join(', ')}`;
                this.addInternalNotification('alerts', 'Low Stock Alert', message, '⚠️');
            }
            
            // Also show toast notifications
            this.showStockNotifications(lowStockSupplies, outOfStockSupplies);
            
            // Update notification time
            this.updateStockNotificationTime(lowStockSupplies, outOfStockSupplies);
            
            return { lowStockSupplies, outOfStockSupplies };
        } else {
            this.showNotification('All supplies are adequately stocked', 'success');
            return { lowStockSupplies: [], outOfStockSupplies: [] };
        }
    },

    // Get time until next stock notification is allowed
    getTimeUntilNextStockNotification() {
        const NOTIFICATION_INTERVAL = 4 * 60 * 60 * 1000; // 4 hours
        const now = Date.now();
        const lastNotifications = JSON.parse(localStorage.getItem('stockNotificationTimes') || '{}');
        
        // Get the most recent notification time
        const lastNotificationTime = Math.max(...Object.values(lastNotifications), 0);
        const timeSinceLastNotification = now - lastNotificationTime;
        const timeUntilNext = NOTIFICATION_INTERVAL - timeSinceLastNotification;
        
        if (timeUntilNext <= 0) {
            return 0; // Can notify now
        }
        
        // Return time in hours and minutes
        const hours = Math.floor(timeUntilNext / (60 * 60 * 1000));
        const minutes = Math.floor((timeUntilNext % (60 * 60 * 1000)) / (60 * 1000));
        
        return { hours, minutes, milliseconds: timeUntilNext };
    },

    // Update supplies in database
    async updateSuppliesInDatabase() {
        try {
            for (const [supply, quantity] of Object.entries(window.AppData.supplies)) {
                await window.apiService.put('update_supply', {
                    name: supply,
                    quantity: quantity
                });
            }
        } catch (error) {
            console.warn('Could not update supplies in database:', error.message);
        }
    },

    // Format shortage message
    formatShortageMessage(shortages) {
        const messages = shortages.map(shortage => 
            `${shortage.supply}: Need ${shortage.needed}, have ${shortage.available} (short ${shortage.shortage})`
        );
        return `Insufficient supplies:\n${messages.join('\n')}`;
    }
};

// Global data store with unified data management
window.AppData = {
    orders: [],
    customers: [],
    staff: [],
    supplies: {
        detergent: 15,
        softener: 15,
        bleach: 15,
        fragrance: 15,
        stain_remover: 15,
        steam_water: 15,
        garment_bag: 15
    },
    orderIdCounter: 1,
    isLoaded: false,

    // Initialize data from API or localStorage
    async init() {
        if (this.isLoaded) return;
        
        console.log('Initializing AppData...');
        
        // Check if data was recently cleared
        const dataWasCleared = localStorage.getItem('dataCleared') === 'true' || window.dataCleared;
        
        if (dataWasCleared) {
            console.log('Data was cleared, starting with default supplies');
            this.orders = [];
            this.customers = [];
            this.staff = [];
            // Start with default supply values, not 0
            this.supplies = {
                detergent: 15,
                softener: 15,
                bleach: 15,
                fragrance: 15,
                stain_remover: 15,
                steam_water: 15,
                garment_bag: 15
            };
            this.orderIdCounter = 1;
        } else {
            // Try to load from API first
            try {
                await this.loadFromAPI();
                
                // Only load from localStorage if API didn't provide data
                if (this.orders.length === 0 && this.staff.length === 0) {
                    console.log('No API data found, loading from localStorage');
                    this.loadFromLocalStorage();
                }
            } catch (error) {
                console.warn('API load failed, using localStorage:', error.message);
                this.loadFromLocalStorage();
            }
        }
        
        // Clean up any duplicate orders
        this.removeDuplicateOrders();
        
        // Normalize order data
        this.normalizeOrderData();
        
        // Generate customers from orders
        this.generateCustomersFromOrders();
        
        this.isLoaded = true;
        console.log('AppData initialized:', {
            orders: this.orders.length,
            customers: this.customers.length,
            staff: this.staff.length,
            supplies: Object.keys(this.supplies).length
        });
    },

    // Load data from API
    async loadFromAPI() {
        if (!window.apiService) {
            console.log('No API service available, skipping API load');
            return;
        }

        console.log('Loading data from API...');
        
        try {
            const [ordersResult, customersResult, suppliesResult, staffResult] = await Promise.allSettled([
                window.apiService.get('orders'),
                window.apiService.get('customers'),
                window.apiService.get('supplies'),
                window.apiService.get('staff')
            ]);

            let apiDataLoaded = false;

            // Process orders
            if (ordersResult.status === 'fulfilled' && ordersResult.value && ordersResult.value.success) {
                this.orders = ordersResult.value.data.map(order => ({
                    orderId: order.order_id,
                    name: order.name,
                    dateValue: order.DATE,
                    service: order.service_type,
                    kg: order.kg,
                    amount: order.total_amount,
                    paid: order.amount_paid,
                    balance: order.balance,
                    statusValue: order.status,
                    number: order.number
                }));
                apiDataLoaded = true;
                console.log('Loaded orders from API:', this.orders.length);
            }

            // Process customers - but generate from orders instead
            // We'll generate customers from orders, not load from API
            
            // Process supplies - ALWAYS use localStorage, NEVER API
            // Supplies are managed locally and should not be overwritten by API
            const localData = localStorage.getItem('laundryAppData');
            let suppliesLoaded = false;
            
            if (localData) {
                try {
                    const parsed = JSON.parse(localData);
                    if (parsed.supplies) {
                        this.supplies = parsed.supplies;
                        suppliesLoaded = true;
                        console.log('Loaded supplies from localStorage:', Object.keys(this.supplies).length);
                    }
                } catch (e) {
                    console.warn('Error parsing localStorage for supplies:', e);
                }
            }
            
            // If no localStorage supplies, initialize with default values (not from API)
            if (!suppliesLoaded) {
                this.supplies = {
                    detergent: 15,
                    softener: 15,
                    bleach: 15,
                    fragrance: 15,
                    stain_remover: 15,
                    steam_water: 15,
                    garment_bag: 15
                };
                console.log('Initialized supplies with default values');
            }
            
            // Ensure all required supplies exist
            const requiredSupplies = ['detergent', 'softener', 'bleach', 'fragrance', 'stain_remover', 'steam_water', 'garment_bag'];
            
            for (const key of requiredSupplies) {
                if (!(key in this.supplies)) {
                    this.supplies[key] = 15; // Default value for missing supplies
                }
            }

            // Process staff
            if (staffResult.status === 'fulfilled' && staffResult.value && staffResult.value.success) {
                this.staff = staffResult.value.data;
                console.log('Loaded staff from API:', this.staff.length);
            }

            // Only save to localStorage if we got API data
            if (apiDataLoaded) {
                this.saveToLocalStorage();
                console.log('API data saved to localStorage as backup');
            }
            
        } catch (error) {
            console.error('Error loading from API:', error);
            throw error;
        }
    },

    // Load data from localStorage
    loadFromLocalStorage() {
        const saved = localStorage.getItem('laundryAppData');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                // Only load from localStorage if we don't already have data from API
                if (this.orders.length === 0) {
                    this.orders = data.orders || [];
                }
                if (this.customers.length === 0) {
                    this.customers = data.customers || [];
                }
                if (this.staff.length === 0) {
                    this.staff = data.staff || [];
                }
                
                // Only merge supplies if we have saved supplies data
                if (data.supplies) {
                    // Ensure all supply quantities are numbers, not strings
                    const parsedSupplies = {};
                    for (const [key, value] of Object.entries(data.supplies)) {
                        parsedSupplies[key] = parseInt(value) || 0;
                    }
                    this.supplies = { ...this.supplies, ...parsedSupplies };
                }
                
                this.orderIdCounter = data.orderIdCounter || 1;
            } catch (error) {
                console.error('Error loading from localStorage:', error);
            }
        }
    },

    // Save data to localStorage
    saveToLocalStorage() {
        try {
            localStorage.setItem('laundryAppData', JSON.stringify({
                orders: this.orders,
                customers: this.customers,
                staff: this.staff,
                supplies: this.supplies,
                orderIdCounter: this.orderIdCounter
            }));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    },

    // Legacy save method for backward compatibility
    save() {
        this.saveToLocalStorage();
    },

    // Legacy load method for backward compatibility
    load() {
        this.loadFromLocalStorage();
    },

    // Force refresh data from API
    async refresh() {
        this.isLoaded = false;
        await this.init();
        
        // Notify all modules to re-render
        if (window.dashboardModule) window.dashboardModule.render();
        if (window.suppliesModule) window.suppliesModule.render();
        if (window.ordersModule) window.ordersModule.render();
        if (window.customersModule) window.customersModule.render();
        if (window.staffModule) window.staffModule.render();
    },

    // Refresh customers from current orders
    refreshCustomers() {
        this.generateCustomersFromOrders();
        if (window.customersModule) {
            window.customersModule.render();
        }
    },

    // Get supplies data (always returns current state)
    getSupplies() {
        // Ensure all quantities are numbers, not strings
        const supplies = {};
        for (const [key, value] of Object.entries(this.supplies)) {
            supplies[key] = parseInt(value) || 0;
        }
        return supplies;
    },

    // Remove duplicate orders based on orderId
    removeDuplicateOrders() {
        const seen = new Set();
        this.orders = this.orders.filter(order => {
            if (seen.has(order.orderId)) {
                console.log('Removing duplicate order:', order.orderId);
                return false;
            }
            seen.add(order.orderId);
            return true;
        });
        
        // Fix order ID counter to be higher than the highest existing order ID
        this.fixOrderIdCounter();
    },

    // Fix order ID counter to prevent duplicates
    fixOrderIdCounter() {
        if (this.orders.length === 0) {
            this.orderIdCounter = 1;
            return;
        }
        
        // Find the highest order ID number
        let maxOrderId = 0;
        this.orders.forEach(order => {
            const orderIdNum = parseInt(order.orderId) || 0;
            if (orderIdNum > maxOrderId) {
                maxOrderId = orderIdNum;
            }
        });
        
        // Set counter to be one higher than the highest existing ID
        this.orderIdCounter = maxOrderId + 1;
        console.log(`Fixed order ID counter to: ${this.orderIdCounter}`);
    },

    // Update supplies data
    updateSupplies(newSupplies) {
        this.supplies = { ...this.supplies, ...newSupplies };
        this.saveToLocalStorage();
        
        // Try to sync with API
        this.syncSuppliesWithAPI();
    },

    // Sync supplies with API
    async syncSuppliesWithAPI() {
        if (!window.apiService) return;
        
        try {
            for (const [name, quantity] of Object.entries(this.supplies)) {
                await window.apiService.put('update_supply', { name, quantity });
            }
        } catch (error) {
            console.warn('Could not sync supplies with API:', error.message);
        }
    },

    // Generate customers from orders
    generateCustomersFromOrders() {
        console.log('Generating customers from orders...');
        
        const customerMap = new Map();
        const now = new Date();
        
        // Process each order to extract customer information
        this.orders.forEach(order => {
            const customerKey = `${order.name}_${order.number}`;
            const orderDate = new Date(order.dateValue);
            const daysSinceOrder = Math.floor((now - orderDate) / (1000 * 60 * 60 * 24));
            
            if (customerMap.has(customerKey)) {
                // Update existing customer with most recent order date
                const existingCustomer = customerMap.get(customerKey);
                if (daysSinceOrder < existingCustomer.daysSinceLastOrder) {
                    existingCustomer.daysSinceLastOrder = daysSinceOrder;
                    existingCustomer.lastOrderDate = orderDate;
                }
                existingCustomer.totalOrders++;
            } else {
                // Create new customer
                customerMap.set(customerKey, {
                    name: order.name,
                    number: order.number,
                    daysSinceLastOrder: daysSinceOrder,
                    lastOrderDate: orderDate,
                    totalOrders: 1,
                    status: daysSinceOrder > 30 ? 'inactive' : 'active'
                });
            }
        });
        
        // Convert map to array and update status based on last order date
        this.customers = Array.from(customerMap.values()).map(customer => ({
            name: customer.name,
            number: customer.number,
            daysSinceLastOrder: customer.daysSinceLastOrder,
            totalOrders: customer.totalOrders,
            status: customer.daysSinceLastOrder > 30 ? 'inactive' : 'active'
        }));
        
        console.log(`Generated ${this.customers.length} customers from ${this.orders.length} orders`);
        
        // Save the updated customers
        this.saveToLocalStorage();
        
        return this.customers;
    },

    // Reset all data to defaults (for debugging)
    resetToDefaults() {
        this.orders = [];
        this.customers = [];
        this.staff = [];
        this.supplies = {
            detergent: 15,
            softener: 15,
            bleach: 15,
            fragrance: 15,
            stain_remover: 15,
            steam_water: 15,
            garment_bag: 15
        };
        this.orderIdCounter = 1;
        this.isLoaded = false;
        this.saveToLocalStorage();
        console.log('Data reset to defaults');
    },

    // Normalize order data to ensure proper number formats
    normalizeOrderData() {
        this.orders = this.orders.map(order => ({
            ...order,
            amount: parseFloat(order.amount) || 0,
            paid: parseFloat(order.paid) || 0,
            balance: parseFloat(order.balance) || 0,
            kg: parseFloat(order.kg) || 0
        }));
        console.log('Order data normalized');
    }
};

// Load data on initialization
window.AppData.load();

// Debug function to check data synchronization
window.debugDataSync = function() {
    console.log('=== DATA SYNCHRONIZATION DEBUG ===');
    console.log('AppData.supplies:', window.AppData.supplies);
    console.log('AppData.orders count:', window.AppData.orders.length);
    console.log('AppData.customers:', window.AppData.customers.length);
    console.log('AppData.staff:', window.AppData.staff.length);
    console.log('AppData.isLoaded:', window.AppData.isLoaded);
    
    // Check for duplicate orders
    const orderIds = window.AppData.orders.map(o => o.orderId);
    const duplicates = orderIds.filter((id, index) => orderIds.indexOf(id) !== index);
    if (duplicates.length > 0) {
        console.warn('DUPLICATE ORDERS FOUND:', duplicates);
    }
    
    // Calculate totals
    let totalIncome = 0;
    let totalReceivable = 0;
    window.AppData.orders.forEach(order => {
        const paid = parseFloat(order.paid) || 0;
        const balance = parseFloat(order.balance) || 0;
        totalIncome += paid;
        totalReceivable += balance;
    });
    console.log('Calculated totals - Income:', totalIncome, 'Receivable:', totalReceivable);
    
    // Check localStorage
    const localData = localStorage.getItem('laundryAppData');
    if (localData) {
        const parsed = JSON.parse(localData);
        console.log('localStorage orders count:', (parsed.orders || []).length);
        console.log('localStorage supplies:', parsed.supplies);
    }
    
    console.log('=== END DEBUG ===');
};

// Function to clean up duplicate data
window.cleanupDuplicateData = function() {
    console.log('Cleaning up duplicate data...');
    window.AppData.removeDuplicateOrders();
    window.AppData.saveToLocalStorage();
    console.log('Cleanup complete. Orders count:', window.AppData.orders.length);
    console.log('Order ID counter fixed to:', window.AppData.orderIdCounter);
};

// Function to fix duplicate order IDs by renumbering them
window.fixDuplicateOrderIds = function() {
    console.log('Fixing duplicate order IDs...');
    
    const orders = window.AppData.orders;
    const seenIds = new Set();
    let nextId = 1;
    
    // Find the next available ID
    orders.forEach(order => {
        const orderIdNum = parseInt(order.orderId) || 0;
        if (orderIdNum >= nextId) {
            nextId = orderIdNum + 1;
        }
    });
    
    // Fix duplicate IDs
    orders.forEach(order => {
        if (seenIds.has(order.orderId)) {
            const newId = String(nextId).padStart(5, '0');
            console.log(`Renumbering duplicate order ${order.orderId} to ${newId}`);
            order.orderId = newId;
            nextId++;
        }
        seenIds.add(order.orderId);
    });
    
    // Update counter
    window.AppData.orderIdCounter = nextId;
    window.AppData.saveToLocalStorage();
    
    console.log('Duplicate order IDs fixed. New counter:', window.AppData.orderIdCounter);
    
    // Refresh displays
    if (window.ordersModule) window.ordersModule.render();
    if (window.dashboardModule) window.dashboardModule.render();
};

// Function to analyze the 53k issue
window.analyze53kIssue = function() {
    console.log('=== ANALYZING 53K ISSUE ===');
    
    // Check all possible data sources
    const localStorageData = localStorage.getItem('laundryAppData');
    if (localStorageData) {
        const parsed = JSON.parse(localStorageData);
        console.log('localStorage orders:', parsed.orders?.length || 0);
        if (parsed.orders) {
            let localTotal = 0;
            parsed.orders.forEach(order => {
                const paid = parseFloat(order.paid) || 0;
                localTotal += paid;
                console.log(`localStorage order ${order.orderId}: paid=${order.paid} (parsed: ${paid})`);
            });
            console.log('localStorage total:', localTotal);
        }
    }
    
    // Check AppData
    console.log('AppData orders:', window.AppData.orders.length);
    let appDataTotal = 0;
    window.AppData.orders.forEach(order => {
        const paid = parseFloat(order.paid) || 0;
        appDataTotal += paid;
        console.log(`AppData order ${order.orderId}: paid=${order.paid} (parsed: ${paid})`);
    });
    console.log('AppData total:', appDataTotal);
    
    // Check for the specific 53452 pattern
    if (appDataTotal === 53452 || Math.abs(appDataTotal - 53452) < 1) {
        console.log('🔍 FOUND THE 53452 PATTERN!');
        console.log('This suggests there might be duplicate or inflated data');
    }
    
    console.log('=== END ANALYSIS ===');
};