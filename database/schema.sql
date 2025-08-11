-- Password Manager Database Schema
-- This creates a secure, multi-user password management system

-- Create database (run this first)
-- CREATE DATABASE password_manager_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE password_manager_db;

-- Users table for authentication
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    salt VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_created_at (created_at)
);

-- Password entries table
CREATE TABLE password_entries (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(100) NOT NULL,
    url VARCHAR(500) NOT NULL,
    username VARCHAR(100) NOT NULL,
    encrypted_password TEXT NOT NULL,
    encryption_iv VARCHAR(255) NOT NULL, -- Initialization vector for AES encryption
    notes TEXT NULL,
    category VARCHAR(50) DEFAULT 'General',
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_accessed TIMESTAMP NULL,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_title (title),
    INDEX idx_url (url),
    INDEX idx_category (category),
    INDEX idx_created_at (created_at)
);

-- Password sharing table (for team functionality - optional)
CREATE TABLE password_shares (
    id INT PRIMARY KEY AUTO_INCREMENT,
    password_entry_id INT NOT NULL,
    shared_by_user_id INT NOT NULL,
    shared_with_user_id INT NOT NULL,
    permission_level ENUM('read', 'write') DEFAULT 'read',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    
    FOREIGN KEY (password_entry_id) REFERENCES password_entries(id) ON DELETE CASCADE,
    FOREIGN KEY (shared_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (shared_with_user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_share (password_entry_id, shared_with_user_id),
    INDEX idx_shared_with (shared_with_user_id),
    INDEX idx_expires_at (expires_at)
);

-- Audit log for security tracking
CREATE TABLE audit_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'login', 'create_password', 'view_password', 'update_password', 'delete_password'
    entity_type VARCHAR(20) NOT NULL, -- 'user', 'password'
    entity_id INT NULL,
    ip_address VARCHAR(45) NULL, -- IPv6 compatible
    user_agent TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at),
    INDEX idx_ip_address (ip_address)
);

-- Sessions table for JWT blacklisting and session management
CREATE TABLE user_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    is_revoked BOOLEAN DEFAULT FALSE,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_session_token (session_token),
    INDEX idx_expires_at (expires_at)
);

-- Insert some sample categories
INSERT INTO password_entries (id, user_id, title, url, username, encrypted_password, encryption_iv, category) VALUES
(0, 0, '', '', '', '', '', 'General'),
(0, 0, '', '', '', '', '', 'Work'),
(0, 0, '', '', '', '', '', 'Personal'),
(0, 0, '', '', '', '', '', 'Finance'),
(0, 0, '', '', '', '', '', 'Social Media'),
(0, 0, '', '', '', '', '', 'Shopping')
ON DUPLICATE KEY UPDATE id=id;

DELETE FROM password_entries WHERE user_id = 0;