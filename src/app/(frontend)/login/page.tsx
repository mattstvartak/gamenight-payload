'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { gsap } from "gsap";
import { validatePassword } from '@/utils/validation/password';
import { isValidEmail } from '@/utils/validation/email';
import { validateLoginForm, type ValidationErrors } from '@/utils/validation/form';
import debounce from 'lodash/debounce';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isNewUser, setIsNewUser] = useState<boolean | null>(null);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState({
    hasMinLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });
  const router = useRouter();

  const [debouncedCheckUserExists] = useState(() =>
    debounce(async (email: string) => {
      try {
        setIsCheckingEmail(true);
        const response = await fetch('/api/users/exists', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        });
        const result = await response.json();
        setIsNewUser(!result.exists);
      } catch (error) {
        console.error('Error checking user:', error);
      } finally {
        setIsCheckingEmail(false);
      }
    }, 500)
  );

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/users/me');
        const result = await response.json();
        if (result.user) {
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Auth check error:', error);
      }
    };
    checkAuth();
  }, []);

  const validateForm = (): boolean => {
    const newErrors = validateLoginForm(email, password, isNewUser || false, username, confirmPassword);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEmailBlur = () => {
    if (email && !isValidEmail(email)) {
      setErrors(prev => ({
        ...prev,
        email: 'Invalid email'
      }));
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    
    if (errors.email) {
      setErrors(prev => ({
        ...prev,
        email: undefined
      }));
    }
    
    const isValidEmailInput = isValidEmail(newEmail);
    if (!isValidEmailInput) {
      setIsNewUser(null);
      return;
    }
    
    debouncedCheckUserExists(newEmail);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setPasswordValidation(validatePassword(newPassword));
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/users/logout', {
        method: 'POST'
      });
      setIsAuthenticated(false);
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      if (isNewUser) {
        const createResponse = await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            password,
            username,
          }),
        });

        if (createResponse.ok) {
          const loginResponse = await fetch('/api/users/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email,
              password,
            }),
          });

          if (loginResponse.ok) {
            router.push('/dashboard');
          }
        }
      } else {
        const loginResponse = await fetch('/api/users/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            password,
          }),
        });

        if (loginResponse.ok) {
          router.push('/dashboard');
        } else {
          throw new Error('Login failed');
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      setErrors({ 
        password: isNewUser 
          ? 'Error creating account' 
          : 'Invalid email or password' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isNewUser !== null) {
      gsap.fromTo(
        "#password-container",
        { 
          opacity: 0,
          y: 20,
          display: 'none'
        },
        { 
          opacity: 1,
          y: 0,
          display: 'block',
          duration: 0.5,
          onComplete: () => {
            if (isNewUser) {
              gsap.fromTo(
                ".new-user-field",
                { 
                  opacity: 0,
                  y: 20,
                },
                { 
                  opacity: 1,
                  y: 0,
                  duration: 0.5,
                  stagger: 0.1,
                }
              );
            }
          }
        }
      );
    }
  }, [isNewUser]);

  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Already Signed In</CardTitle>
            <CardDescription>You are currently logged in</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={handleLogout}
              variant="outline"
            >
              Sign Out
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{isNewUser ? 'Create Account' : 'Sign In'}</CardTitle>
          <CardDescription>
            {isNewUser 
              ? 'Create a new account to get started' 
              : 'Welcome back! Please sign in to continue'
            }
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={handleEmailChange}
                  onBlur={handleEmailBlur}
                  className={errors.email ? "border-red-500" : ""}
                />
                {isCheckingEmail && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                )}
              </div>
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            {isNewUser !== null && (
              <div id="password-container" className="space-y-2 opacity-0">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={handlePasswordChange}
                  onFocus={() => isNewUser && setShowPasswordRequirements(true)}
                  className={errors.password ? "border-red-500" : ""}
                  disabled={isCheckingEmail}
                />
                {isNewUser && (showPasswordRequirements || errors.password) && (
                  <div className="text-sm space-y-2 new-user-field">
                    <p className="font-medium text-muted-foreground">Password Requirements:</p>
                    <ul className="space-y-1">
                      <li className={`flex items-center ${passwordValidation.hasMinLength ? 'text-green-500' : 'text-red-500'}`}>
                        <span className="mr-2">{passwordValidation.hasMinLength ? '✓' : '•'}</span>
                        At least 8 characters long
                      </li>
                      <li className={`flex items-center ${passwordValidation.hasUpperCase ? 'text-green-500' : 'text-red-500'}`}>
                        <span className="mr-2">{passwordValidation.hasUpperCase ? '✓' : '•'}</span>
                        Contains at least one uppercase letter
                      </li>
                      <li className={`flex items-center ${passwordValidation.hasLowerCase ? 'text-green-500' : 'text-red-500'}`}>
                        <span className="mr-2">{passwordValidation.hasLowerCase ? '✓' : '•'}</span>
                        Contains at least one lowercase letter
                      </li>
                      <li className={`flex items-center ${passwordValidation.hasNumber ? 'text-green-500' : 'text-red-500'}`}>
                        <span className="mr-2">{passwordValidation.hasNumber ? '✓' : '•'}</span>
                        Contains at least one number
                      </li>
                      <li className={`flex items-center ${passwordValidation.hasSpecialChar ? 'text-green-500' : 'text-red-500'}`}>
                        <span className="mr-2">{passwordValidation.hasSpecialChar ? '✓' : '•'}</span>
                        Contains at least one special character
                      </li>
                    </ul>
                  </div>
                )}
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password}</p>
                )}
              </div>
            )}

            {isNewUser && (
              <>
                <div className="space-y-2 new-user-field">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={errors.confirmPassword ? "border-red-500" : ""}
                    disabled={isCheckingEmail}
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-red-500">{errors.confirmPassword}</p>
                  )}
                </div>

                <div className="space-y-2 new-user-field">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={errors.username ? "border-red-500" : ""}
                    disabled={isCheckingEmail}
                  />
                  {errors.username && (
                    <p className="text-sm text-red-500">{errors.username}</p>
                  )}
                </div>
              </>
            )}
          </CardContent>

          <CardFooter className="mt-10 flex flex-col gap-4">
            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading || isCheckingEmail || isNewUser === null}
            >
              {isLoading ? 'Please wait...' : (isNewUser ? 'Create Account' : 'Sign In')}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
