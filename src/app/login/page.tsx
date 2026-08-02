"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
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
import Link from "next/link";
import { Loader2, Mail, Lock, Copy } from "lucide-react";
import { toast } from "sonner";
import EclipseSky from "@/components/auth/eclipse-sky";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function LoginPage() {

  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Forgot-password flow (demo mode — reset link is shown on screen)
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState("");
  const [resetLink, setResetLink] = useState<string | null>(null);

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setForgotMessage(data.message || "");
      setResetLink(data.resetLink || null);
      if (!data.resetLink) {
        toast.info(
          data.message || "If an account exists for that email, a reset link has been generated."
        );
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong. Please try again."
      );
    } finally {
      setForgotLoading(false);
    }
  };

  const copyResetLink = async () => {
    if (!resetLink) return;
    try {
      await navigator.clipboard.writeText(resetLink);
      toast.success("Reset link copied");
    } catch {
      toast.error("Could not copy the link");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        // Log the raw result — next-auth error codes help diagnose
        // deployment issues (e.g. a misconfigured AUTH_URL on Vercel).
        // eslint-disable-next-line no-console
        console.error("[Login] signIn failed:", result);
        // "CredentialsSignin" = wrong email/password. Anything else is
        // likely a server/config problem (e.g. missing env vars on Vercel).
        if (result.error === "CredentialsSignin") {
          toast.error("Invalid email or password. Please try again.");
        } else {
          toast.error(
            "Sign-in failed due to a server configuration error. Check that AUTH_SECRET and DATABASE_URL are set on your deployment, and that AUTH_URL is removed."
          );
        }
      } else {
        // Use window.location.href for a full page reload to ensure
        // the session cookie is sent with the middleware request.
        // router.push() does client-side navigation which may not
        // include the freshly-set cookie in the request headers.
        window.location.href = callbackUrl;
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("[Login] signIn threw:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-auth p-4">
      <EclipseSky />
      <div className="w-full max-w-md relative z-10">
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
          <p className="text-white/70 mt-2">
            Society Management System
          </p>
        </div>

        <Card className="auth-panel text-white animate-scale-in">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-center">Welcome back</CardTitle>
            <CardDescription className="text-center text-white/60">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white/85">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 auth-input"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-white/85">Password</Label>
                  <button
                    type="button"
                    onClick={() => setIsForgotOpen(true)}
                    className="text-xs font-medium text-amber-300 hover:text-amber-200 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 auth-input"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full h-11 btn-auth-gradient"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
              <p className="text-sm text-center text-white/60">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="text-amber-300 hover:text-amber-200 hover:underline font-semibold">
                  Register as Resident
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>

        <Dialog
          open={isForgotOpen}
          onOpenChange={(open) => {
            setIsForgotOpen(open);
            if (!open) {
              // Clear any generated link so reopening starts fresh
              setResetLink(null);
              setForgotEmail("");
            }
          }}
        >
          <DialogContent className="auth-dialog text-white sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white">Reset your password</DialogTitle>
              <DialogDescription className="text-white/60">
                Enter the email linked to your account and we&apos;ll generate a reset link.
              </DialogDescription>
            </DialogHeader>
            {resetLink ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-500/10 rounded-lg border border-emerald-400/25 text-sm">
                  <p className="text-emerald-300 font-medium">Reset link generated</p>
                  <p className="mt-1 text-emerald-200/80">
                    Since this demo has no email service, your reset link is shown below — in
                    production it would be emailed to you.
                  </p>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2.5">
                  <a
                    href={resetLink}
                    className="flex-1 min-w-0 text-sm text-amber-300 hover:text-amber-200 truncate"
                  >
                    {resetLink}
                  </a>
                  <button
                    type="button"
                    onClick={copyResetLink}
                    className="shrink-0 inline-flex items-center gap-1.5 text-xs font-medium text-white/70 hover:text-white transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy
                  </button>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 btn-auth-ghost"
                    onClick={() => {
                      setIsForgotOpen(false);
                      setResetLink(null);
                      setForgotEmail("");
                    }}
                  >
                    Close
                  </Button>
                  <Button asChild className="flex-1 btn-auth-gradient">
                    <a href={resetLink}>Open reset page</a>
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="forgot-email" className="text-white/85">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                    <Input
                      id="forgot-email"
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="pl-10 auth-input"
                      disabled={forgotLoading}
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full btn-auth-gradient"
                  disabled={forgotLoading}
                >
                  {forgotLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate reset link"
                  )}
                </Button>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
