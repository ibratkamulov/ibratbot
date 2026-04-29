import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './users/users.module';
import { BotModule } from './bot/bot.module';
import appConfig from './config/app.config';

@Module({
  imports: [
    // Load .env globally and make it available everywhere
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      envFilePath: '.env',
    }),
    DatabaseModule,
    UsersModule,
    BotModule,
  ],
})
export class AppModule {}
