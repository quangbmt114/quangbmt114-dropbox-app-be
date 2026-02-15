import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { SoftDeleteExtension } from './extensions/soft-delete.extension';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  extendedClient: ReturnType<typeof this.createExtendedClient>;

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);

    super({
      adapter,
      log: ['query', 'info', 'warn', 'error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
    
    // Create extended client with soft delete support
    this.extendedClient = this.createExtendedClient();

    // Create a proxy to transparently use extended client
    const prismaProxy = new Proxy(this, {
      get: (target, property) => {
        // If property exists on extended client, use it
        if (property in this.extendedClient) {
          return Reflect.get(this.extendedClient, property);
        }
        // Otherwise, use original PrismaClient
        return Reflect.get(target, property);
      },
    });

    // Apply proxy to this instance
    Object.assign(this, prismaProxy);
  }

  private createExtendedClient() {
    return this.$extends(SoftDeleteExtension);
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

