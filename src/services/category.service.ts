import prisma from '../config/prisma';

export default class CategoryService {
  async getAllCategories() {
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    return categories;
  }
}
