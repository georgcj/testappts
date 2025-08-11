export interface IPassword {
    id: string;
    url: string;
    username: string;
    password: string;
    createdAt: Date;
    updatedAt: Date;
}

export class Password implements IPassword {
    public id: string;
    public url: string;
    public username: string;
    public password: string;
    public createdAt: Date;
    public updatedAt: Date;

    constructor(url: string, username: string, password: string, id?: string) {
        this.id = id || this.generateId();
        this.url = url;
        this.username = username;
        this.password = password;
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    private generateId(): string {
        return Date.now().toString() + Math.random().toString(36).substr(2, 9);
    }

    public update(url: string, username: string, password: string): void {
        this.url = url;
        this.username = username;
        this.password = password;
        this.updatedAt = new Date();
    }
}

export class PasswordManager {
    private passwords: Password[];
    private storageKey: string = 'passwordManager_passwords';

    constructor() {
        this.passwords = [];
        this.loadFromStorage();
    }

    public addPassword(url: string, username: string, password: string): Password {
        const newPassword = new Password(url, username, password);
        this.passwords.push(newPassword);
        this.saveToStorage();
        return newPassword;
    }

    public updatePassword(id: string, url: string, username: string, password: string): boolean {
        const passwordIndex = this.passwords.findIndex(p => p.id === id);
        if (passwordIndex !== -1) {
            this.passwords[passwordIndex].update(url, username, password);
            this.saveToStorage();
            return true;
        }
        return false;
    }

    public deletePassword(id: string): boolean {
        const initialLength = this.passwords.length;
        this.passwords = this.passwords.filter(p => p.id !== id);
        if (this.passwords.length < initialLength) {
            this.saveToStorage();
            return true;
        }
        return false;
    }

    public getPassword(id: string): Password | undefined {
        return this.passwords.find(p => p.id === id);
    }

    public getAllPasswords(): Password[] {
        return [...this.passwords];
    }

    public getPasswordCount(): number {
        return this.passwords.length;
    }

    private saveToStorage(): void {
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

    private loadFromStorage(): void {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const parsedPasswords = JSON.parse(stored);
                this.passwords = parsedPasswords.map((p: any) => {
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