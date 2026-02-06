# Exemplo de Autenticação com NestJS + Zod

Este exemplo demonstra a implementação de um sistema de autenticação usando **nestjs-zod** para validação e seguindo o padrão **Use Cases** com Clean Architecture.

## 📦 Tecnologias Usadas

- **NestJS**: Framework Node.js progressivo
- **Zod**: Validação de schema TypeScript-first
- **nestjs-zod**: Integração do Zod com NestJS
- **Fastify**: HTTP server de alta performance
- **PostgreSQL**: Banco de dados
- **Knex**: Query builder para SQL
- **bcrypt**: Hash de senhas

## 🏗️ Arquitetura

O projeto segue **Clean Architecture** com três camadas principais:

```
src/
├── domain/                      # Regras de negócio
│   └── auth/
│       ├── entities/           # Entidades do domínio
│       │   └── user.entity.ts
│       ├── repositories/       # Interfaces dos repositórios
│       │   └── user.repository.interface.ts
│       ├── use-cases/          # Casos de uso (business logic)
│       │   └── login.use-case.ts
│       └── auth-domain.module.ts
│
├── infrastructure/              # Implementações técnicas
│   └── auth/
│       ├── repositories/       # Implementação dos repositórios
│       │   └── user.repository.ts
│       └── auth-infrastructure.module.ts
│
└── application/                 # Camada de apresentação
    └── http/
        └── auth/
            ├── dtos/           # DTOs com Zod schemas
            │   ├── login.dto.ts
            │   └── auth-response.dto.ts
            ├── controllers/    # Controllers HTTP
            │   └── auth.controller.ts
            └── auth.module.ts
```

## 🔐 Fluxo de Autenticação

### 1. **Request HTTP** → Controller

```typescript
// application/http/auth/controllers/auth.controller.ts
@Post('login')
async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
  // Validação automática via nestjs-zod
  const result = await this.loginUseCase.execute(loginDto);
  return result;
}
```

### 2. **Controller** → Use Case (Business Logic)

```typescript
// domain/auth/use-cases/login.use-case.ts
@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(input: LoginInput): Promise<LoginOutput> {
    // 1. Buscar usuário
    const user = await this.userRepository.findByEmail(input.email);

    // 2. Validar senha
    const isValid = await bcrypt.compare(input.password, user.password);

    // 3. Retornar resultado
    return { user, token };
  }
}
```

### 3. **Use Case** → Repository (Data Access)

```typescript
// infrastructure/auth/repositories/user.repository.ts
@Injectable()
export class UserRepository implements IUserRepository {
  async findByEmail(email: string): Promise<User | null> {
    return await this.db('users').where({ email }).first();
  }
}
```

## 🎯 Validação com Zod

### Definindo Schemas

```typescript
// application/http/auth/dtos/login.dto.ts
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const LoginSchema = z.object({
  email: z
    .string()
    .email('Must be a valid email')
    .transform((val) => val.toLowerCase().trim()),

  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password is too long'),
});

export class LoginDto extends createZodDto(LoginSchema) {}
```

### Vantagens do Zod sobre class-validator

#### class-validator (antes):
```typescript
export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(6)
  @MaxLength(100)
  password: string;
}
```

#### nestjs-zod (agora):
```typescript
export const LoginSchema = z.object({
  email: z.string().email().transform(val => val.toLowerCase()),
  password: z.string().min(6).max(100),
});

export class LoginDto extends createZodDto(LoginSchema) {}
```

**Benefícios:**
- ✅ Type inference automático
- ✅ Transformações built-in
- ✅ Schema reutilizável
- ✅ Menos boilerplate
- ✅ Melhor performance
- ✅ Runtime + compile-time safety

## 🗄️ Configuração do Banco de Dados

### 1. Rodar Migration

```bash
npm run migrate:latest
```

Cria a tabela `users`:
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### 2. Rodar Seed (Opcional)

```bash
npm run seed:run
```

Cria usuários de teste:
- `admin@example.com` / `password123`
- `user@example.com` / `password123`
- `demo@example.com` / `password123`

## 🧪 Testando a API

### 1. Iniciar o servidor

```bash
npm run dev
```

### 2. Fazer login

**Request:**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "name": "Test User",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    "token": null,
    "message": "Login successful"
  }
}
```

### 3. Testar validação

**Request com email inválido:**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email",
    "password": "123"
  }'
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "errors": [
      {
        "path": ["email"],
        "message": "Must be a valid email address"
      },
      {
        "path": ["password"],
        "message": "Password must be at least 6 characters"
      }
    ]
  }
}
```

## 📚 Documentação Swagger

Acesse a documentação interativa em:
- **Scalar UI**: http://localhost:3000/docs
- **Swagger JSON**: http://localhost:3000/swagger/json

## 🎓 Princípios SOLID Aplicados

### Single Responsibility
Cada classe tem uma única responsabilidade:
- `LoginUseCase`: Apenas lógica de login
- `UserRepository`: Apenas acesso a dados de usuários
- `AuthController`: Apenas manipulação de HTTP

### Dependency Inversion
Use cases dependem de abstrações (interfaces), não de implementações:
```typescript
constructor(
  @Inject(USER_REPOSITORY)
  private readonly userRepository: IUserRepository, // Interface, não implementação
) {}
```

### Open/Closed
Fácil adicionar novos use cases sem modificar código existente:
```typescript
// Adicionar RegisterUseCase
export class RegisterUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(input: RegisterInput) {
    // Lógica de registro
  }
}
```

## 🔄 Adicionando Novos Use Cases

### Exemplo: Register Use Case

1. **Criar DTO com Zod:**
```typescript
// dtos/register.dto.ts
export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
});

export class RegisterDto extends createZodDto(RegisterSchema) {}
```

2. **Criar Use Case:**
```typescript
// use-cases/register.use-case.ts
@Injectable()
export class RegisterUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(input: RegisterInput): Promise<User> {
    const hashedPassword = await bcrypt.hash(input.password, 10);
    return await this.userRepository.create({
      ...input,
      password: hashedPassword,
    });
  }
}
```

3. **Adicionar no Controller:**
```typescript
@Post('register')
async register(@Body() registerDto: RegisterDto) {
  return await this.registerUseCase.execute(registerDto);
}
```

## 🚀 Próximos Passos

- [ ] Implementar JWT tokens
- [ ] Adicionar refresh tokens
- [ ] Implementar guards de autorização
- [ ] Adicionar rate limiting
- [ ] Implementar 2FA
- [ ] Adicionar testes unitários e E2E

## 📖 Referências

- [NestJS Documentation](https://docs.nestjs.com)
- [nestjs-zod](https://github.com/BenLorantfy/nestjs-zod)
- [Zod Documentation](https://zod.dev)
- [Clean Architecture by Uncle Bob](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
