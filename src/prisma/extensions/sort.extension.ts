import { Prisma } from '@prisma/client';

const DEFAULT_SORT_FIELD = 'id';
const DEFAULT_SORT_DIRECTION: Prisma.SortOrder = 'asc';

export const SortExtension = Prisma.defineExtension({
  name: 'sort',

  query: {
    $allModels: {
      findMany({ model, args, query }) {
        if (!model) {
          return query(args);
        }

        const normalizedOrderBy = normalizeOrderBy(args?.orderBy);

        return query({
          ...args,
          orderBy: normalizedOrderBy
        });
      }
    }
  }
});

/**
 * Normalize orderBy and ensure stable sorting by id
 */
function normalizeOrderBy(orderBy: any) {
  if (!orderBy) {
    return {
      [DEFAULT_SORT_FIELD]: DEFAULT_SORT_DIRECTION
    };
  }

  if (Array.isArray(orderBy)) {
    const filtered = orderBy.filter(isValidOrderObject);

    const fields = filtered.map((o) => Object.keys(o)[0]);

    if (fields.includes(DEFAULT_SORT_FIELD)) {
      return filtered;
    }

    return [
      ...filtered,
      {
        [DEFAULT_SORT_FIELD]: DEFAULT_SORT_DIRECTION
      }
    ];
  }

  if (isPlainObject(orderBy)) {
    const keys = Object.keys(orderBy);

    if (keys.includes(DEFAULT_SORT_FIELD)) {
      return orderBy;
    }

    return [
      orderBy,
      {
        [DEFAULT_SORT_FIELD]: DEFAULT_SORT_DIRECTION
      }
    ];
  }

  return orderBy;
}

/**
 * Validate orderBy item
 */
function isValidOrderObject(obj: any): boolean {
  if (!obj || typeof obj !== 'object') return false;

  const keys = Object.keys(obj);
  if (!keys.length) return false;

  const value = obj[keys[0]];

  // Case 1: simple sort
  if (value === 'asc' || value === 'desc') {
    return true;
  }

  // Case 2: SortOrderInput
  if (typeof value === 'object' && (value.sort === 'asc' || value.sort === 'desc')) {
    return true;
  }

  return false;
}

/**
 * Lightweight object check
 */
function isPlainObject(value: any): boolean {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
