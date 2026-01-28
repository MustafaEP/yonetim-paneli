# Auth Module - Clean Architecture Implementation

## 📁 Klasör Yapısı

```
auth/
├── application/                  # Application Layer
│   └── services/                 # Application Services (Use Cases)
│       └── auth-application.service.ts
│
├── domain/                       # Domain Layer (Core Business Logic)
│   └── entities/                 # Domain Entities
│       └── user-session.entity.ts
│
├── presentation/                # Presentation Layer
│   └── controllers/            # HTTP Controllers
│       └── auth.controller.ts
│
├── decorators/                  # Custom Decorators
├── guards/                      # Auth Guards
├── strategies/                  # JWT Strategy
├── auth.module.ts              # NestJS Module (Wiring)
└── auth.service.ts            # Legacy Service (Backward Compatible)
```

## 🏗️ Mimari Katmanlar

### 1. Domain Layer (Core)
**Sorumluluklar:**
- Domain entities (UserSession)

**Örnek:**
```typescript
// Domain Entity
const session = UserSession.create({
  userId: user.id,
  email: user.email,
  roles: customRoleNames,
  permissions: payload.permissions,
  accessToken,
});
```

### 2. Application Layer
**Sorumluluklar:**
- Use case orchestration
- User validation
- JWT token generation
- Maintenance mode handling

**Örnek:**
```typescript
// Application Service
async login(dto: LoginDto): Promise<UserSession> {
  const maintenanceMode = this.configService.getSystemSettingBoolean('MAINTENANCE_MODE', false);
  if (maintenanceMode) {
    // Check admin access
  }
  const validatedUser = await this.validateUser(dto.email, dto.password);
  const payload = this.buildUserPayload(validatedUserWithRoles);
  const accessToken = await this.jwtService.signAsync(payload);
  return UserSession.create({ ... });
}
```

### 3. Presentation Layer
**Sorumluluklar:**
- HTTP request/response handling
- Request validation (DTOs)
- Exception handling

## 🔄 Migration Status

### ✅ Completed
- Domain entity (UserSession)
- Application service
- Presentation controller
- Module wiring

## 📝 Notes

- **Backward Compatibility**: `AuthService` still exists for legacy code
- **Migration**: Gradually migrate from legacy service to application service
- **Special Features**: Maintenance mode, JWT strategy, guards
