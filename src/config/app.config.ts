import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  botToken: process.env.BOT_TOKEN,
  mongoUri: process.env.MONGO_URI,
  adminId: parseInt(process.env.ADMIN_ID ?? '0', 10),
  port: parseInt(process.env.PORT ?? '3000', 10),
}));
