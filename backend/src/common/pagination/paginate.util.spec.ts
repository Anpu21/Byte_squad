import { resolvePagination, toPaginated } from './paginate.util';

describe('resolvePagination', () => {
  it('defaults to page 1 and DEFAULT_PAGE_SIZE', () => {
    expect(resolvePagination({})).toEqual({ page: 1, limit: 10, skip: 0 });
  });

  it('computes skip from page and limit', () => {
    expect(resolvePagination({ page: 3, limit: 10 })).toEqual({
      page: 3,
      limit: 10,
      skip: 20,
    });
  });

  it('floors an out-of-range page to a safe minimum', () => {
    expect(resolvePagination({ page: 0 }).page).toBe(1);
    expect(resolvePagination({ page: -5 }).page).toBe(1);
  });

  it('caps limit at MAX_PAGE_SIZE', () => {
    expect(resolvePagination({ limit: 1000 }).limit).toBe(100);
  });
});

describe('toPaginated', () => {
  it('builds the envelope with derived totalPages', () => {
    expect(toPaginated([1, 2], 25, 1, 10)).toEqual({
      items: [1, 2],
      total: 25,
      page: 1,
      limit: 10,
      totalPages: 3,
    });
  });

  it('reports at least one page for an empty list', () => {
    expect(toPaginated([], 0, 1, 10).totalPages).toBe(1);
  });
});
