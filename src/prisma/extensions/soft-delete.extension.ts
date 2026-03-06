import { Prisma } from '@prisma/client';

const SOFT_DELETE_FIELD = 'deletedAt';

/**
 * Prisma extension for soft delete functionality
 * Automatically filters out soft-deleted records and converts delete operations to updates
 */
export const SoftDeleteExtension = Prisma.defineExtension({
  name: 'soft-delete',
  query: {
    user: {
      // Intercept findUnique to exclude soft-deleted records
      async findUnique({ args, query }) {
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
      // Intercept findFirst to exclude soft-deleted records
      async findFirst({ args, query }) {
        if (!args.where) args.where = {};
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
      // Intercept findMany to exclude soft-deleted records
      async findMany({ args, query }) {
        if (!args.where) args.where = {};
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
      // Intercept count to exclude soft-deleted records
      async count({ args, query }) {
        if (!args.where) args.where = {};
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
    },
    file: {
      // Intercept findUnique to exclude soft-deleted records
      async findUnique({ args, query }) {
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
      // Intercept findFirst to exclude soft-deleted records
      async findFirst({ args, query }) {
        if (!args.where) args.where = {};
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
      // Intercept findMany to exclude soft-deleted records
      async findMany({ args, query }) {
        if (!args.where) args.where = {};
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
      // Intercept count to exclude soft-deleted records
      async count({ args, query }) {
        if (!args.where) args.where = {};
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
    },
  },
});

export type SoftDeleteExtensionType = ReturnType<typeof SoftDeleteExtension>;
