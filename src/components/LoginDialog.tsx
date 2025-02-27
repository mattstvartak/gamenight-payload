"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { gsap } from "gsap";
import { validatePassword } from "@/utils/validation/password";
import { isValidEmail } from "@/utils/validation/email";
import {
  validateLoginForm,
  type ValidationErrors,
} from "@/utils/validation/form";
import debounce from "lodash/debounce";

interface LoginDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function LoginDialog({ trigger, open, onOpenChange }: LoginDialogProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isNewUser, setIsNewUser] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordRequirements, setShowPasswordRequirements] =
    useState(false);
  const [passwordValidation, setPasswordValidation] = useState({
    hasMinLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });
  const router = useRouter();

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);

    if (errors.email) {
      setErrors((prev) => ({
        ...prev,
        email: undefined,
      }));
    }
  };

  const handleEmailBlur = () => {
    if (email && !isValidEmail(email)) {
      setErrors((prev) => ({
        ...prev,
        email: "Invalid email",
      }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setPasswordValidation(validatePassword(newPassword));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      if (isNewUser) {
        const createResponse = await fetch("/api/users/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
            username,
          }),
        });

        if (!createResponse.ok) {
          const errorData = await createResponse.json();
          throw new Error(errorData.error || "Failed to create account");
        }

        const loginResponse = await fetch("/api/users/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        });

        if (loginResponse.ok) {
          if (onOpenChange) onOpenChange(false);
          router.refresh();
        } else {
          throw new Error("Login failed after account creation");
        }
      } else {
        const loginResponse = await fetch("/api/users/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        });

        if (loginResponse.ok) {
          if (onOpenChange) onOpenChange(false);
          router.refresh();
        } else {
          throw new Error("Login failed");
        }
      }
    } catch (error) {
      console.error("Authentication error:", error);
      setErrors((prev) => ({
        ...prev,
        submit:
          error instanceof Error ? error.message : "Authentication failed",
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors = validateLoginForm(
      email,
      password,
      isNewUser || false,
      username,
      confirmPassword
    );
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isNewUser ? "Create Account" : "Sign In"}</DialogTitle>
          <DialogDescription>
            {isNewUser
              ? "Create a new account to get started"
              : "Welcome back! Please sign in to continue"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" name="login">
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <div className="relative">
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={handleEmailChange}
                onBlur={handleEmailBlur}
                className={errors.email ? "border-red-500" : ""}
                autoComplete={isNewUser ? "email" : "username"}
              />
            </div>
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={handlePasswordChange}
              onFocus={() => isNewUser && setShowPasswordRequirements(true)}
              className={errors.password ? "border-red-500" : ""}
              autoComplete={isNewUser ? "new-password" : "current-password"}
            />
            {isNewUser && (showPasswordRequirements || errors.password) && (
              <div className="text-sm space-y-2 new-user-field">
                <p className="font-medium text-muted-foreground">
                  Password Requirements:
                </p>
                <ul className="space-y-1">
                  <li
                    className={`flex items-center ${passwordValidation.hasMinLength ? "text-green-500" : "text-red-500"}`}
                  >
                    <span className="mr-2">
                      {passwordValidation.hasMinLength ? "✓" : "•"}
                    </span>
                    At least 8 characters long
                  </li>
                  <li
                    className={`flex items-center ${passwordValidation.hasUpperCase ? "text-green-500" : "text-red-500"}`}
                  >
                    <span className="mr-2">
                      {passwordValidation.hasUpperCase ? "✓" : "•"}
                    </span>
                    Contains at least one uppercase letter
                  </li>
                  <li
                    className={`flex items-center ${passwordValidation.hasLowerCase ? "text-green-500" : "text-red-500"}`}
                  >
                    <span className="mr-2">
                      {passwordValidation.hasLowerCase ? "✓" : "•"}
                    </span>
                    Contains at least one lowercase letter
                  </li>
                  <li
                    className={`flex items-center ${passwordValidation.hasNumber ? "text-green-500" : "text-red-500"}`}
                  >
                    <span className="mr-2">
                      {passwordValidation.hasNumber ? "✓" : "•"}
                    </span>
                    Contains at least one number
                  </li>
                  <li
                    className={`flex items-center ${passwordValidation.hasSpecialChar ? "text-green-500" : "text-red-500"}`}
                  >
                    <span className="mr-2">
                      {passwordValidation.hasSpecialChar ? "✓" : "•"}
                    </span>
                    Contains at least one special character
                  </li>
                </ul>
              </div>
            )}
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password}</p>
            )}
          </div>

          {isNewUser && (
            <>
              <div className="space-y-2 new-user-field">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={errors.confirmPassword ? "border-red-500" : ""}
                  autoComplete="new-password"
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              <div className="space-y-2 new-user-field">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={errors.username ? "border-red-500" : ""}
                  autoComplete="username"
                />
                {errors.username && (
                  <p className="text-sm text-red-500">{errors.username}</p>
                )}
              </div>
            </>
          )}

          <DialogFooter>
            {errors.submit && (
              <p className="text-sm text-red-500 text-center">
                {errors.submit}
              </p>
            )}
            <div className="w-full space-y-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading
                  ? "Please wait..."
                  : isNewUser
                    ? "Create Account"
                    : "Sign In"}
              </Button>
              <p className="text-center text-sm">
                {isNewUser
                  ? "Already have an account?"
                  : "Don't have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => setIsNewUser(!isNewUser)}
                  className="text-primary hover:underline font-medium"
                >
                  {isNewUser ? "Sign In" : "Create Account"}
                </button>
              </p>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
