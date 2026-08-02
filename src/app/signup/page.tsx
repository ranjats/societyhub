"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Loader2, User, Phone, Mail, Lock, Home } from "lucide-react";
import { toast } from "sonner";

export default function SignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    flatNumber: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!formData.phone.trim() || formData.phone.length < 10) {
      newErrors.phone = "Phone must be at least 10 digits";
    }
    if (!formData.password || formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    if (!formData.flatNumber.trim()) newErrors.flatNumber = "Flat/House number is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          password: formData.password,
          flatNumber: formData.flatNumber.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      setIsSuccess(true);
      toast.success("Registration successful! Please wait for committee approval.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-auth p-4">
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
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Society<span className="text-gradient">Hub</span>
            </h1>
          </div>

          <Card className="shadow-card border-border/70 backdrop-blur-sm animate-scale-in">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-xl text-center text-green-600">Registration Successful!</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-green-800">
                  Your account has been created and is pending approval from the society committee.
                </p>
              </div>
              <p className="text-sm text-gray-600">
                You will receive access once a committee member approves your registration. 
                You can then login with your email and password.
              </p>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Link href="/login" className="w-full">
                <Button variant="outline" className="w-full">
                  Go to Login
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-auth p-4">
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
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Society<span className="text-gradient">Hub</span>
          </h1>
          <p className="text-muted-foreground mt-2">Resident Registration</p>
        </div>

        <Card className="shadow-card border-border/70 backdrop-blur-sm animate-scale-in">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-center">Create Account</CardTitle>
            <CardDescription className="text-center">
              Register as a new resident. Your account will be pending committee approval.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="firstName"
                      placeholder="John"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className={`pl-10 ${errors.firstName ? "border-red-500" : ""}`}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.firstName && <p className="text-sm text-red-500">{errors.firstName}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className={errors.lastName ? "border-red-500" : ""}
                    disabled={isLoading}
                  />
                  {errors.lastName && <p className="text-sm text-red-500">{errors.lastName}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="john.doe@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`pl-10 ${errors.email ? "border-red-500" : ""}`}
                    disabled={isLoading}
                  />
                </div>
                {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={`pl-10 ${errors.phone ? "border-red-500" : ""}`}
                    disabled={isLoading}
                  />
                </div>
                {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="flatNumber">Flat/House Number *</Label>
                <div className="relative">
                  <Home className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="flatNumber"
                    placeholder="e.g. A-101, B-202"
                    value={formData.flatNumber}
                    onChange={(e) => setFormData({ ...formData, flatNumber: e.target.value })}
                    className={`pl-10 ${errors.flatNumber ? "border-red-500" : ""}`}
                    disabled={isLoading}
                  />
                </div>
                {errors.flatNumber && <p className="text-sm text-red-500">{errors.flatNumber}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={`pl-10 ${errors.password ? "border-red-500" : ""}`}
                    disabled={isLoading}
                  />
                </div>
                {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className={`pl-10 ${errors.confirmPassword ? "border-red-500" : ""}`}
                    disabled={isLoading}
                  />
                </div>
                {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword}</p>}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Register"
                )}
              </Button>
              <p className="text-sm text-center text-gray-600">
                Already have an account?{" "}
                <Link href="/login" className="text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
