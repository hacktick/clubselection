# Authentication System

## Overview

The Club Selection system uses a **dual authentication model**:
- **Admins**: Traditional username/password authentication
- **Students**: Token-based QR code authentication

## Admin Authentication

### Model: `Admin`

```prisma
model Admin {
  id        String   @id @default(cuid())
  username  String   @unique
  password  String   // Hashed password (bcrypt recommended)
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Features
- **Username/Password**: Traditional login credentials
- **Password Hashing**: Passwords should be hashed before storage (use bcrypt or argon2)
- **Admin Functions**:
  - Create and manage projects
  - Configure courses and enrollment rules
  - View all enrollments
  - Manage student access

## Student Authentication

### Model: `Student`

```prisma
model Student {
  id        String   @id @default(cuid())
  token     String   @unique  // One-way hashed identifier
  name      String?  // Optional display name
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  enrollments Enrollment[]
}
```

### Token-Based Authentication

**How it works:**
1. **Input**: Student provides an identifier (e.g., email: `hacktick@gmail.com`)
2. **Hash**: System computes a one-way hash → `dfjf84jd`
3. **Storage**: Only the hash is stored in the database
4. **QR Code**: The hash can be encoded in a QR code for easy scanning
5. **Login**: Student scans QR code or enters their identifier
6. **Verification**: System hashes the input and checks if it exists in the database

### Token Generation Example

**Recommended approach using SHA-256:**

\`\`\`typescript
import crypto from 'crypto';

function generateStudentToken(input: string): string {
  // Normalize input (lowercase, trim)
  const normalized = input.toLowerCase().trim();
  
  // Generate SHA-256 hash
  const hash = crypto
    .createHash('sha256')
    .update(normalized)
    .digest('hex');
  
  // Return first 12 characters for shorter token
  return hash.substring(0, 12);
}

// Example:
// generateStudentToken('hacktick@gmail.com') → 'a3f8b2c9d1e4'
\`\`\`

### Security Considerations

✅ **Advantages:**
- No password storage required for students
- Easy distribution via QR codes
- One-way hash prevents reverse lookup
- Can't be "guessed" even if database is leaked

⚠️ **Important:**
- Use a consistent hashing algorithm
- Always normalize input (lowercase, trim whitespace)
- Consider adding a salt for extra security
- The input string should be communicated securely to students

## API Endpoints (To Implement)

### Admin Endpoints

```
POST   /api/admin/login          - Admin login with username/password
POST   /api/admin/logout         - Admin logout
GET    /api/admin/profile        - Get admin profile
POST   /api/admin/students       - Create student with token
DELETE /api/admin/students/:id   - Delete student
```

### Student Endpoints

```
POST   /api/student/login        - Login with identifier (hashed to token)
POST   /api/student/verify-token - Verify a token directly
GET    /api/student/enrollments  - Get student's enrollments
POST   /api/student/enroll       - Enroll in a course
```

### Public Endpoints

```
POST   /api/auth/student-token   - Generate token from input string (for QR generation)
GET    /api/courses              - List available courses
```

## QR Code Integration

### Generating QR Codes

The token can be encoded in a QR code that contains:
- The student's hashed token
- Or a deep link: `clubselection://login?token=dfjf84jd`

**Example using qrcode library:**

\`\`\`typescript
import QRCode from 'qrcode';

async function generateStudentQR(email: string): Promise<string> {
  const token = generateStudentToken(email);
  const qrData = \`clubselection://login?token=\${token}\`;
  const qrCodeDataURL = await QRCode.toDataURL(qrData);
  return qrCodeDataURL;
}
\`\`\`

### Scanning Flow

1. Student receives their unique identifier (email, ID number, etc.)
2. Admin generates QR code from the identifier
3. Student scans QR code with phone/device
4. App extracts token and authenticates
5. Student is logged in and can enroll in courses

## Database Changes

### Before (Single User Table)
```
User (id, email, password, role, name)
  ↓ has many
Enrollment (userId, courseId)
```

### After (Separate Admin/Student Tables)
```
Admin (id, username, password, name)

Student (id, token, name)
  ↓ has many
Enrollment (studentId, courseId)
```

## Next Steps

1. **Implement Admin Authentication**
   - Hash passwords with bcrypt
   - Create login/logout endpoints
   - Add JWT or session-based auth

2. **Implement Student Authentication**
   - Token generation endpoint
   - Token verification
   - QR code generation

3. **Add Authentication Middleware**
   - Protect admin routes
   - Protect student routes
   - Role-based access control

4. **Frontend Integration**
   - Admin login form
   - Student token/QR scanner
   - Session management
