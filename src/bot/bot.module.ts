import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { UsersModule } from '../users/users.module';
import { BotUpdate } from './bot.update';
import { QuizService } from './quiz.service';

@Module({
  imports: [
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const token = configService.get<string>('app.botToken');
        if (!token) {
          throw new Error('BOT_TOKEN is not defined in environment variables');
        }
        return { token, include: [BotModule] };
      },
      inject: [ConfigService],
    }),
    UsersModule,
  ],
  providers: [BotUpdate, QuizService],
})
export class BotModule {}
