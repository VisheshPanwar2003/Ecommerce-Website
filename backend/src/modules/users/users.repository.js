import prisma from '../../config/prisma.js';

export class UsersRepository {
  async findUserProfileById(userId) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    });
  }

  async updateUserProfile(userId, { name }) {
    return prisma.user.update({
      where: { id: userId },
      data: { name },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    });
  }

  async findAddressesByUserId(userId) {
    return prisma.address.findMany({
      where: { userId },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    });
  }

  async findAddressByIdAndUserId(addressId, userId) {
    return prisma.address.findFirst({
      where: {
        id: addressId,
        userId
      }
    });
  }

  async createAddress(userId, addressData) {
    const { isDefault, ...rest } = addressData;

    if (isDefault) {
      return prisma.$transaction(async (tx) => {
        await tx.address.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false }
        });

        return tx.address.create({
          data: {
            ...rest,
            isDefault: true,
            userId
          }
        });
      });
    }

    return prisma.address.create({
      data: {
        ...rest,
        isDefault: isDefault ?? false,
        userId
      }
    });
  }

  async updateAddress(addressId, userId, updateData) {
    const { isDefault, ...rest } = updateData;

    if (isDefault) {
      return prisma.$transaction(async (tx) => {
        await tx.address.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false }
        });

        return tx.address.update({
          where: { id: addressId },
          data: {
            ...rest,
            isDefault: true
          }
        });
      });
    }

    return prisma.address.update({
      where: { id: addressId },
      data: updateData
    });
  }

  async deleteAddress(addressId) {
    return prisma.address.delete({
      where: { id: addressId }
    });
  }
}

export default new UsersRepository();
