// Login Module
document.addEventListener('DOMContentLoaded', function() {
  // Only run on login page
  if (!window.location.pathname.endsWith('login.html')) return;

  const loginForm = document.getElementById('loginForm');
  if (!loginForm) return;

  loginForm.addEventListener('submit', function(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value.trim().toLowerCase();
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('login-error');

    // Admin login
    if (email === 'admin@aquaruse') {
      localStorage.setItem('userEmail', email);
      window.location.href = 'spa.html';
      return;
    }

    // Staff login
    let staffAccounts = JSON.parse(localStorage.getItem('staffAccounts') || '[]');
    let staff = staffAccounts.find(acc => acc.email === email);
    
    if (staff && staff.password === password) {
      localStorage.setItem('userEmail', email);
      window.location.href = 'spa.html';
      return;
    }

    // Login failed
    if (errorDiv) {
      errorDiv.textContent = 'Invalid email or password. Please try again.';
      errorDiv.style.display = 'block';
    }
  });
});