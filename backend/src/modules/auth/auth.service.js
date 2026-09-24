import bcrypt from 'bcrypt';
import authRepository from './auth.repository.js';
import AppError from '../../utils/AppError.js';

const BCRYPT_SALT_ROUNDS = 10;

export class AuthService {
  async registerUser({ name, email, password }) {
    const normalizedEmail = email.trim().toLowerCase();

    // 1. Pre-check for duplicate email
    const existingUser = await authRepository.findUserByEmail(normalizedEmail);
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
}

export default new AuthService();
