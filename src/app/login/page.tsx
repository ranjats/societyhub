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
import { Building2, Loader2, Mail, Lock, ShieldCheck, Users, Home } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {

  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
        toast.error("Invalid email or password. Please try again.");
      } else {
        // Use window.location.href for a full page reload to ensure
        // the session cookie is sent with the middleware request.
        // router.push() does client-side navigation which may not
        // include the freshly-set cookie in the request headers.
        window.location.href = callbackUrl;
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-auth p-4">
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8 animate-fade-up">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-2 text-white shadow-glow mb-4">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Society<span className="text-gradient">Hub</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            Society Management System
          </p>
        </div>

        <Card className="shadow-card border-border/70 backdrop-blur-sm animate-scale-in">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-center">Welcome back</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@societyhub.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full h-11"
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
              <p className="text-sm text-center text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="text-primary hover:underline font-semibold">
                  Register as Resident
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>

        <div className="mt-6 p-4 rounded-xl bg-card/70 border border-border/60 backdrop-blur-sm shadow-soft">
          <p className="text-xs text-muted-foreground font-semibold mb-3 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
            Demo Credentials
          </p>
          <div className="grid grid-cols-1 gap-2 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary shrink-0">
                <ShieldCheck className="w-3.5 h-3.5" />
              </span>
              <span className="text-muted-foreground min-w-0 truncate">
                <strong className="text-foreground">Super Admin:</strong> admin@societyhub.com / password123
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-violet-500/10 text-violet-600 shrink-0">
                <Users className="w-3.5 h-3.5" />
              </span>
              <span className="text-muted-foreground min-w-0 truncate">
                <strong className="text-foreground">Committee:</strong> committee@societyhub.com / password123
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 shrink-0">
                <Home className="w-3.5 h-3.5" />
              </span>
              <span className="text-muted-foreground min-w-0 truncate">
                <strong className="text-foreground">Resident:</strong> resident@societyhub.com / password123
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
