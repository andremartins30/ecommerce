"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useProfileStore } from "@/store/profile-store";
import { useAuthStore } from "@/store/auth-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/auth/password-input";
import { PasswordStrength } from "@/components/auth/password-strength";
import { Separator } from "@/components/ui/separator";

const profileSchema = z.object({
  name: z.string().min(2, "Enter your full name"),
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  phone: z.string().min(7, "Enter a valid phone number"),
});
type ProfileValues = z.infer<typeof profileSchema>;

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
type PasswordValues = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const profileName = useProfileStore((s) => s.name);
  const profileEmail = useProfileStore((s) => s.email);
  const profilePhone = useProfileStore((s) => s.phone);
  const updateProfile = useProfileStore((s) => s.updateProfile);
  const user = useAuthStore((s) => s.user);

  const initialValues: ProfileValues = {
    name: user?.name || profileName || "Demo Customer",
    email: user?.email || profileEmail || "customer@example.com",
    phone: profilePhone || "+1 (555) 000-0000",
  };

  const avatarLetter = (user?.name || profileName || "U").charAt(0).toUpperCase();

  return (
    <div className="max-w-xl space-y-10">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-foreground">Profile</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Manage your personal information.</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex size-16 items-center justify-center rounded-full bg-secondary font-heading text-xl font-semibold text-foreground">
          {avatarLetter}
        </div>
        <div>
          <Button variant="outline" size="sm" onClick={() => toast.info("Avatar upload isn't wired up in this demo")}>
            Change Photo
          </Button>
          <p className="mt-1.5 text-xs text-muted-foreground">JPG or PNG, up to 2MB</p>
        </div>
      </div>

      <ProfileForm defaultValues={initialValues} onSave={updateProfile} />

      <Separator />

      <PasswordForm />

      <Separator />

      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5">
        <h2 className="text-sm font-semibold text-destructive">Delete Account</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Permanently delete your account and all associated data. This cannot be undone.
        </p>
        <Button
          variant="destructive"
          size="sm"
          className="mt-4"
          onClick={() => toast.error("Account deletion isn't enabled in this demo")}
        >
          Delete Account
        </Button>
      </div>
    </div>
  );
}

function ProfileForm({
  defaultValues,
  onSave,
}: {
  defaultValues: ProfileValues;
  onSave: (data: ProfileValues) => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    values: defaultValues,
  });

  function onSubmit(values: ProfileValues) {
    setSubmitting(true);
    setTimeout(() => {
      onSave(values);
      setSubmitting(false);
      toast.success("Profile updated");
    }, 600);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Full Name</Label>
        <Input id="name" {...register("name")} />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" {...register("email")} />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" type="tel" {...register("phone")} />
        {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
      </div>
      <Button type="submit" disabled={submitting || !isDirty} className="gap-2">
        {submitting && <Loader2 className="size-4 animate-spin" />}
        {submitting ? "Saving…" : "Save Changes"}
      </Button>
    </form>
  );
}

function PasswordForm() {
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  function onSubmit() {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      reset();
      toast.success("Password updated");
    }, 700);
  }

  return (
    <div>
      <h2 className="font-heading text-lg font-semibold text-foreground">Change Password</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="currentPassword">Current Password</Label>
          <PasswordInput id="currentPassword" {...register("currentPassword")} />
          {errors.currentPassword && (
            <p className="text-xs text-destructive">{errors.currentPassword.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="newPassword">New Password</Label>
          <PasswordInput id="newPassword" {...register("newPassword")} />
          <PasswordStrength password={watch("newPassword") || ""} />
          {errors.newPassword && <p className="text-xs text-destructive">{errors.newPassword.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirm New Password</Label>
          <PasswordInput id="confirmPassword" {...register("confirmPassword")} />
          {errors.confirmPassword && (
            <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
          )}
        </div>
        <Button type="submit" variant="outline" disabled={submitting} className="gap-2">
          {submitting && <Loader2 className="size-4 animate-spin" />}
          {submitting ? "Updating…" : "Update Password"}
        </Button>
      </form>
    </div>
  );
}
