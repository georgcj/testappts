import { PasswordManager } from './models.js';
class PasswordApp {
    constructor() {
        this.currentView = 'dashboard';
        this.editingPasswordId = null;
        this.passwordManager = new PasswordManager();
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
        dashboardNav?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showView('dashboard');
        });
        passwordsNav?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showView('passwords');
        });
    }
    showView(viewName) {
        const views = document.querySelectorAll('.view');
        const navLinks = document.querySelectorAll('.nav-link');
        views.forEach(view => view.classList.remove('active'));
        navLinks.forEach(link => link.classList.remove('active'));
        const targetView = document.getElementById(`${viewName}-view`);
        const targetNav = document.getElementById(`${viewName}-nav`);
        targetView?.classList.add('active');
        targetNav?.classList.add('active');
        this.currentView = viewName;
        if (viewName === 'dashboard') {
            this.updateDashboard();
        }
        else if (viewName === 'passwords') {
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
        if (!tbody)
            return;
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
                    <button class="btn-edit" onclick="app.editPassword('${password.id}')">
                        Edit
                    </button>
                    <button class="btn-danger" onclick="app.deletePassword('${password.id}')">
                        Delete
                    </button>
                </td>
            </tr>
        `).join('');
    }
    setupModal() {
        const modal = document.getElementById('password-modal');
        const addBtn = document.getElementById('add-password-btn');
        const closeBtn = modal?.querySelector('.close');
        const cancelBtn = document.getElementById('cancel-btn');
        addBtn?.addEventListener('click', () => {
            this.openModal();
        });
        closeBtn?.addEventListener('click', () => {
            this.closeModal();
        });
        cancelBtn?.addEventListener('click', () => {
            this.closeModal();
        });
        modal?.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });
    }
    openModal(password) {
        const modal = document.getElementById('password-modal');
        const modalTitle = document.getElementById('modal-title');
        const urlInput = document.getElementById('url-input');
        const usernameInput = document.getElementById('username-input');
        const passwordInput = document.getElementById('password-input');
        if (password) {
            this.editingPasswordId = password.id;
            modalTitle.textContent = 'Edit Password';
            urlInput.value = password.url;
            usernameInput.value = password.username;
            passwordInput.value = password.password;
        }
        else {
            this.editingPasswordId = null;
            modalTitle.textContent = 'Add New Password';
            urlInput.value = '';
            usernameInput.value = '';
            passwordInput.value = '';
        }
        modal.style.display = 'block';
    }
    closeModal() {
        const modal = document.getElementById('password-modal');
        modal.style.display = 'none';
        this.editingPasswordId = null;
    }
    setupForm() {
        const form = document.getElementById('password-form');
        form?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });
    }
    handleFormSubmit() {
        const urlInput = document.getElementById('url-input');
        const usernameInput = document.getElementById('username-input');
        const passwordInput = document.getElementById('password-input');
        const url = urlInput.value.trim();
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();
        if (!url || !username || !password) {
            alert('Please fill in all fields');
            return;
        }
        if (this.editingPasswordId) {
            this.passwordManager.updatePassword(this.editingPasswordId, url, username, password);
        }
        else {
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
const app = new PasswordApp();
window.app = app;
//# sourceMappingURL=app.js.map