import { Injectable, OnModuleInit, INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();

    // Soft delete middleware
    this.$use(async (params, next) => {
      const softDeleteModels = ['User', 'Member', 'CustomRole'];

      if (params.model && softDeleteModels.includes(params.model)) {
        // findMany, findFirst, findUnique -> deletedAt null filtrele
        if (['findMany', 'findFirst'].includes(params.action)) {
          params.args = params.args || {};
          params.args.where = params.args.where || {};
          if (params.args.where.deletedAt === undefined) {
            params.args.where.deletedAt = null;
          }
        }

        if (params.action === 'findUnique') {
          params.action = 'findFirst';
          params.args = {
            where: {
              ...params.args.where,
              deletedAt: null,
            },
          };
        }

        // delete → soft delete
        if (params.action === 'delete') {
          params.action = 'update';
          params.args['data'] = {
            deletedAt: new Date(),
            isActive: false,
          };
        }

        // deleteMany → soft deleteMany
        if (params.action === 'deleteMany') {
          params.action = 'updateMany';
          params.args['data'] = {
            deletedAt: new Date(),
            isActive: false,
          };
        }
      }

      return next(params);
    });



  }

  async enableShutdownHooks(app: INestApplication) {
  (this as any).$on('beforeExit', async () => {
    await app.close();
  });
}

}
