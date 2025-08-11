import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { User, IUser } from '../models/User.js';
import { generateToken } from '../middleware/auth.js';

export class AuthController {
  private userModel: User;

  constructor() {
    this.userModel = new User();
  }

  /**
   * Register a new user
   */
  public register = async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
        return;
      }

      const { username, email, password } = req.body;

      // Check if user already exists
      const existingUser = await this.userModel.exists(username, email);
      if (existingUser.username) {
        res.status(409).json({ error: 'Username already exists' });
        return;
      }
      if (existingUser.email) {
        res.status(409).json({ error: 'Email already exists' });
        return;
      }

      // Create new user
      const userData: IUser = { username, email, password };
      const newUser = await this.userModel.create(userData);

      // Generate JWT token
      const token = generateToken(newUser.id!);

      res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          created_at: newUser.created_at
        },
        token
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  };

  /**
   * Login user
   */
  public login = async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
        return;
      }

      const { identifier, password } = req.body; // identifier can be username or email

      // Verify credentials
      const user = await this.userModel.verifyCredentials(identifier, password);
      if (!user) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      // Generate JWT token
      const token = generateToken(user.id!);

      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          last_login: user.last_login
        },
        token
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  };

  /**
   * Get current user profile
   */
  public profile = async (req: any, res: Response): Promise<void> => {
    try {
      const userId = req.user.id;
      const user = await this.userModel.findById(userId);

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          created_at: user.created_at,
          last_login: user.last_login
        }
      });

    } catch (error) {
      console.error('Profile error:', error);
      res.status(500).json({ error: 'Failed to get profile' });
    }
  };

  /**
   * Update user profile
   */
  public updateProfile = async (req: any, res: Response): Promise<void> => {
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
      const { username, email } = req.body;

      // Check if new username/email already exists (excluding current user)
      const existingUser = await this.userModel.exists(username, email);
      const currentUser = await this.userModel.findById(userId);

      if (existingUser.username && currentUser?.username !== username) {
        res.status(409).json({ error: 'Username already exists' });
        return;
      }
      if (existingUser.email && currentUser?.email !== email) {
        res.status(409).json({ error: 'Email already exists' });
        return;
      }

      const updatedUser = await this.userModel.update(userId, { username, email });
      if (!updatedUser) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json({
        message: 'Profile updated successfully',
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          updated_at: updatedUser.updated_at
        }
      });

    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  };
}

// Validation rules
export const registerValidation = [
  body('username')
    .isLength({ min: 3, max: 50 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username must be 3-50 characters, alphanumeric and underscores only'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must be at least 8 characters with uppercase, lowercase, number, and special character')
];

export const loginValidation = [
  body('identifier')
    .notEmpty()
    .withMessage('Username or email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

export const updateProfileValidation = [
  body('username')
    .optional()
    .isLength({ min: 3, max: 50 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username must be 3-50 characters, alphanumeric and underscores only'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required')
];