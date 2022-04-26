import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserModule } from '../user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppConfig } from '../../config/configuration';
import { AuthResolver } from './resolvers/auth.resolver';

@Module({
  imports: [
    UserModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService<AppConfig>) => ({
        secret: configService.get<string>('secret'),
      }),
    }),
  ], // import user module
  controllers: [AuthController],
  providers: [AuthService, AuthResolver],
  exports: [AuthService],
})
export class AuthModule {}
