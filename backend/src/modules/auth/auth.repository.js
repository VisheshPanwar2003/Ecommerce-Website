import prisma from '../../config/prisma.js';

export class AuthRepository {
  async findUserByEmail(email) {
    return prisma.user.findUnique({
      where: { email }
    });
  }

  async findUserForLoginByEmail(email) {
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
