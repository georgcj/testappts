import Database from '../config/database.js';
import { EncryptionService } from '../utils/encryption.js';

export interface IUser {
  id?: number;
  username: string;
  email: string;
  password?: string; // Only used for input, never stored
  password_hash?: string;
  salt?: string;
  created_at?: Date;
  updated_at?: Date;
  is_active?: boolean;
  last_login?: Date;
}

export class User {
  private db: Database;

  constructor() {
    this.db = Database.getInstance();
  }

  /**
   * Create a new user
   */
  public async create(userData: IUser): Promise<IUser> {
    if (!userData.password) {
      throw new Error('Password is required');
    }

    // Hash the password
    const { hash, salt } = await EncryptionService.hashPassword(userData.password);

    const sql = `
      INSERT INTO users (username, email, password_hash, salt)
      VALUES (?, ?, ?, ?)
    `;

    const result = await this.db.query(sql, [
      userData.username,
      userData.email,
      hash,
      salt
    ]);

    // Return user without sensitive data
    const newUser: IUser = {
      id: result.insertId,
      username: userData.username,
      email: userData.email,
      created_at: new Date(),
      is_active: true
    };

    return newUser;
  }

  /**
   * Find user by email or username
   */
  public async findByEmailOrUsername(identifier: string): Promise<IUser | null> {
    const sql = `
      SELECT id, username, email, password_hash, salt, created_at, updated_at, is_active, last_login
      FROM users 
      WHERE email = ? OR username = ?
      AND is_active = true
    `;

    const results = await this.db.query(sql, [identifier, identifier]);
    
    if (results.length === 0) {
      return null;
    }

    return results[0];
  }

  /**
   * Find user by ID
   */
  public async findById(id: number): Promise<IUser | null> {
    const sql = `
      SELECT id, username, email, created_at, updated_at, is_active, last_login
      FROM users 
      WHERE id = ? AND is_active = true
    `;

    const results = await this.db.query(sql, [id]);
    
    if (results.length === 0) {
      return null;
    }

    return results[0];
  }

  /**
   * Verify user credentials
   */
  public async verifyCredentials(identifier: string, password: string): Promise<IUser | null> {
    const user = await this.findByEmailOrUsername(identifier);
    
    if (!user || !user.password_hash) {
      return null;
    }

    const isValid = await EncryptionService.verifyPassword(password, user.password_hash);
    
    if (!isValid) {
      return null;
    }

    // Update last login
    await this.updateLastLogin(user.id!);

    // Return user without sensitive data
    const { password_hash, salt, ...safeUser } = user;
    return safeUser;
  }

  /**
   * Update user's last login timestamp
   */
  public async updateLastLogin(userId: number): Promise<void> {
    const sql = `UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?`;
    await this.db.query(sql, [userId]);
  }

  /**
   * Update user profile
   */
  public async update(userId: number, updates: Partial<IUser>): Promise<IUser | null> {
    const allowedFields = ['username', 'email'];
    const fields: string[] = [];
    const values: any[] = [];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key) && value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(userId);
    const sql = `UPDATE users SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    
    await this.db.query(sql, values);
    
    return this.findById(userId);
  }

  /**
   * Check if username or email exists
   */
  public async exists(username: string, email: string): Promise<{ username: boolean; email: boolean }> {
    const sql = `
      SELECT 
        SUM(CASE WHEN username = ? THEN 1 ELSE 0 END) as username_count,
        SUM(CASE WHEN email = ? THEN 1 ELSE 0 END) as email_count
      FROM users 
      WHERE is_active = true
    `;

    const results = await this.db.query(sql, [username, email]);
    const result = results[0];

    return {
      username: result.username_count > 0,
      email: result.email_count > 0
    };
  }
}