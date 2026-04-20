export interface Category {
  categoryId: string;
  parentId: string | null;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  deletedAt: string | null;
  productCount: number;
  children: Category[];
}
