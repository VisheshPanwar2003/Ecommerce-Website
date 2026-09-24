import prisma from '../../config/prisma.js';

export class HealthRepository {
  async pingDatabase() {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  }
}

export default new HealthRepository();
