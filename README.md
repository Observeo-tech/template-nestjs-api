# NestJS API Scaffold

Template base para criação de APIs RESTful com NestJS, Fastify, PostgreSQL e Redis.

## Stack

- **Framework**: NestJS + Fastify
- **Database**: PostgreSQL + Knex.js (query builder)
- **Cache/Sessions**: Redis
- **Queue**: Bull
- **Validation**: class-validator + i18n
- **Documentation**: Swagger + Scalar UI

## Arquitetura

```
src/
├── application/        # Camada HTTP (controllers, decorators, guards, interceptors)
│   └── http/
│       └── common/     # Utilitários compartilhados
├── domain/             # Lógica de negócio (services, repositories, entities)
│   └── common/         # Serviços compartilhados (SessionStorage)
├── infrastructure/     # Infraestrutura (database, cache, i18n, queue)
│   ├── cache/          # Redis cache service
│   ├── database/       # Knex.js + migrations
│   ├── i18n/           # Internacionalização
│   ├── queue/          # Bull queue
│   └── ws-adapter/     # Socket.io com Redis adapter
└── config/             # Configurações da aplicação
```

## Setup

### 1. Clone e instale dependências

```bash
npm install
```

### 2. Configure variáveis de ambiente

```bash
cp .env.example .env
```

### 3. Inicie os serviços (PostgreSQL + Redis)

```bash
npm run dependencies
# ou
docker-compose up -d
```

### 4. Execute as migrations

```bash
npm run migrate:latest
```

### 5. Inicie o servidor

```bash
npm run dev
```

## Comandos

```bash
# Desenvolvimento
npm run dev                 # Docker + migrations + watch mode

# Build
npm run build

# Lint
npm run lint

# Testes
npm test                    # Todos os testes
npm run test:watch          # Watch mode
npm run test:e2e            # Testes e2e

# Migrations (Knex.js)
npm run migrate:make nome   # Criar migration
npm run migrate:latest      # Executar migrations
npm run migrate:rollback    # Reverter última migration

# Seeds
npm run seed:make nome      # Criar seed
npm run seed:run            # Executar seeds
```

## Documentação

- **Scalar UI**: http://localhost:3000/docs
- **Swagger JSON**: http://localhost:3000/swagger/json
- **Swagger YAML**: http://localhost:3000/swagger/yaml

## Padrões

### DTOs
```typescript
import { ApiProperty } from '@nestjs/swagger';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateUserDto {
  @ApiProperty()
  @IsEmail({}, { message: i18nValidationMessage('validation.IS_EMAIL') })
  email: string;
}
```

### Repositories
```typescript
export class UserRepository extends BaseRepository {
  async findById(id: number): Promise<User | null> {
    return this.db.from<User>('users').where({ id }).first();
  }

  async createWithTransaction(data: Partial<User>): Promise<User> {
    return this.runInTransaction(async () => {
      const [user] = await this.db.from<User>('users').insert(data).returning('*');
      return user;
    });
  }
}
```

### Controllers
```typescript
@Controller('users')
export class UserController {
  @Get(':id')
  @ApiDoc({ summary: 'Get user by ID', response: UserResponseDto })
  async findOne(@Param('id') id: number) {
    const user = await this.userService.findById(id);
    return ResponseHelper.success(user);
  }

  @Post()
  @Public() // Rota pública
  async create(@Body() dto: CreateUserDto) {
    // ...
  }
}
```

### Decorators Disponíveis
- `@Public()` - Marca rota como pública (sem autenticação)
- `@CurrentUser()` - Obtém usuário da sessão
- `@ApiDoc()` - Documentação Swagger simplificada
- `@CacheKey()` / `@CacheTTL()` - Cache de resposta

## Estrutura de Resposta

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message",
  "meta": { "page": 1, "limit": 10, "total": 100 },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```
