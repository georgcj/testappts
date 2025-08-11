export interface IPassword {
    id: string;
    url: string;
    username: string;
    password: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare class Password implements IPassword {
    id: string;
    url: string;
    username: string;
    password: string;
    createdAt: Date;
    updatedAt: Date;
    constructor(url: string, username: string, password: string, id?: string);
    private generateId;
    update(url: string, username: string, password: string): void;
}
export declare class PasswordManager {
    private passwords;
    private storageKey;
    constructor();
    addPassword(url: string, username: string, password: string): Password;
    updatePassword(id: string, url: string, username: string, password: string): boolean;
    deletePassword(id: string): boolean;
    getPassword(id: string): Password | undefined;
    getAllPasswords(): Password[];
    getPasswordCount(): number;
    private saveToStorage;
    private loadFromStorage;
}
