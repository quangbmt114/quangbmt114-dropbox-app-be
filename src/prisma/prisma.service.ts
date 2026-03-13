import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { configuration } from '../modules/shared/configs/configuration';

export type CustomPrismaClient = ReturnType<typeof extendClient>;

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  extendsClient: CustomPrismaClient;

  constructor() {
    const { dbConfig } = configuration();
    // Enable query event emission only when DB_LOGGING=true
    super(
      dbConfig.logging
        ? {
            log: [
              { emit: 'event', level: 'query' },
              { emit: 'stdout', level: 'warn' },
              { emit: 'stdout', level: 'error' }
            ]
          }
        : {}
    );
    return this;
  }

  async onModuleInit() {
    const { dbConfig } = configuration();

    // Register query logger before connecting so no events are missed
    if (dbConfig.logging) {
      const slowMs = parseInt(process.env.DB_SLOW_QUERY_MS || '0');
      (this as any).$on('query', (e: Prisma.QueryEvent) => {
        if (slowMs > 0 && e.duration < slowMs) return; // skip fast queries when threshold set
        const tag = slowMs > 0 ? `[SLOW ${e.duration}ms]` : `[${e.duration}ms]`;
        const params = e.params && e.params !== '[]' ? ` | params: ${e.params}` : '';
        this.logger.log(`${tag} ${e.query}${params}`);
      });
    }

    await this.$connect();
    this.extendsClient = extendClient(this);

    const prismaProxy = new Proxy(this, {
      get: (target, property) =>
        Reflect.get(property in this.extendsClient ? this.extendsClient : target, property)
    });
    Object.assign(this, prismaProxy);
  }

  // get $replica(): CustomPrismaClient['$replica'] {
  //   return this.extendsClient.$replica;
  // }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
