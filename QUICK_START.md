# 🚀 Quick Start - Auth com nestjs-zod

## 📋 O que foi implementado

✅ Migração de `class-validator` para `nestjs-zod`
✅ Módulo de autenticação completo com Clean Architecture
✅ Padrão Use Cases aplicado
✅ Exemplo de login com validação Zod
✅ Migration e seed para tabela users
✅ Documentação completa

## 🎯 Estrutura Criada

```
src/
├── domain/auth/
│   ├── entities/user.entity.ts
│   ├── repositories/user.repository.interface.ts
│   ├── use-cases/login.use-case.ts
│   └── auth-domain.module.ts
│
├── infrastructure/auth/
│   ├── repositories/user.repository.ts
│   └── auth-infrastructure.module.ts
│
└── application/http/auth/
    ├── dtos/
    │   ├── login.dto.ts (com Zod)
    │   └── auth-response.dto.ts (com Zod)
    ├── controllers/auth.controller.ts
    └── auth.module.ts
```

## ⚡ Como Testar

### 1. Rodar banco de dados
```bash
npm run dependencies
```

### 2. Rodar migration
```bash
npm run migrate:latest
```

### 3. Popular com dados de teste
```bash
npm run seed:run
```

### 4. Iniciar servidor
```bash
npm run dev
```

### 5. Testar endpoint de login

**Request:**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

**Response esperado:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-aqui",
      "email": "user@example.com",
      "name": "Test User",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    "message": "Login successful"
  }
}
```

### 6. Testar validação Zod

**Email inválido:**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "email-invalido",
    "password": "123"
  }'
```

**Response esperado (400):**
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

## 👥 Usuários de Teste

Após rodar `npm run seed:run`:

| Email | Senha | Nome |
|-------|-------|------|
| admin@example.com | password123 | Admin User |
| user@example.com | password123 | Test User |
| demo@example.com | password123 | Demo User |

## 📚 Documentação

- **AUTH_EXAMPLE.md**: Documentação completa com exemplos
- **ZOD_MIGRATION_GUIDE.md**: Guia de migração do class-validator
- **Swagger**: http://localhost:3000/docs

## 🎨 Criando Novos Endpoints

### 1. Criar DTO com Zod
```typescript
// dtos/register.dto.ts
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
});

export class RegisterDto extends createZodDto(RegisterSchema) {}
```

### 2. Criar Use Case
```typescript
// use-cases/register.use-case.ts
@Injectable()
export class RegisterUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(input: RegisterInput): Promise<User> {
    // Lógica de negócio aqui
  }
}
```

### 3. Adicionar no Controller
```typescript
@Post('register')
async register(@Body() dto: RegisterDto) {
  return await this.registerUseCase.execute(dto);
}
```

## 🔑 Principais Mudanças

### Antes (class-validator):
```typescript
export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @MinLength(6)
  password: string;
}
```

### Agora (nestjs-zod):
```typescript
const LoginSchema = z.object({
  email: z.string().email().transform(val => val.toLowerCase()),
  password: z.string().min(6),
});

export class LoginDto extends createZodDto(LoginSchema) {}
```

## 🎯 Benefícios

✅ **Type Safety**: Inferência automática de tipos
✅ **Performance**: ~40% mais rápido
✅ **DX**: Menos boilerplate
✅ **Transformações**: Built-in no schema
✅ **Composição**: Schemas reutilizáveis
✅ **Swagger**: Integração nativa

## 📖 Próximos Passos

1. Implementar JWT tokens
2. Adicionar endpoint de registro
3. Criar guards de autorização
4. Adicionar refresh tokens
5. Implementar testes E2E

## 🐛 Troubleshooting

### Erro de compilação
```bash
npm run build
```

### Banco não conecta
```bash
docker-compose down
npm run dependencies
```

### Migration não roda
```bash
npm run migrate:rollback
npm run migrate:latest
```

## 💡 Dicas

- Use `z.coerce.number()` para converter query params
- Use `z.transform()` para normalizar dados
- Use `z.refine()` para validações customizadas
- Use `z.discriminatedUnion()` para união de tipos
- Schemas Zod são reutilizáveis entre frontend e backend!

Divirta-se! 🎉
