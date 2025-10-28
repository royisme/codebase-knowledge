# Registration Flow Example

This document demonstrates the updated user registration flow with company and department fields.

## Overview

The registration flow has been updated to:
1. Include optional `company` and `department` fields
2. Use a two-step process: registration → automatic login
3. Handle field mapping between frontend (`fullName`) and backend (`full_name`)

## Form Fields

The registration form now includes the following fields:

- **姓名 (fullName)**: Required - User's full name
- **邮箱地址 (email)**: Required - User's email address
- **公司 (company)**: Optional - User's company or organization
- **部门 (department)**: Optional - User's department or team
- **密码 (password)**: Required - At least 7 characters
- **确认密码 (confirmPassword)**: Required - Must match password

## Registration Flow

### Step 1: Registration
```typescript
const payload = {
  email: 'user@example.com',
  password: 'password123',
  confirmPassword: 'password123',
  fullName: 'John Doe',
  company: 'Acme Corp', // Optional
  department: 'Engineering' // Optional
}

// Returns UserRead object without tokens
const user = await signUp(payload)
```

### Step 2: Automatic Login
After successful registration, the system automatically attempts to log the user in:

```typescript
const authResponse = await signIn({
  email: 'user@example.com',
  password: 'password123'
})

// Returns AuthResponse with user and token
```

## Error Handling

The system handles these scenarios:

1. **Registration succeeds but login fails**: Shows error message with manual login option
2. **Validation errors**: Shows inline form validation messages
3. **Empty company/department**: Accepts empty strings or null values

## User Profile Display

Company and department information is displayed in:
- Profile dropdown (when available)
- Profile settings form (editable)
- User management interface (for admins)

## Testing

Comprehensive tests cover:
- ✅ Unit tests for registration flow
- ✅ Integration tests for form validation
- ✅ Error scenarios and edge cases
- ✅ Two-step registration process
- ✅ Mock API validation