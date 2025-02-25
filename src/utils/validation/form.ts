import { isValidEmail } from './email';
import { validatePassword, isPasswordValid } from './password';

export interface ValidationErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  username?: string;
}

export const validateLoginForm = (
  email: string,
  password: string,
  isNewUser: boolean,
  username?: string,
  confirmPassword?: string
): ValidationErrors => {
  const errors: ValidationErrors = {};
  
  if (!email) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(email)) {
    errors.email = 'Invalid email format';
  }

  if (!password) {
    errors.password = 'Password is required';
  } else if (isNewUser) {
    const validation = validatePassword(password);
    if (!isPasswordValid(validation)) {
      errors.password = 'Password does not meet all requirements';
    }
  }

  if (isNewUser) {
    if (!username) {
      errors.username = 'Username is required';
    }
    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
  }

  return errors;
}; 