import { Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { SoftDeleteExtension } from './soft-delete.extension';
import { configuration } from 'src/modules/shared/configs/configuration';
import { SortExtension } from './sort.extension';

const logger = new Logger(extendClient.name);
export function extendClient(base: PrismaClient) {
  const config = configuration();
  if (!config.dbReplicaConfig.url) {
    logger.warn('Replica database is not configured. Using primary database.');
  }
  const dbReplicaUrl = config.dbReplicaConfig.url || config.dbConfig.url;
  return base
    .$extends(SoftDeleteExtension)
    .$extends(SortExtension)
  // .$extends(
  //   readReplicas({
  //     url: [dbReplicaUrl]
  //   })
  // );
  // .$extends(
  //   // we got error with transaction, https://github.com/olivierwilkinson/prisma-extension-soft-delete/issues/24, let waiting for the fix
  //   createSoftDeleteExtension({
  //     models: {
  //       User: true,
  //       Task: true,
  //       Property: true,
  //       PropertyGroup: true,
  //       ChecklistMapProperty: true,
  //       Issue: true,
  //       ChecklistCategory: true,
  //       Role: true,
  //       Team: true,
  //       Audit: true,
  //       Clean: true,
  //       Maintenance: true,
  //       Checklist: true
  //     },
  //     defaultConfig: {
  //       field: 'deletedAt',
  //       createValue: (deletedAt) => {
  //         if (deletedAt) return new Date();
  //         return null;
  //       }
  //     }
  //   })
  // )
}

// class UntypedExtendedClient extends PrismaClient {
//   constructor(options?: ConstructorParameters<typeof PrismaClient>[0]) {
//     super(options);

//     return extendClient(this) as this;
//   }
// }

// export const ExtendedPrismaClient = UntypedExtendedClient as unknown as new (
//   options?: ConstructorParameters<typeof PrismaClient>[0]
// ) => ReturnType<typeof extendClient>;
