class Password {
    constructor(url, username, password, id) {
        this.id = id || this.generateId();
        this.url = url;
        this.username = username;
        this.password = password;
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    generateId() {
        return Date.now().toString() + Math.random().toString(36).substr(2, 9);
    }

    update(url, username, password) {
        this.url = url;
        this.username = username;
        this.password = password;
        this.updatedAt = new Date();
    }
}

class PasswordManager {
    constructor() {
        this.passwords = [];
        this.storageKey = 'passwordManager_passwords';
        this.loadFromStorage();
    }

    addPassword(url, username, password) {
        const newPassword = new Password(url, username, password);
        this.passwords.push(newPassword);
        this.saveToStorage();
        return newPassword;
    }

    updatePassword(id, url, username, password) {
        const passwordIndex = this.passwords.findIndex(p => p.id === id);
        if (passwordIndex !== -1) {
            this.passwords[passwordIndex].update(url, username, password);
            this.saveToStorage();
            return true;
        }
        return false;
    }

    deletePassword(id) {
        const initialLength = this.passwords.length;
        this.passwords = this.passwords.filter(p => p.id !== id);
        if (this.passwords.length < initialLength) {
            this.saveToStorage();
            return true;
        }
        return false;
    }

    getPassword(id) {
        return this.passwords.find(p => p.id === id);
    }

    getAllPasswords() {
        return [...this.passwords];
    }

    getPasswordCount() {
        return this.passwords.length;
    }

    saveToStorage() {
        try {
            const serializedPasswords = JSON.stringify(this.passwords.map(p => ({
                id: p.id,
                url: p.url,
                username: p.username,
                password: p.password,
                createdAt: p.createdAt.toISOString(),
                updatedAt: p.updatedAt.toISOString()
            })));
            localStorage.setItem(this.storageKey, serializedPasswords);
        } catch (error) {
            console.error('Failed to save passwords to storage:', error);
        }
    }

    loadFromStorage() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const parsedPasswords = JSON.parse(stored);
                this.passwords = parsedPasswords.map((p) => {
                    const password = new Password(p.url, p.username, p.password, p.id);
                    password.createdAt = new Date(p.createdAt);
                    password.updatedAt = new Date(p.updatedAt);
                    return password;
                });
            }
        } catch (error) {
            console.error('Failed to load passwords from storage:', error);
            this.passwords = [];
        }
    }
}

class PasswordApp {
    constructor() {
        this.passwordManager = new PasswordManager();
        this.currentView = 'dashboard';
        this.editingPasswordId = null;
        this.sortColumn = null;
        this.sortDirection = 'asc';
        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupModal();
        this.setupForm();
        this.setupRouting();
        this.updateDashboard();
        this.renderPasswordsTable();
        
        // Handle initial route
        this.handleRoute();
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
        window.addEventListener('popstate', (e) => {
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
            // Default to dashboard for unknown routes
            route = 'dashboard';
            // Update URL without triggering navigation
            window.history.replaceState({ route: 'dashboard' }, '', '/');
        }
        
        this.showView(route);
    }

    updateDashboard() {
        const passwordCountElement = document.getElementById('password-count');
        if (passwordCountElement) {
            passwordCountElement.textContent = this.passwordManager.getPasswordCount().toString();
        }
    }

    renderPasswordsTable() {
        const tbody = document.getElementById('passwords-tbody');
        if (!tbody) return;

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
                <td>${this.escapeHtml(password.url)}</td>
                <td>${this.escapeHtml(password.username)}</td>
                <td>
                    <div class="password-field">
                        <span class="password-display" data-password="${this.escapeHtml(password.password)}" data-hidden="true">
                            ${'•'.repeat(password.password.length)}
                        </span>
                        <button class="toggle-password-btn" onclick="window.app.togglePassword(this)" title="Show/Hide Password">
                            👁️
                        </button>
                    </div>
                </td>
                <td>
                    <button class="btn-edit" onclick="window.app.editPassword('${password.id}')">
                        Edit
                    </button>
                    <button class="btn-danger" onclick="window.app.deletePassword('${password.id}')">
                        Delete
                    </button>
                </td>
            </tr>
        `).join('');
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

    openModal(password) {
        const modal = document.getElementById('password-modal');
        const modalTitle = document.getElementById('modal-title');
        const urlInput = document.getElementById('url-input');
        const usernameInput = document.getElementById('username-input');
        const passwordInput = document.getElementById('password-input');

        if (password) {
            this.editingPasswordId = password.id;
            if (modalTitle) modalTitle.textContent = 'Edit Password';
            if (urlInput) urlInput.value = password.url;
            if (usernameInput) usernameInput.value = password.username;
            if (passwordInput) passwordInput.value = password.password;
        } else {
            this.editingPasswordId = null;
            if (modalTitle) modalTitle.textContent = 'Add New Password';
            if (urlInput) urlInput.value = '';
            if (usernameInput) usernameInput.value = '';
            if (passwordInput) passwordInput.value = '';
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

    handleFormSubmit() {
        const urlInput = document.getElementById('url-input');
        const usernameInput = document.getElementById('username-input');
        const passwordInput = document.getElementById('password-input');

        const url = urlInput && urlInput.value.trim();
        const username = usernameInput && usernameInput.value.trim();
        const password = passwordInput && passwordInput.value.trim();

        if (!url || !username || !password) {
            alert('Please fill in all fields');
            return;
        }

        if (this.editingPasswordId) {
            this.passwordManager.updatePassword(this.editingPasswordId, url, username, password);
        } else {
            this.passwordManager.addPassword(url, username, password);
        }

        this.closeModal();
        this.updateDashboard();
        this.renderPasswordsTable();
    }

    editPassword(id) {
        const password = this.passwordManager.getPassword(id);
        if (password) {
            this.openModal(password);
        }
    }

    deletePassword(id) {
        if (confirm('Are you sure you want to delete this password?')) {
            this.passwordManager.deletePassword(id);
            this.updateDashboard();
            this.renderPasswordsTable();
        }
    }

    togglePassword(button) {
        const passwordSpan = button.previousElementSibling;
        const isHidden = passwordSpan.getAttribute('data-hidden') === 'true';
        const actualPassword = passwordSpan.getAttribute('data-password');
        
        if (isHidden) {
            passwordSpan.textContent = actualPassword;
            passwordSpan.setAttribute('data-hidden', 'false');
            button.textContent = '🙈';
            button.title = 'Hide Password';
        } else {
            passwordSpan.textContent = '•'.repeat(actualPassword.length);
            passwordSpan.setAttribute('data-hidden', 'true');
            button.textContent = '👁️';
            button.title = 'Show Password';
        }
    }

    sortTable(column) {
        const passwords = this.passwordManager.getAllPasswords();
        
        // Toggle sort direction if same column, otherwise set to ascending
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = 'asc';
        }

        // Sort passwords based on column and direction
        passwords.sort((a, b) => {
            let aValue = a[column].toLowerCase();
            let bValue = b[column].toLowerCase();
            
            if (this.sortDirection === 'asc') {
                return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
            } else {
                return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
            }
        });

        // Update the visual indicators
        this.updateSortIndicators();
        
        // Re-render table with sorted data
        this.renderSortedTable(passwords);
    }

    updateSortIndicators() {
        const indicators = document.querySelectorAll('.sort-indicator');
        indicators.forEach(indicator => {
            indicator.classList.remove('asc', 'desc');
        });

        if (this.sortColumn) {
            const activeHeader = document.querySelector(`th[onclick="window.app.sortTable('${this.sortColumn}')"] .sort-indicator`);
            if (activeHeader) {
                activeHeader.classList.add(this.sortDirection);
            }
        }
    }

    renderSortedTable(sortedPasswords) {
        const tbody = document.getElementById('passwords-tbody');
        if (!tbody) return;

        if (sortedPasswords.length === 0) {
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

        tbody.innerHTML = sortedPasswords.map(password => `
            <tr>
                <td>${this.escapeHtml(password.url)}</td>
                <td>${this.escapeHtml(password.username)}</td>
                <td>
                    <div class="password-field">
                        <span class="password-display" data-password="${this.escapeHtml(password.password)}" data-hidden="true">
                            ${'•'.repeat(password.password.length)}
                        </span>
                        <button class="toggle-password-btn" onclick="window.app.togglePassword(this)" title="Show Password">
                            👁️
                        </button>
                    </div>
                </td>
                <td>
                    <button class="btn-edit" onclick="window.app.editPassword('${password.id}')">
                        Edit
                    </button>
                    <button class="btn-danger" onclick="window.app.deletePassword('${password.id}')">
                        Delete
                    </button>
                </td>
            </tr>
        `).join('');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.app = new PasswordApp();
});