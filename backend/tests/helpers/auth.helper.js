import bcrypt from 'bcrypt';
import prisma from '../../src/config/prisma.js';
import env from '../../src/config/env.js';
import { signAccessToken } from '../../src/utils/jwt.js';

let counter = 1;

export function getUniqueId() {
  return `${Date.now()}_${counter++}`;
}

export async function createTestUser({
  name = 'Test User',
  email = null,
  password = 'Password123!',
  role = 'CUSTOMER',
  status = 'ACTIVE'
} = {}) {
  const uid = getUniqueId();
  const finalEmail = email || `user_${uid}@test.com`;
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name: `${name} ${uid}`,
      email: finalEmail,
      password: hashedPassword,
      role,
      status
    }
  });

  const token = signAccessToken({ sub: user.id, role: user.role });

  return { user, token, rawPassword: password };
}

export async function createTestSeller({
  user = null,
  storeName = null
} = {}) {
  const sellerUser = user || (await createTestUser({ role: 'SELLER' })).user;
  const uid = getUniqueId();

  const seller = await prisma.seller.create({
    data: {
      userId: sellerUser.id,
      storeName: storeName || `Store ${uid}`,
      status: 'ACTIVE'
    }
  });

  const token = signAccessToken({ sub: sellerUser.id, role: 'SELLER' });

  return { seller, user: sellerUser, token };
}

export async function createTestCategory({
  name = 'Category',
  slug = null,
  isActive = true
} = {}) {
  const uid = getUniqueId();
  return prisma.category.create({
    data: {
      name: `${name} ${uid}`,
      slug: slug || `cat-${uid}`,
      isActive
    }
  });
}

export async function createTestProduct({
  sellerId,
  categoryId,
  name = 'Product',
  sku = null,
  price = 1000,
  stock = 10,
  discount = 0,
  status = 'ACTIVE'
} = {}) {
  const uid = getUniqueId();
  return prisma.product.create({
    data: {
      sellerId,
      categoryId,
      name: `${name} ${uid}`,
      sku: sku || `SKU-${uid}`,
      price,
      stock,
      discount,
      status
    }
  });
}

export default {
  getUniqueId,
  createTestUser,
  createTestSeller,
  createTestCategory,
  createTestProduct
};
