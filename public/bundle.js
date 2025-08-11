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
        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupModal();
        this.setupForm();
        this.updateDashboard();
        this.renderPasswordsTable();
    }

    setupNavigation() {
        const dashboardNav = document.getElementById('dashboard-nav');
        const passwordsNav = document.getElementById('passwords-nav');

        if (dashboardNav) {
            dashboardNav.addEventListener('click', (e) => {
                e.preventDefault();
                this.showView('dashboard');
            });
        }

        if (passwordsNav) {
            passwordsNav.addEventListener('click', (e) => {
                e.preventDefault();
                this.showView('passwords');
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
                    <span class="password-display">
                        ${'•'.repeat(password.password.length)}
                    </span>
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