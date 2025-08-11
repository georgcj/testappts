export class Password {
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
export class PasswordManager {
    constructor() {
        this.storageKey = 'passwordManager_passwords';
        this.passwords = [];
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
        }
        catch (error) {
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
        }
        catch (error) {
            console.error('Failed to load passwords from storage:', error);
            this.passwords = [];
        }
    }
}
//# sourceMappingURL=models.js.map