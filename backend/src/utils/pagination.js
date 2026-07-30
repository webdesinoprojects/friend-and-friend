function parsePagination(query = {}, { defaultPageSize = 25, maxPageSize = 100 } = {}) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const pageSize = Math.min(
    maxPageSize,
    Math.max(1, Number.parseInt(query.pageSize || query.limit, 10) || defaultPageSize)
  );
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}

function paginationMeta({ page, pageSize, total }) {
  return {
    page,
    pageSize,
    total,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
    hasNextPage: page * pageSize < total,
  };
}

module.exports = { parsePagination, paginationMeta };
