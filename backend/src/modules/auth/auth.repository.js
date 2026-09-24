import prisma from '../../config/prisma.js';

export class AuthRepository {
  /**
   * Safe projection for duplicate email registration checks (excludes password hash).
   */
  async findUserByEmailForRegistration(email) {
    return prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true
      }
    });
  }

  // Alias for backward compatibility
  async findUserByEmail(email) {
    return this.findUserByEmailForRegistration(email);
  }

  /**
   * Internal retrieval for login authentication; retrieves password hash for server-side bcrypt comparison.
   * NEVER exposed to the client.
   */
  async findUserByEmailForLogin(email) {
    return prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        role: true,
        status: true,
        createdAt: true
      }
    });
  }

  // Alias for backward compatibility
  async findUserForLoginByEmail(email) {
    return this.findUserByEmailForLogin(email);
  }

  async createUser({ name, email, password, role = 'CUSTOMER', status = 'ACTIVE' }) {
    return prisma.user.create({
      data: {
        name,
        email,
        password,
        role,
        status
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true
      }
    });
  }
}

export default new AuthRepository();
