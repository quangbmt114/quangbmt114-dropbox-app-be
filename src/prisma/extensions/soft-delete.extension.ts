import { Prisma } from '@prisma/client';

const SOFT_DELETE_FIELD = 'deletedAt';

// Models that support soft delete
const SOFT_DELETE_MODELS = ['User', 'File'];

export const SoftDeleteExtension = Prisma.defineExtension({
  name: 'soft-delete',
  query: {
    $allOperations({ model, operation, args, query }) {
      // Only apply to models with soft delete support
      if (model && SOFT_DELETE_MODELS.includes(model)) {
        // Automatically filter out soft-deleted records on read operations
        if (['findUnique', 'findFirst', 'findMany', 'count', 'aggregate'].includes(operation)) {
          args.where = args.where || {};
          
          // Only add deletedAt: null if not explicitly set
          if (args.where[SOFT_DELETE_FIELD] === undefined) {
            args.where[SOFT_DELETE_FIELD] = null;
          }
        }

        // Convert delete operations to soft deletes (update deletedAt)
        if (operation === 'delete') {
          operation = 'update';
          args.data = { [SOFT_DELETE_FIELD]: new Date() };
        }

        // Convert deleteMany to updateMany
        if (operation === 'deleteMany') {
          operation = 'updateMany';
          args.data = { [SOFT_DELETE_FIELD]: new Date() };
        }
      }

      return query(args);
    },
  },
  model: {
    $allModels: {
      // Add custom method to force delete (hard delete)
      async forceDelete<T>(this: T, where: any) {
        const context = Prisma.getExtensionContext(this);
        return (context as any).delete({ where });
      },

      // Add custom method to restore soft-deleted records
      async restore<T>(this: T, where: any) {
        const context = Prisma.getExtensionContext(this);
        return (context as any).update({
          where,
          data: { [SOFT_DELETE_FIELD]: null },
        });
      },

      // Add custom method to find with deleted records
      async findManyWithDeleted<T>(this: T, args: any) {
        const context = Prisma.getExtensionContext(this);
        const originalWhere = args?.where || {};
        
        // Remove the deletedAt filter to include deleted records
        delete originalWhere[SOFT_DELETE_FIELD];
        
        return (context as any).findMany({
          ...args,
          where: originalWhere,
        });
      },
    },
  },
});

export type SoftDeleteExtensionType = ReturnType<typeof SoftDeleteExtension>;

