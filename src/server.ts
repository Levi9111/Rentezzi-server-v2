import mongoose from 'mongoose';
import app from './app';
import config from './app/config';

let server: any;

async function bootstrap() {
  try {
    await mongoose.connect(config.database_url as string);
    console.info('✅ Database connected');

    server = app.listen(config.port, () => {
      console.info(`🚀 Server running on port ${config.port}`);
    });
  } catch (error) {
    console.error('❌ Server startup failed', error);
  }
}

bootstrap();

process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled Rejection', reason);

  if (server) {
    server.close(() => {
      process.exit(1);
    });
  }
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception', error);
  process.exit(1);
});
