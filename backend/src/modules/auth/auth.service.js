import bcrypt from 'bcrypt';
import authRepository from './auth.repository.js';
import AppError from '../../utils/AppError.js';
import { signAccessToken } from '../../utils/jwt.js';

const BCRYPT_SALT_ROUNDS = 10;

export class AuthService {
  async registerUser({ name, email, password }) {
    const normalizedEmail = email.trim().toLowerCase();

    // 1. Pre-check for duplicate email
    const existingUser = await authRepository.findUserByEmailForRegistration(normalizedEmail);
    if (existingUser) {
      throw new AppError('Email is already registered', 409);
    }

    // 2. Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    try {
      // 3. Create user with strictly enforced default role and status
      const user = await authRepository.createUser({
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: 'CUSTOMER',
        status: 'ACTIVE'
      });

      return user;
    } catch (error) {
      // Handle potential race condition unique constraint violation
      if (error.code === 'P2002') {
        throw new AppError('Email is already registered', 409);
      }
      throw error;
    }
  }

  async loginUser({ email, password }) {
    const normalizedEmail = email.trim().toLowerCase();

    // 1. Retrieve user with password hash internally for authentication
    const user = await authRepository.findUserByEmailForLogin(normalizedEmail);

    // 2. Generic auth error to prevent user enumeration
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    // 3. Check account status
    if (user.status === 'SUSPENDED') {
      throw new AppError('Account is suspended', 403);
    }

    // 4. Verify password with bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    // 5. Generate signed JWT access token
    const accessToken = signAccessToken({
      sub: user.id,
      role: user.role
    });

    // 6. Return safe user data with access token
    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      },
      accessToken
    };
  }
}

export default new AuthService();
