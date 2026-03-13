/**
 * Type shim when Prisma client is not yet generated (e.g. before `prisma generate`).
 * @prisma/client re-exports from '.prisma/client/default'; this file is used via tsconfig paths when that module is missing.
 */
declare module '.prisma/client/default' {
  export class PrismaClient {
    $connect(): Promise<void>;
    $disconnect(): Promise<void>;
    $on(event: string, callback: (e: unknown) => void): void;
    $extends<T>(extension: T): PrismaClient;
  }

  export namespace Prisma {
    interface QueryEvent {
      query: string;
      params: string;
      duration: number;
    }
    type ModelName = string;
    type SortOrder = 'asc' | 'desc';
    function defineExtension(args: unknown): (client: unknown) => unknown;
  }
}
