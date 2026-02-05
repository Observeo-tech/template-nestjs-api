import { FastifySessionOptions } from '@fastify/session';
import { Logger } from '@nestjs/common';
import * as ConnectRedis from 'connect-redis';
import { createClient } from 'redis';
import { envConfig } from './env.config';

export async function createSessionConfig(): Promise<FastifySessionOptions> {
  const redisClient = createClient({
    socket: {
      host: envConfig.redis.host,
      port: envConfig.redis.port,
    },
    password: envConfig.redis.password,
    database: envConfig.redis.db,
  });

  redisClient.on('error', (err) => Logger.error('Redis Session Error:', err));
  await redisClient.connect();

  const RedisStore = ConnectRedis.RedisStore;
  const store = new (RedisStore as any)({
    client: redisClient,
    prefix: 'session:',
    ttl: 86400 * 7, // 7 dias em segundos
  });

  return {
    store,
    secret: process.env.SESSION_SECRET || 'change-this-secret-in-production',
    cookie: {
      secure: envConfig.isProduction,
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 dias em milissegundos
      sameSite: 'lax',
      path: '/',
    },
    saveUninitialized: false,
  };
}
