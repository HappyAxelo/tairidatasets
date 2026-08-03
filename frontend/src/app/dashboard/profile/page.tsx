"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Avatar, Input, Label, Textarea } from "@/components/ui/primitives";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function ProfilePage() {
  const { user, refresh } = useAuth();
  const [form, setForm] = useState({ full_name: "", affiliation: "", bio: "" });
  const [pw, setPw] = useState({ current_password: "", new_password: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) setForm({ full_name: user.full_name || "", affiliation: user.affiliation || "", bio: user.bio || "" });
  }, [user]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch("/users/me", form);
      await refresh();
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/auth/change-password", pw);
      toast.success("Password changed");
      setPw({ current_password: "", new_password: "" });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not change password");
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight">Profile</h1>

      <div className="mt-6 flex items-center gap-4 rounded-lg border border-border bg-card p-5">
        <Avatar name={user.full_name || user.username} src={user.avatar_url} size={56} />
        <div>
          <p className="font-semibold">{user.full_name || user.username}</p>
          <p className="text-sm text-ink-faint">{user.email}</p>
          <span className="mt-1 inline-block rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium capitalize text-brand-700">
            {user.role.name.replace("_", " ")}
          </span>
        </div>
      </div>

      <form onSubmit={saveProfile} className="mt-6 space-y-4 rounded-lg border border-border bg-card p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-faint">Account details</h2>
        <div>
          <Label>Full name</Label>
          <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
        </div>
        <div>
          <Label>Affiliation</Label>
          <Input value={form.affiliation} onChange={(e) => setForm({ ...form, affiliation: e.target.value })} />
        </div>
        <div>
          <Label>Bio</Label>
          <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
        </div>
      </form>

      <form onSubmit={changePassword} className="mt-6 space-y-4 rounded-lg border border-border bg-card p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-faint">Change password</h2>
        <div>
          <Label>Current password</Label>
          <Input type="password" required value={pw.current_password} onChange={(e) => setPw({ ...pw, current_password: e.target.value })} />
        </div>
        <div>
          <Label>New password</Label>
          <Input type="password" required minLength={8} value={pw.new_password} onChange={(e) => setPw({ ...pw, new_password: e.target.value })} />
        </div>
        <div className="flex justify-end">
          <Button type="submit" variant="outline">Update password</Button>
        </div>
      </form>
    </div>
  );
}
