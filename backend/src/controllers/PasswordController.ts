import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { PasswordEntry, IPasswordEntry } from '../models/Password.js';

interface AuthRequest extends Request {
  user?: any;
}

export class PasswordController {
  private passwordModel: PasswordEntry;

  constructor() {
    this.passwordModel = new PasswordEntry();
  }

  /**
   * Get all passwords for user (without decrypted passwords)
   */
  public getAll = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user.id;
      const passwords = await this.passwordModel.findByUserId(userId, false);

      res.json({
        passwords,
        count: passwords.length
      });

    } catch (error) {
      console.error('Get passwords error:', error);
      res.status(500).json({ error: 'Failed to retrieve passwords' });
    }
  };

  /**
   * Get a specific password entry (with decrypted password)
   */
  public getById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user.id;
      const passwordId = parseInt(req.params.id);

      if (isNaN(passwordId)) {
        res.status(400).json({ error: 'Invalid password ID' });
        return;
      }

      const password = await this.passwordModel.findById(passwordId, userId, true);
      if (!password) {
        res.status(404).json({ error: 'Password not found' });
        return;
      }

      res.json({ password });

    } catch (error) {
      console.error('Get password error:', error);
      res.status(500).json({ error: 'Failed to retrieve password' });
    }
  };

  /**
   * Create a new password entry
   */
  public create = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
        return;
      }

      const userId = req.user.id;
      const { title, url, username, password, notes, category, is_favorite } = req.body;

      const passwordData: IPasswordEntry = {
        user_id: userId,
        title,
        url,
        username,
        password,
        notes,
        category: category || 'General',
        is_favorite: is_favorite || false
      };

      const newPassword = await this.passwordModel.create(passwordData);

      res.status(201).json({
        message: 'Password created successfully',
        password: newPassword
      });

    } catch (error) {
      console.error('Create password error:', error);
      res.status(500).json({ error: 'Failed to create password' });
    }
  };

  /**
   * Update a password entry
   */
  public update = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
        return;
      }

      const userId = req.user.id;
      const passwordId = parseInt(req.params.id);

      if (isNaN(passwordId)) {
        res.status(400).json({ error: 'Invalid password ID' });
        return;
      }

      const { title, url, username, password, notes, category, is_favorite } = req.body;

      const updates: Partial<IPasswordEntry> = {};
      if (title !== undefined) updates.title = title;
      if (url !== undefined) updates.url = url;
      if (username !== undefined) updates.username = username;
      if (password !== undefined) updates.password = password;
      if (notes !== undefined) updates.notes = notes;
      if (category !== undefined) updates.category = category;
      if (is_favorite !== undefined) updates.is_favorite = is_favorite;

      const updatedPassword = await this.passwordModel.update(passwordId, userId, updates);
      if (!updatedPassword) {
        res.status(404).json({ error: 'Password not found' });
        return;
      }

      res.json({
        message: 'Password updated successfully',
        password: updatedPassword
      });

    } catch (error) {
      console.error('Update password error:', error);
      res.status(500).json({ error: 'Failed to update password' });
    }
  };

  /**
   * Delete a password entry
   */
  public delete = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user.id;
      const passwordId = parseInt(req.params.id);

      if (isNaN(passwordId)) {
        res.status(400).json({ error: 'Invalid password ID' });
        return;
      }

      const deleted = await this.passwordModel.delete(passwordId, userId);
      if (!deleted) {
        res.status(404).json({ error: 'Password not found' });
        return;
      }

      res.json({ message: 'Password deleted successfully' });

    } catch (error) {
      console.error('Delete password error:', error);
      res.status(500).json({ error: 'Failed to delete password' });
    }
  };

  /**
   * Get dashboard statistics
   */
  public getStats = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user.id;
      const stats = await this.passwordModel.getStats(userId);

      res.json({ stats });

    } catch (error) {
      console.error('Get stats error:', error);
      res.status(500).json({ error: 'Failed to retrieve statistics' });
    }
  };

  /**
   * Bulk delete passwords
   */
  public bulkDelete = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user.id;
      const { passwordIds } = req.body;

      if (!Array.isArray(passwordIds) || passwordIds.length === 0) {
        res.status(400).json({ error: 'Password IDs array is required' });
        return;
      }

      let deletedCount = 0;
      for (const passwordId of passwordIds) {
        const deleted = await this.passwordModel.delete(parseInt(passwordId), userId);
        if (deleted) deletedCount++;
      }

      res.json({
        message: `${deletedCount} passwords deleted successfully`,
        deletedCount
      });

    } catch (error) {
      console.error('Bulk delete error:', error);
      res.status(500).json({ error: 'Failed to delete passwords' });
    }
  };
}

// Validation rules
export const passwordValidation = [
  body('title')
    .isLength({ min: 1, max: 100 })
    .trim()
    .withMessage('Title is required and must be 1-100 characters'),
  body('url')
    .isURL()
    .withMessage('Valid URL is required'),
  body('username')
    .isLength({ min: 1, max: 100 })
    .trim()
    .withMessage('Username is required and must be 1-100 characters'),
  body('password')
    .isLength({ min: 1 })
    .withMessage('Password is required'),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes must be less than 1000 characters'),
  body('category')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Category must be less than 50 characters'),
  body('is_favorite')
    .optional()
    .isBoolean()
    .withMessage('is_favorite must be a boolean')
];

export const passwordUpdateValidation = [
  body('title')
    .optional()
    .isLength({ min: 1, max: 100 })
    .trim()
    .withMessage('Title must be 1-100 characters'),
  body('url')
    .optional()
    .isURL()
    .withMessage('Valid URL is required'),
  body('username')
    .optional()
    .isLength({ min: 1, max: 100 })
    .trim()
    .withMessage('Username must be 1-100 characters'),
  body('password')
    .optional()
    .isLength({ min: 1 })
    .withMessage('Password cannot be empty'),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes must be less than 1000 characters'),
  body('category')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Category must be less than 50 characters'),
  body('is_favorite')
    .optional()
    .isBoolean()
    .withMessage('is_favorite must be a boolean')
];