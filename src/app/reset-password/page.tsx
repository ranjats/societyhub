"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Lock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import EclipseSky from "@/components/auth/eclipse-sky";

function AuthBranding() {
  return (
    <div className="text-center mb-8 animate-fade-up">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white border border-border/70 shadow-glow overflow-hidden mb-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/sentosa-logo.png"
          alt="Sentosa Greens"
          className="w-20 h-20 object-contain"
        />
      </div>
      <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-sm">
        Society<span className="text-gradient">Hub</span>
      </h1>
    </div>
  );
}

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [invalidToken, setInvalidToken] = useState(false);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!password || password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        // Expired or already-used token → show the invalid-link card
        if (response.status === 400) setInvalidToken(true);
        throw new Error(data.error || "Password reset failed");
      }

      setIsSuccess(true);
      toast.success("Your password has been updated!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Password reset failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // No token in the URL, or the token was rejected as invalid/expired.
  if (!token || invalidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-auth p-4">
        <EclipseSky />
        <div className="w-full max-w-md relative z-10">
          <AuthBranding />
          <Card className="auth-panel text-white animate-scale-in">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-xl text-center text-amber-300">
                Invalid reset link
              </CardTitle>
              <CardDescription className="text-center text-white/60">
                This password reset link is missing or invalid.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-400/25">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-amber-300" />
                <p className="text-sm text-amber-200/90">
                  Please go back to the login page and request a new reset link.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Link href="/login" className="w-full">
                <Button className="w-full btn-auth-gradient">Back to Login</Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  // Password successfully updated.
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-auth p-4">
        <EclipseSky />
        <div className="w-full max-w-md relative z-10">
          <AuthBranding />
          <Card className="auth-panel text-white animate-scale-in">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-xl text-center text-emerald-300">
                Password updated!
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="p-4 bg-emerald-500/10 rounded-lg border border-emerald-400/25">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-300" />
                <p className="text-sm text-emerald-300">
                  Your password has been updated. You can now sign in with your new password.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Link href="/login" className="w-full">
                <Button className="w-full btn-auth-gradient">Go to Login</Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  // New password form.
  return (
    <div className="min-h-screen flex items-center justify-center bg-auth p-4">
      <EclipseSky />
      <div className="w-full max-w-md relative z-10">
        <AuthBranding />
        <Card className="auth-panel text-white animate-scale-in">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-center">Set a new password</CardTitle>
            <CardDescription className="text-center text-white/60">
              Choose a new password for your account.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white/85">New Password *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create a new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`pl-10 auth-input ${errors.password ? "border-red-500!" : ""}`}
                    disabled={isLoading}
                  />
                </div>
                {errors.password && <p className="text-sm text-red-400">{errors.password}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-white/85">Confirm New Password *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`pl-10 auth-input ${errors.confirmPassword ? "border-red-500!" : ""}`}
                    disabled={isLoading}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-400">{errors.confirmPassword}</p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full btn-auth-gradient" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating password...
                  </>
                ) : (
                  "Update Password"
                )}
              </Button>
              <p className="text-sm text-center text-white/60">
                <Link href="/login" className="text-amber-300 hover:text-amber-200 hover:underline">
                  Back to Login
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
