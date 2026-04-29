# 🤖 Telegram Bot Backend

Production-ready Telegram bot built with **NestJS**, **MongoDB (Mongoose)**, and **nestjs-telegraf**.

---

## 📁 Project Structure

```
telegram-bot/
├── src/
│   ├── app.module.ts               # Root module
│   ├── main.ts                     # Entry point
│   │
│   ├── config/
│   │   └── app.config.ts           # Typed config factory
│   │
│   ├── database/
│   │   └── database.module.ts      # Mongoose connection
│   │
│   ├── users/
│   │   ├── dto/
│   │   │   └── create-user.dto.ts  # Validated DTO
│   │   ├── schemas/
│   │   │   └── user.schema.ts      # Mongoose schema + enum
│   │   ├── users.module.ts
│   │   └── users.service.ts        # DB operations
│   │
│   └── bot/
│       ├── keyboards/
│       │   └── main.keyboard.ts    # Reusable keyboard markup
│       ├── bot.module.ts           # Telegraf setup
│       └── bot.update.ts           # All Telegram handlers
│
├── .env.example
├── nest-cli.json
├── package.json
└── tsconfig.json
```

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

| Variable    | Description                              | Example                          |
|-------------|------------------------------------------|----------------------------------|
| `BOT_TOKEN` | Telegram bot token from @BotFather       | `123456:ABC-xyz`                 |
| `MONGO_URI` | MongoDB connection string                | `mongodb://localhost:27017/bot`  |
| `ADMIN_ID`  | Your Telegram user ID (for admin access) | `123456789`                      |

> **Tip:** Get your Telegram ID by messaging [@userinfobot](https://t.me/userinfobot).

---

## 🚀 Installation & Running

### Prerequisites
- Node.js ≥ 18
- MongoDB running locally or a MongoDB Atlas URI
- A Telegram bot token (create one via [@BotFather](https://t.me/botfather))

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your values
```

### 3. Run in development mode (with hot reload)

```bash
npm run start:dev
```

### 4. Run in production mode

```bash
npm run build
npm run start:prod
```

---

## 🤖 Bot Features

### `/start`
Sends a welcome message and shows the main keyboard with two buttons.

### 📝 Register
- Reads the user's Telegram profile (ID, name, username)
- Saves them to MongoDB
- Prevents duplicate registrations (by `telegramId`)
- Responds with a success or "already registered" message

### 👥 Students List *(admin only)*
- Checks whether the sender's ID matches `ADMIN_ID`
- Fetches all registered users from MongoDB
- Returns a formatted list: `1. Full Name @username`

---

## 🗂️ User Schema

```ts
{
  telegramId: number;   // unique
  fullName:   string;
  username:   string;   // optional, defaults to ''
  role:       'student' | 'admin';  // defaults to 'student'
  createdAt:  Date;     // auto-set by Mongoose timestamps
}
```

---

## 🛡️ Architecture Highlights

| Concern            | Solution                                      |
|--------------------|-----------------------------------------------|
| Config management  | `@nestjs/config` with typed `registerAs`      |
| Validation         | `class-validator` DTOs on all inputs          |
| Duplicate users    | MongoDB unique index + `ConflictException`    |
| Admin guard        | Runtime check against `ADMIN_ID` env var      |
| Error handling     | try/catch in every handler, structured logging|
| Scalability        | Each feature is an isolated NestJS module     |

---

## 📝 Notes

- The bot uses **long-polling** by default — no webhook server required.
- To switch to webhooks for production, update `TelegrafModule.forRootAsync` in `bot.module.ts` with a `launchOptions.webhook` config.
- All Mongoose queries use `.lean()` where documents don't need Mongoose methods, for better performance.
