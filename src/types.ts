export interface ListResponse<T> {
  total: number;
  page: number;
  count: number;
  items: T[];
}
