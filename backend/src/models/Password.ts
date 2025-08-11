import Database from '../config/database.js';
import { EncryptionService } from '../utils/encryption.js';

export interface IPasswordEntry {
  id?: number;
  user_id: number;
  title: string;
  url: string;
  username: string;
  password?: string; // Decrypted password (only used in memory)
  encrypted_password?: string; // Stored in database
  encryption_iv?: string; // Initialization vector
  encryption_tag?: string; // Auth tag for GCM
  notes?: string;
  category?: string;
  is_favorite?: boolean;
  created_at?: Date;
  updated_at?: Date;
  last_accessed?: Date;
}

export class PasswordEntry {
  private db: Database;

  constructor() {
    this.db = Database.getInstance();
  }

  /**
   * Create a new password entry
   */
  public async create(passwordData: IPasswordEntry): Promise<IPasswordEntry> {
    if (!passwordData.password) {
      throw new Error('Password is required');
    }

    // Encrypt the password
    const encrypted = EncryptionService.encrypt(passwordData.password);
    
    // Encrypt notes if provided
    let encryptedNotes = null;
    let notesIv = null;
    let notesTag = null;
    
    if (passwordData.notes) {
      const notesEncrypted = EncryptionService.encrypt(passwordData.notes);
      encryptedNotes = notesEncrypted.encrypted;
      notesIv = notesEncrypted.iv;
      notesTag = notesEncrypted.tag;
    }

    const sql = `
      INSERT INTO password_entries 
      (user_id, title, url, username, encrypted_password, encryption_iv, encryption_tag, 
       notes, notes_iv, notes_tag, category, is_favorite)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await this.db.query(sql, [
      passwordData.user_id,
      passwordData.title,
      passwordData.url,
      passwordData.username,
      encrypted.encrypted,
      encrypted.iv,
      encrypted.tag,
      encryptedNotes,
      notesIv,
      notesTag,
      passwordData.category || 'General',
      passwordData.is_favorite || false
    ]);

    // Return the created entry without decrypted password
    return {
      id: result.insertId,
      user_id: passwordData.user_id,
      title: passwordData.title,
      url: passwordData.url,
      username: passwordData.username,
      category: passwordData.category || 'General',
      is_favorite: passwordData.is_favorite || false,
      created_at: new Date()
    };
  }

  /**
   * Get all password entries for a user
   */
  public async findByUserId(userId: number, includePasswords: boolean = false): Promise<IPasswordEntry[]> {
    const sql = `
      SELECT id, user_id, title, url, username, encrypted_password, encryption_iv, encryption_tag,
             notes, notes_iv, notes_tag, category, is_favorite, created_at, updated_at, last_accessed
      FROM password_entries 
      WHERE user_id = ?
      ORDER BY title ASC
    `;

    const results = await this.db.query(sql, [userId]);
    
    if (!includePasswords) {
      // Return without decrypted passwords
      return results.map((row: any) => ({
        id: row.id,
        user_id: row.user_id,
        title: row.title,
        url: row.url,
        username: row.username,
        category: row.category,
        is_favorite: row.is_favorite,
        created_at: row.created_at,
        updated_at: row.updated_at,
        last_accessed: row.last_accessed,
        has_notes: !!row.notes
      }));
    }

    // Decrypt passwords for authorized access
    return results.map((row: any) => {
      let decryptedPassword = '';
      let decryptedNotes = '';
      
      try {
        if (row.encrypted_password && row.encryption_iv && row.encryption_tag) {
          decryptedPassword = EncryptionService.decrypt({
            encrypted: row.encrypted_password,
            iv: row.encryption_iv,
            tag: row.encryption_tag
          });
        }
        
        if (row.notes && row.notes_iv && row.notes_tag) {
          decryptedNotes = EncryptionService.decrypt({
            encrypted: row.notes,
            iv: row.notes_iv,
            tag: row.notes_tag
          });
        }
      } catch (error) {
        console.error('Failed to decrypt password entry:', error);
      }

      return {
        id: row.id,
        user_id: row.user_id,
        title: row.title,
        url: row.url,
        username: row.username,
        password: decryptedPassword,
        notes: decryptedNotes,
        category: row.category,
        is_favorite: row.is_favorite,
        created_at: row.created_at,
        updated_at: row.updated_at,
        last_accessed: row.last_accessed
      };
    });
  }

  /**
   * Get a specific password entry
   */
  public async findById(id: number, userId: number, includePassword: boolean = false): Promise<IPasswordEntry | null> {
    const sql = `
      SELECT id, user_id, title, url, username, encrypted_password, encryption_iv, encryption_tag,
             notes, notes_iv, notes_tag, category, is_favorite, created_at, updated_at, last_accessed
      FROM password_entries 
      WHERE id = ? AND user_id = ?
    `;

    const results = await this.db.query(sql, [id, userId]);
    
    if (results.length === 0) {
      return null;
    }

    const row = results[0];

    // Update last accessed
    if (includePassword) {
      await this.updateLastAccessed(id);
    }

    if (!includePassword) {
      return {
        id: row.id,
        user_id: row.user_id,
        title: row.title,
        url: row.url,
        username: row.username,
        category: row.category,
        is_favorite: row.is_favorite,
        created_at: row.created_at,
        updated_at: row.updated_at,
        last_accessed: row.last_accessed,
        has_notes: !!row.notes
      };
    }

    // Decrypt password and notes
    let decryptedPassword = '';
    let decryptedNotes = '';
    
    try {
      if (row.encrypted_password && row.encryption_iv && row.encryption_tag) {
        decryptedPassword = EncryptionService.decrypt({
          encrypted: row.encrypted_password,
          iv: row.encryption_iv,
          tag: row.encryption_tag
        });
      }
      
      if (row.notes && row.notes_iv && row.notes_tag) {
        decryptedNotes = EncryptionService.decrypt({
          encrypted: row.notes,
          iv: row.notes_iv,
          tag: row.notes_tag
        });
      }
    } catch (error) {
      console.error('Failed to decrypt password entry:', error);
    }

    return {
      id: row.id,
      user_id: row.user_id,
      title: row.title,
      url: row.url,
      username: row.username,
      password: decryptedPassword,
      notes: decryptedNotes,
      category: row.category,
      is_favorite: row.is_favorite,
      created_at: row.created_at,
      updated_at: row.updated_at,
      last_accessed: row.last_accessed
    };
  }

  /**
   * Update a password entry
   */
  public async update(id: number, userId: number, updates: Partial<IPasswordEntry>): Promise<IPasswordEntry | null> {
    const fields: string[] = [];
    const values: any[] = [];

    // Handle regular fields
    const allowedFields = ['title', 'url', 'username', 'category', 'is_favorite'];
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key) && value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }

    // Handle password encryption
    if (updates.password !== undefined) {
      const encrypted = EncryptionService.encrypt(updates.password);
      fields.push('encrypted_password = ?', 'encryption_iv = ?', 'encryption_tag = ?');
      values.push(encrypted.encrypted, encrypted.iv, encrypted.tag);
    }

    // Handle notes encryption
    if (updates.notes !== undefined) {
      if (updates.notes === '') {
        // Clear notes
        fields.push('notes = NULL', 'notes_iv = NULL', 'notes_tag = NULL');
      } else {
        const encrypted = EncryptionService.encrypt(updates.notes);
        fields.push('notes = ?', 'notes_iv = ?', 'notes_tag = ?');
        values.push(encrypted.encrypted, encrypted.iv, encrypted.tag);
      }
    }

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id, userId);

    const sql = `UPDATE password_entries SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`;
    
    const result = await this.db.query(sql, values);
    
    if (result.affectedRows === 0) {
      return null;
    }
    
    return this.findById(id, userId, false);
  }

  /**
   * Delete a password entry
   */
  public async delete(id: number, userId: number): Promise<boolean> {
    const sql = `DELETE FROM password_entries WHERE id = ? AND user_id = ?`;
    const result = await this.db.query(sql, [id, userId]);
    return result.affectedRows > 0;
  }

  /**
   * Update last accessed timestamp
   */
  private async updateLastAccessed(id: number): Promise<void> {
    const sql = `UPDATE password_entries SET last_accessed = CURRENT_TIMESTAMP WHERE id = ?`;
    await this.db.query(sql, [id]);
  }

  /**
   * Get password statistics for dashboard
   */
  public async getStats(userId: number): Promise<any> {
    const sql = `
      SELECT 
        COUNT(*) as total_passwords,
        COUNT(CASE WHEN is_favorite = true THEN 1 END) as favorites_count,
        COUNT(DISTINCT category) as categories_count,
        COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as created_today,
        COUNT(CASE WHEN DATE(last_accessed) = CURDATE() THEN 1 END) as accessed_today
      FROM password_entries 
      WHERE user_id = ?
    `;

    const results = await this.db.query(sql, [userId]);
    return results[0];
  }
}