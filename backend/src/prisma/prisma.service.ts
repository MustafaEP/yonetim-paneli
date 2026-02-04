import { Injectable, OnModuleInit, INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();

    // Soft delete middleware
    // Not: $use middleware API'si Prisma Client'da mevcut olmayabilir
    // Bu durumda middleware atlanır ve soft delete işlevselliği service katmanında handle edilmelidir
    try {
      if (typeof (this as any).$use === 'function') {
        (this as any).$use(async (params, next) => {
          const softDeleteModels = [
            'User',
            'Member',
            'CustomRole',
            'MemberPayment',
            'MemberDocument',
          ];

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
              const modelsWithIsActive = ['User', 'Member', 'CustomRole'];
              params.args['data'] = {
                deletedAt: new Date(),
                ...(modelsWithIsActive.includes(params.model || '') && {
                  isActive: false,
                }),
              };
            }

            // deleteMany → soft deleteMany
            if (params.action === 'deleteMany') {
              params.action = 'updateMany';
              const modelsWithIsActive = ['User', 'Member', 'CustomRole'];
              params.args['data'] = {
                deletedAt: new Date(),
                ...(modelsWithIsActive.includes(params.model || '') && {
                  isActive: false,
                }),
              };
            }
          }

          return next(params);
        });
      }
    } catch (error) {
      // Middleware mevcut değilse sessizce atla
      // Soft delete işlevselliği service katmanında handle edilmelidir
      console.warn(
        'Prisma $use middleware is not available. Soft delete must be handled at service layer.',
      );
    }
  }

  async enableShutdownHooks(app: INestApplication) {
    (this as any).$on('beforeExit', async () => {
      await app.close();
    });
  }
}
