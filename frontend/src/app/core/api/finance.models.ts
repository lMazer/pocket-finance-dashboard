export type TransactionType = 'INCOME' | 'EXPENSE';

export interface PageResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface CategoryCreateRequest {
  name: string;
  color: string;
}

export interface CategoryUpdateRequest {
  name: string;
  color: string;
}

export interface Transaction {
  id: string;
  categoryId: string;
  categoryName: string;
  type: TransactionType;
  description: string;
  amount: number;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionCreateRequest {
  categoryId: string;
  type: TransactionType;
  description: string;
  amount: number;
  date: string;
}

export interface TransactionUpdateRequest {
  categoryId?: string;
  type?: TransactionType;
  description?: string;
  amount?: number;
  date?: string;
}

export interface TransactionListQuery {
  month?: string | null;
  category?: string | null;
  type?: TransactionType | null;
  q?: string | null;
  page?: number;
}

export interface Budget {
  id: string;
  categoryId: string;
  categoryName: string;
  month: string;
  amount: number;
}

export interface BudgetCreateRequest {
  month: string;
  categoryId: string;
  amount: number;
}

export interface BudgetUpdateRequest {
  amount: number;
}
