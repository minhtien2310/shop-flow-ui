export interface PaginatedList<T> {
  items: T[];
  totalNumberOfItems: number;
  currentPage: number;
}
