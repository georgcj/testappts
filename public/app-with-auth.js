class AuthenticatedPasswordApp {
    constructor() {
        this.currentView = 'dashboard';
        this.editingPasswordId = null;
        this.sortColumn = null;
        this.sortDirection = 'asc';
        
        // Initialize auth manager and API password manager
        this.authManager = window.authManager;
        this.passwordManager = window.apiPasswordManager;
        
        this.init();
    }

    async init() {
        // Check if user is authenticated
        const isAuthenticated = await this.authManager.checkAuthStatus();
        
        if (isAuthenticated) {
            this.showMainApp();
        } else {
            this.showAuthScreen();
        }
        
        this.setupAuthentication();
        this.setupMainApp();
    }

    showAuthScreen() {
        document.getElementById('auth-screen').style.display = 'flex';
        document.getElementById('main-app').style.display = 'none';
    }

    showMainApp() {
        document.getElementById('auth-screen').style.display = 'none';
        document.getElementById('main-app').style.display = 'flex';
        
        // Update user info
        const user = this.authManager.getCurrentUser();
        if (user) {
            document.getElementById('username-display').textContent = user.username;
        }
        
        // Initialize main app features
        this.setupNavigation();
        this.setupModal();
        this.setupForm();
        this.setupRouting();
        this.updateDashboard();
        this.renderPasswordsTable();
        
        // Handle initial route
        this.handleRoute();
    }

    setupAuthentication() {
        // Auth form switching
        document.getElementById('show-register').addEventListener('click', (e) => {
            e.preventDefault();
            this.switchToRegister();
        });

        document.getElementById('show-login').addEventListener('click', (e) => {
            e.preventDefault();
            this.switchToLogin();
        });

        // Login form
        document.getElementById('login-form-element').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Register form
        document.getElementById('register-form-element').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });

        // Logout button
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.handleLogout();
        });
    }

    switchToRegister() {
        document.getElementById('login-form').classList.remove('active');
        document.getElementById('register-form').classList.add('active');
        this.clearErrors();
    }

    switchToLogin() {
        document.getElementById('register-form').classList.remove('active');
        document.getElementById('login-form').classList.add('active');
        this.clearErrors();
    }

    clearErrors() {
        document.getElementById('login-error').classList.remove('show');
        document.getElementById('register-error').classList.remove('show');
    }

    showError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        errorElement.textContent = message;
        errorElement.classList.add('show');
    }

    async handleLogin() {
        const identifier = document.getElementById('login-identifier').value;
        const password = document.getElementById('login-password').value;

        if (!identifier || !password) {
            this.showError('login-error', 'Please fill in all fields');
            return;
        }

        try {
            const result = await this.authManager.login({ identifier, password });
            
            if (result.success) {
                this.showMainApp();
            } else {
                this.showError('login-error', result.error);
            }
        } catch (error) {
            this.showError('login-error', 'Login failed. Please try again.');
        }
    }

    async handleRegister() {
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;

        if (!username || !email || !password || !confirmPassword) {
            this.showError('register-error', 'Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            this.showError('register-error', 'Passwords do not match');
            return;
        }

        // Basic password validation
        if (password.length < 8) {
            this.showError('register-error', 'Password must be at least 8 characters long');
            return;
        }

        try {
            const result = await this.authManager.register({ username, email, password });
            
            if (result.success) {
                this.showMainApp();
            } else {
                this.showError('register-error', result.error);
            }
        } catch (error) {
            this.showError('register-error', 'Registration failed. Please try again.');
        }
    }

    handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            this.authManager.logout();
            this.showAuthScreen();
        }
    }

    setupMainApp() {
        // All the existing main app functionality will be moved here
        // This includes navigation, modals, forms, etc.
    }

    setupNavigation() {
        const dashboardNav = document.getElementById('dashboard-nav');
        const passwordsNav = document.getElementById('passwords-nav');

        if (dashboardNav) {
            dashboardNav.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateTo('dashboard');
            });
        }

        if (passwordsNav) {
            passwordsNav.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateTo('passwords');
            });
        }
    }

    showView(viewName) {
        const views = document.querySelectorAll('.view');
        const navLinks = document.querySelectorAll('.nav-link');

        views.forEach(view => view.classList.remove('active'));
        navLinks.forEach(link => link.classList.remove('active'));

        const targetView = document.getElementById(`${viewName}-view`);
        const targetNav = document.getElementById(`${viewName}-nav`);

        if (targetView) targetView.classList.add('active');
        if (targetNav) targetNav.classList.add('active');

        this.currentView = viewName;

        if (viewName === 'dashboard') {
            this.updateDashboard();
        } else if (viewName === 'passwords') {
            this.renderPasswordsTable();
        }
    }

    setupRouting() {
        window.addEventListener('popstate', () => {
            this.handleRoute();
        });
    }

    navigateTo(route) {
        const url = route === 'dashboard' ? '/' : `/${route}`;
        window.history.pushState({ route }, '', url);
        this.showView(route);
    }

    handleRoute() {
        const path = window.location.pathname;
        let route;
        
        if (path === '/' || path === '/index.html') {
            route = 'dashboard';
        } else if (path === '/dashboard') {
            route = 'dashboard';
        } else if (path === '/passwords') {
            route = 'passwords';
        } else {
            route = 'dashboard';
            window.history.replaceState({ route: 'dashboard' }, '', '/');
        }
        
        this.showView(route);
    }

    async updateDashboard() {
        const passwordCountElement = document.getElementById('password-count');
        if (passwordCountElement) {
            try {
                const stats = await this.passwordManager.getStats();
                passwordCountElement.textContent = stats.total_passwords.toString();
            } catch (error) {
                console.error('Failed to load stats:', error);
                passwordCountElement.textContent = '0';
            }
        }
    }

    async renderPasswordsTable() {
        const tbody = document.getElementById('passwords-tbody');
        if (!tbody) return;

        try {
            await this.passwordManager.loadPasswords();
            const passwords = this.passwordManager.getAllPasswords();

            if (passwords.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="4" class="empty-state">
                            <div>
                                <h3>No passwords saved yet</h3>
                                <p>Click "Add New Password" to get started</p>
                            </div>
                        </td>
                    </tr>
                `;
                return;
            }

            tbody.innerHTML = passwords.map(password => `
                <tr>
                    <td>
                        <div class="password-title">
                            <strong>${this.escapeHtml(password.title || 'Untitled')}</strong>
                            ${password.url ? `<br><small><a href="${this.escapeHtml(password.url)}" target="_blank" rel="noopener">${this.escapeHtml(password.url)}</a></small>` : ''}
                        </div>
                    </td>
                    <td>${this.escapeHtml(password.username)}</td>
                    <td>
                        <div class="password-field">
                            <span class="password-display" data-password-id="${password.id}" data-hidden="true">
                                ${'•'.repeat(8)}
                            </span>
                            <button class="toggle-password-btn" onclick="window.app.togglePassword(this)" title="Show Password">
                                👁️
                            </button>
                        </div>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-edit" onclick="window.app.editPassword(${password.id})" title="Edit Password">
                                ✏️
                            </button>
                            <button class="btn-danger" onclick="window.app.deletePassword(${password.id})" title="Delete Password">
                                🗑️
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');
        } catch (error) {
            console.error('Failed to load passwords:', error);
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; color: #e74c3c; padding: 2rem;">
                        Failed to load passwords. Please refresh the page.
                    </td>
                </tr>
            `;
        }
    }

    async togglePassword(button) {
        const passwordSpan = button.previousElementSibling;
        const isHidden = passwordSpan.getAttribute('data-hidden') === 'true';
        const passwordId = passwordSpan.getAttribute('data-password-id');
        
        if (isHidden) {
            try {
                // Fetch the actual password from API
                const password = await this.passwordManager.getPassword(passwordId);
                passwordSpan.textContent = password.password;
                passwordSpan.setAttribute('data-hidden', 'false');
                button.textContent = '🙈';
                button.title = 'Hide Password';
            } catch (error) {
                console.error('Failed to get password:', error);
                alert('Failed to retrieve password');
            }
        } else {
            passwordSpan.textContent = '•'.repeat(8);
            passwordSpan.setAttribute('data-hidden', 'true');
            button.textContent = '👁️';
            button.title = 'Show Password';
        }
    }

    setupModal() {
        const modal = document.getElementById('password-modal');
        const addBtn = document.getElementById('add-password-btn');
        const closeBtn = modal && modal.querySelector('.close');
        const cancelBtn = document.getElementById('cancel-btn');

        if (addBtn) {
            addBtn.addEventListener('click', () => {
                this.openModal();
            });
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeModal();
            });
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.closeModal();
            });
        }

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal();
                }
            });
        }
    }

    async openModal(passwordId = null) {
        const modal = document.getElementById('password-modal');
        const modalTitle = document.getElementById('modal-title');
        const titleInput = document.getElementById('title-input');
        const urlInput = document.getElementById('url-input');
        const usernameInput = document.getElementById('username-input');
        const passwordInput = document.getElementById('password-input');
        const categoryInput = document.getElementById('category-input');
        const notesInput = document.getElementById('notes-input');

        if (passwordId) {
            try {
                const password = await this.passwordManager.getPassword(passwordId);
                this.editingPasswordId = passwordId;
                if (modalTitle) modalTitle.textContent = 'Edit Password';
                if (titleInput) titleInput.value = password.title || '';
                if (urlInput) urlInput.value = password.url || '';
                if (usernameInput) usernameInput.value = password.username || '';
                if (passwordInput) passwordInput.value = password.password || '';
                if (categoryInput) categoryInput.value = password.category || 'General';
                if (notesInput) notesInput.value = password.notes || '';
            } catch (error) {
                console.error('Failed to load password for editing:', error);
                alert('Failed to load password details');
                return;
            }
        } else {
            this.editingPasswordId = null;
            if (modalTitle) modalTitle.textContent = 'Add New Password';
            if (titleInput) titleInput.value = '';
            if (urlInput) urlInput.value = '';
            if (usernameInput) usernameInput.value = '';
            if (passwordInput) passwordInput.value = '';
            if (categoryInput) categoryInput.value = 'General';
            if (notesInput) notesInput.value = '';
        }

        if (modal) modal.style.display = 'block';
    }

    closeModal() {
        const modal = document.getElementById('password-modal');
        if (modal) modal.style.display = 'none';
        this.editingPasswordId = null;
    }

    setupForm() {
        const form = document.getElementById('password-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleFormSubmit();
            });
        }
    }

    async handleFormSubmit() {
        const titleInput = document.getElementById('title-input');
        const urlInput = document.getElementById('url-input');
        const usernameInput = document.getElementById('username-input');
        const passwordInput = document.getElementById('password-input');
        const categoryInput = document.getElementById('category-input');
        const notesInput = document.getElementById('notes-input');

        const title = titleInput && titleInput.value.trim();
        const url = urlInput && urlInput.value.trim();
        const username = usernameInput && usernameInput.value.trim();
        const password = passwordInput && passwordInput.value.trim();
        const category = categoryInput && categoryInput.value;
        const notes = notesInput && notesInput.value.trim();

        if (!title || !url || !username || !password) {
            alert('Please fill in all required fields (Title, URL, Username, Password)');
            return;
        }

        // Basic URL validation
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            if (confirm('URL should start with http:// or https://. Add https:// automatically?')) {
                urlInput.value = 'https://' + url;
            } else {
                return;
            }
        }

        try {
            const passwordData = {
                title,
                url: urlInput.value.trim(), // Use the potentially corrected URL
                username,
                password,
                category: category || 'General',
                notes: notes || undefined
            };

            if (this.editingPasswordId) {
                await this.passwordManager.updatePassword(this.editingPasswordId, passwordData);
            } else {
                await this.passwordManager.addPassword(passwordData);
            }

            this.closeModal();
            await this.updateDashboard();
            await this.renderPasswordsTable();
            
            // Show success message
            this.showSuccessMessage(this.editingPasswordId ? 'Password updated successfully!' : 'Password added successfully!');
        } catch (error) {
            console.error('Failed to save password:', error);
            alert('Failed to save password: ' + error.message);
        }
    }

    async editPassword(id) {
        await this.openModal(id);
    }

    async deletePassword(id) {
        if (confirm('Are you sure you want to delete this password?')) {
            try {
                await this.passwordManager.deletePassword(id);
                await this.updateDashboard();
                await this.renderPasswordsTable();
            } catch (error) {
                console.error('Failed to delete password:', error);
                alert('Failed to delete password. Please try again.');
            }
        }
    }

    sortTable(column) {
        // TODO: Implement API-based sorting
        console.log('Sorting by:', column);
    }

    showSuccessMessage(message) {
        // Create or get success message element
        let successEl = document.getElementById('success-message');
        if (!successEl) {
            successEl = document.createElement('div');
            successEl.id = 'success-message';
            successEl.className = 'success-message';
            document.body.appendChild(successEl);
        }
        
        successEl.textContent = message;
        successEl.classList.add('show');
        
        // Hide after 3 seconds
        setTimeout(() => {
            successEl.classList.remove('show');
        }, 3000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.app = new AuthenticatedPasswordApp();
});