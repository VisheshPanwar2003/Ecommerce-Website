import usersRepository from './users.repository.js';
import AppError from '../../utils/AppError.js';

export class UsersService {
  async getProfile(userId) {
    const user = await usersRepository.findUserProfileById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return user;
  }

  async updateProfile(userId, { name }) {
    const user = await usersRepository.findUserProfileById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    return usersRepository.updateUserProfile(userId, { name: name.trim() });
  }

  async getAddresses(userId) {
    return usersRepository.findAddressesByUserId(userId);
  }

  async createAddress(userId, addressData) {
    return usersRepository.createAddress(userId, addressData);
  }

  async updateAddress(addressId, userId, updateData) {
    const existingAddress = await usersRepository.findAddressByIdAndUserId(addressId, userId);
    if (!existingAddress) {
      throw new AppError('Address not found', 404);
    }

    return usersRepository.updateAddress(addressId, userId, updateData);
  }

  async deleteAddress(addressId, userId) {
    const existingAddress = await usersRepository.findAddressByIdAndUserId(addressId, userId);
    if (!existingAddress) {
      throw new AppError('Address not found', 404);
    }

    await usersRepository.deleteAddress(addressId);
  }
}

export default new UsersService();
