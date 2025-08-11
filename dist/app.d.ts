declare class PasswordApp {
    private passwordManager;
    private currentView;
    private editingPasswordId;
    constructor();
    private init;
    private setupNavigation;
    private showView;
    private updateDashboard;
    private renderPasswordsTable;
    private setupModal;
    private openModal;
    private closeModal;
    private setupForm;
    private handleFormSubmit;
    editPassword(id: string): void;
    deletePassword(id: string): void;
    private escapeHtml;
}
declare global {
    interface Window {
        app: PasswordApp;
    }
}
export {};
