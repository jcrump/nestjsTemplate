import { HealthModule } from './modules/health/health.module';
import { DatabaseModule } from './database/database.module';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import configuration, {
  LoggerConfig,
  LoggerFormat,
} from './config/configuration';
import { AppConfig } from './config/configuration';
import { APP_GUARD } from '@nestjs/core';
import { JwtGuard } from './common/guards/jwt.guard';
import { AuthModule } from 'modules/auth/auth.module';
import { UserModule } from 'modules/user/user.module';
import { GraphQLModule } from '@nestjs/graphql';
import { DataloaderModule } from 'dataloader/dataloader.module';
import { DataloaderService } from 'dataloader/dataloader.service';
import { join } from 'path';
import { formatGraphQLError } from 'common/graphql/errors';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig>) => {
        const loggerConfig = config.get<LoggerConfig>('logger');

        return {
          pinoHttp: [
            {
              level: loggerConfig.level,
              prettyPrint: loggerConfig.format === LoggerFormat.Pretty,
              formatters: {
                level: (label: string) => {
                  return { level: label };
                },
              },
            },
          ],
        };
      },
    }),
    GraphQLModule.forRootAsync({
      imports: [DataloaderModule],
      inject: [DataloaderService],
      useFactory: (dataloaderService: DataloaderService) => {
        return {
          autoSchemaFile: join(process.cwd(), 'src', 'schema.gql'),
          debug: true,
          playground: true,
          introspection: true,
          formatError: formatGraphQLError,
          context: () => ({
            loaders: dataloaderService.createLoaders(),
          }),
        };
      },
    }),
    DatabaseModule,

    // Http modules
    AuthModule,
    UserModule,
    HealthModule,
  ],
  providers: [
    Logger,
    // we set all routes to be private by default
    // use `@Public()` to make them public
    {
      provide: APP_GUARD,
      useClass: JwtGuard,
      inject: [AuthModule], // this guards depends on AuthService which is a part of AuthModule
    },
  ],
})
export class AppModule {}
