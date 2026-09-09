import { describe, expect, it } from 'vitest';
import { paginate, paginationQuerySchema, toSkipTake } from '../src/pagination';

describe('pagination', () => {
  it('parses query defaults', () => {
    const parsed = paginationQuerySchema.parse({});
    expect(parsed).toEqual({ page: 1, pageSize: 20 });
  });

  it('maps page to skip/take', () => {
    expect(toSkipTake({ page: 3, pageSize: 20 })).toEqual({ skip: 40, take: 20 });
  });

  it('builds a paginated envelope', () => {
    const result = paginate(['a', 'b'], 42, { page: 2, pageSize: 2 });
    expect(result.pagination).toEqual({
      page: 2,
      pageSize: 2,
      total: 42,
      totalPages: 21,
    });
  });
});
