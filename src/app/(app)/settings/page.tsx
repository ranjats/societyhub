"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  Building2,
  User,
  Bell,
  Shield,
  Save,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500">Manage your society and application settings</p>
      </div>

      {/* Society Profile */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle>Society Profile</CardTitle>
              <CardDescription>Update your society information</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Society Name</Label>
              <Input id="name" defaultValue="Green Valley Society" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Contact Email</Label>
              <Input id="email" type="email" defaultValue="admin@greenvalley.com" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" defaultValue="123 MG Road, Sector 15" />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" defaultValue="Bangalore" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input id="state" defaultValue="Karnataka" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pincode">Pincode</Label>
              <Input id="pincode" defaultValue="560001" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Contact Phone</Label>
            <Input id="phone" defaultValue="+91 98765 43210" />
          </div>
          <Button onClick={() => toast.success("Settings saved successfully")}>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-100">
              <Bell className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Configure how you receive notifications</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-gray-500">Receive notifications via email</p>
            </div>
            <Badge variant="success">Enabled</Badge>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
            <div>
              <p className="font-medium">Payment Reminders</p>
              <p className="text-sm text-gray-500">Get reminded about pending payments</p>
            </div>
            <Badge variant="success">Enabled</Badge>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
            <div>
              <p className="font-medium">Event Notifications</p>
              <p className="text-sm text-gray-500">Receive updates about society events</p>
            </div>
            <Badge variant="success">Enabled</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-100">
              <Shield className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <CardTitle>Security</CardTitle>
              <CardDescription>Manage your account security</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input id="currentPassword" type="password" placeholder="Enter current password" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input id="newPassword" type="password" placeholder="Enter new password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input id="confirmPassword" type="password" placeholder="Confirm new password" />
            </div>
          </div>
          <Button variant="outline">
            <Shield className="w-4 h-4 mr-2" />
            Change Password
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
