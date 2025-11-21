// Accounts Module
class AccountsModule {
  constructor() {
    this.container = document.getElementById('accounts-table-container');
  }

  getStaffAccounts() {
    let accounts = JSON.parse(localStorage.getItem('staffAccounts') || '[]');
    if (!accounts.length) {
      accounts = [{ email: 'staff@aquaruse', name: '', password: '' }];
      localStorage.setItem('staffAccounts', JSON.stringify(accounts));
    }
    return accounts;
  }

  setStaffAccounts(accounts) {
    localStorage.setItem('staffAccounts', JSON.stringify(accounts));
  }

  render() {
    if (!this.container) return;

    let staffAccounts = this.getStaffAccounts();
    staffAccounts = staffAccounts.filter(acc => acc.email !== 'admin@aquaruse');

    let html = `<table class="customers-table"><thead><tr><th>Staff Email</th><th>Staff Name</th><th>Password</th><th>Action</th></tr></thead><tbody>`;

    for (const [i, acc] of staffAccounts.entries()) {
      html += `<tr><td>${acc.email}</td><td>${acc.name || ''}</td><td>${acc.password || ''}</td><td><button class="delete-staff-btn" data-index="${i}" style="color:#fff;background:#e53935;border:none;padding:6px 12px;border-radius:6px;cursor:pointer;">Delete</button></td></tr>`;
    }

    html += `</tbody></table>`;
    html += `
      <form id="add-staff-form" style="margin-top:24px;display:flex;gap:12px;align-items:center;justify-content:center;">
        <input type="text" id="newStaffName" placeholder="Enter staff name" style="padding:8px 12px;border-radius:6px;border:1px solid #ccc;font-size:1rem;" required />
        <span style="font-size:1rem;">@aquaruse</span>
        <input type="password" id="newStaffPassword" placeholder="Password" style="padding:8px 12px;border-radius:6px;border:1px solid #ccc;font-size:1rem;" required />
        <button type="submit" style="padding:8px 18px;border-radius:6px;background:#43766C;color:#fff;border:none;font-size:1rem;cursor:pointer;">Add Staff</button>
      </form>
    `;

    this.container.innerHTML = html;

    // Setup form submission
    const form = document.getElementById('add-staff-form');
    if (form) {
      form.onsubmit = (e) => {
        e.preventDefault();
        let name = document.getElementById('newStaffName').value.trim();
        let password = document.getElementById('newStaffPassword').value;

        if (!name || !password) return;

        let email = name.replace(/\s+/g, '').toLowerCase() + '@aquaruse';
        let staffAccounts = this.getStaffAccounts();

        if (staffAccounts.some(acc => acc.email === email)) {
          window.AppUtils.showNotification('Staff email already exists!');
          return;
        }

        staffAccounts.push({ email, name, password });
        this.setStaffAccounts(staffAccounts);
        this.render();

        document.getElementById('newStaffName').value = '';
        document.getElementById('newStaffPassword').value = '';
      };
    }

    // Setup delete buttons
    this.container.querySelectorAll('.delete-staff-btn').forEach(btn => {
      btn.onclick = () => {
        let idx = parseInt(btn.getAttribute('data-index'));
        let staffAccounts = this.getStaffAccounts();
        staffAccounts.splice(idx, 1);
        this.setStaffAccounts(staffAccounts);
        this.render();
      };
    });
  }
}

// Initialize accounts module
window.accountsModule = new AccountsModule();