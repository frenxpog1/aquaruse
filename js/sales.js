// Sales Module
class SalesModule {
  constructor() {
    this.container = document.getElementById('sales-table-container');
  }

  calculateTotalSales() {
    return window.AppData.orders.reduce((sum, order) => {
      if (order.statusValue === 'complete' || order.statusValue === 'completed') {
        const amt = parseFloat(order.amount);
        if (!isNaN(amt)) return sum + amt;
      }
      return sum;
    }, 0);
  }

  render() {
    if (!this.container) return;

    const totalSales = this.calculateTotalSales();
    this.container.innerHTML = `
      <table class="customers-table" style="min-width:240px; max-width:400px; width:100%; text-align:center; margin:0 auto;">
        <thead><tr><th style="font-size:1.5rem;">TOTAL SALES</th></tr></thead>
        <tbody><tr><td style="font-size:2.2rem;font-weight:bold;">₱ ${totalSales}</td></tr></tbody>
      </table>
    `;
  }
}

// Initialize sales module
window.salesModule = new SalesModule();