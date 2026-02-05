import { Logger, LogLevel } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { AppConfig } from './config/app.config';
import { envConfig } from './config/env.config';

async function bootstrap() {
  const logLevels: LogLevel[] = envConfig.isProduction
    ? ['error', 'warn']
    : ['log', 'error', 'warn', 'debug', 'verbose'];

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: envConfig.isDevelopment,
      trustProxy: true,
    }),
    { logger: logLevels },
  );

  await AppConfig.setup(app);
  await app.listen({ host: '0.0.0.0', port: envConfig.port }, async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
    Logger.log(`Server is running!`);
    Logger.log(`API Documentation: http://localhost:${envConfig.port}/docs`);
    Logger.log(
      `Swagger JSON: http://localhost:${envConfig.port}/swagger/json`,
    );
    Logger.log(
      `Swagger YAML: http://localhost:${envConfig.port}/swagger/yaml\n`,
    );
  });
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
