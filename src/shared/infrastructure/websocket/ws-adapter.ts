import type { AppSessionContext } from '@/shared/context/app-session-context';
import { envConfig } from '@/config/env.config';
import { Logger } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createAdapter } from '@socket.io/redis-adapter';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { createClient, RedisClientType } from 'redis';
import type { ServerOptions, Socket } from 'socket.io';

type SessionAwareRequest = Partial<FastifyRequest> & {
  session?: AppSessionContext;
};

export class SessionIoAdapter extends IoAdapter {
  private readonly logger = new Logger(SessionIoAdapter.name);
  private readonly fastify: FastifyInstance;
  private pubClient?: RedisClientType;
  private subClient?: RedisClientType;
  private redisAdapter?: ReturnType<typeof createAdapter>;

  constructor(app: NestFastifyApplication) {
    super(app);
    this.fastify = app.getHttpAdapter().getInstance();
  }

  async connectToRedis(): Promise<void> {
    if (this.redisAdapter) {
      return;
    }

    this.pubClient = createClient({
      socket: {
        host: envConfig.redis.host,
        port: envConfig.redis.port,
      },
      password: envConfig.redis.password || undefined,
      database: envConfig.redis.db,
    });

    this.subClient = this.pubClient.duplicate();

    await Promise.all([
      this.pubClient.connect(),
      this.subClient.connect(),
    ]);

    this.redisAdapter = createAdapter(this.pubClient, this.subClient);
  }

  async dispose(): Promise<void> {
    await Promise.allSettled([
      this.pubClient?.quit(),
      this.subClient?.quit(),
    ]);
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, {
      ...options,
      path: envConfig.websocket.path,
      cors: {
        origin: true,
        credentials: true,
      },
      transports: envConfig.websocket.transports,
      connectionStateRecovery: {
        maxDisconnectionDuration:
          envConfig.websocket.connectionStateRecoveryMaxDisconnectionMs,
        skipMiddlewares: true,
      },
    });

    if (this.redisAdapter) {
      server.adapter(this.redisAdapter);
    }

    server.use((socket: Socket, next: (error?: Error) => void) => {
      void this.attachSession(socket)
        .then(() => next())
        .catch((error: unknown) => {
          const message = error instanceof Error
            ? error.message
            : 'Unable to resolve websocket session';

          this.logger.error(message, error instanceof Error ? error.stack : undefined);
          socket.data.session = {};
          next();
        });
    });

    return server;
  }

  private async attachSession(socket: Socket): Promise<void> {
    const cookieHeader = this.getHeaderValue(socket.handshake.headers.cookie);
    if (!cookieHeader) {
      socket.data.session = {};
      return;
    }

    const cookies = this.fastify.parseCookie(cookieHeader);
    const rawSessionId = cookies[envConfig.session.cookie.name];
    const sessionId = Array.isArray(rawSessionId) ? rawSessionId[0] : rawSessionId;

    if (!sessionId) {
      socket.data.session = {};
      return;
    }

    const request = {} as SessionAwareRequest;

    await new Promise<void>((resolve, reject) => {
      this.fastify.decryptSession(sessionId, request, (err) => {
        if (err) {
          reject(err);
          return;
        }

        resolve();
      });
    });

    const session: AppSessionContext = request.session ?? {};
    socket.data.session = {
      userId: session.userId,
      email: session.email,
      name: session.name,
      currentOrganizationId: session.currentOrganizationId,
      currentOrganizationName: session.currentOrganizationName,
      currentOrganizationRole: session.currentOrganizationRole,
      authenticated: session.authenticated,
    };
  }

  private getHeaderValue(header?: string | string[]): string | undefined {
    if (Array.isArray(header)) {
      return header[0];
    }

    return header;
  }
}

export { SessionIoAdapter as WsIoAdapter };
