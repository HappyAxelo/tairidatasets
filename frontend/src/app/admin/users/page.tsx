"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { KeyRound, Plus, ShieldBan, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, Badge, Input, Label, Select, Spinner } from "@/components/ui/primitives";
import { Modal } from "@/components/ui/modal";
import { api, ApiError } from "@/lib/api";
import type { User } from "@/lib/types";

const ROLE_TONE: Record<string, any> = {
  super_admin: "danger",
  student_researcher: "brand",
  researcher: "neutral",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[] | null>(null);
  const [creating, setCreating] = useState(false);

  const load = () => api.get<User[]>("/admin/users").then(setUsers).catch(() => setUsers([]));
  useEffect(() => { load(); }, []);

  const act = async (fn: () => Promise<any>, msg: string) => {
    try { await fn(); toast.success(msg); load(); }
    catch (err) { toast.error(err instanceof ApiError ? err.message : "Action failed"); }
  };

  if (users === null)
    return <div className="flex justify-center py-24 text-brand-500"><Spinner className="h-6 w-6" /></div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User management</h1>
          <p className="mt-1 text-sm text-ink-faint">{users.length} registered users</p>
        </div>
        <Button onClick={() => setCreating(true)}><Plus size={16} /> New user</Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wider text-ink-faint">
            <tr>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={u.full_name || u.username} size={30} />
                    <div>
                      <p className="font-medium">{u.full_name || u.username}</p>
                      <p className="text-xs text-ink-faint">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={ROLE_TONE[u.role.name] ?? "neutral"}>{u.role.name.replace("_", " ")}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={u.status === "active" ? "success" : u.status === "suspended" ? "danger" : "warning"}>
                    {u.status.replace("_", " ")}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="ghost" title="Reset password"
                      onClick={() => act(() => api.post(`/admin/users/${u.id}/reset-password`), "Reset email sent")}>
                      <KeyRound size={14} />
                    </Button>
                    {u.status === "suspended" ? (
                      <Button size="sm" variant="ghost" className="text-success" title="Activate"
                        onClick={() => act(() => api.post(`/admin/users/${u.id}/activate`), "User activated")}>
                        <ShieldCheck size={14} />
                      </Button>
                    ) : (
                      <Button size="sm" variant="ghost" className="text-warning" title="Suspend"
                        onClick={() => act(() => api.post(`/admin/users/${u.id}/suspend`), "User suspended")}>
                        <ShieldBan size={14} />
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="text-danger" title="Delete"
                      onClick={() => confirm(`Delete ${u.username}?`) && act(() => api.delete(`/admin/users/${u.id}`), "User deleted")}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CreateUserModal open={creating} onClose={() => setCreating(false)} onDone={load} />
    </div>
  );
}

function CreateUserModal({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: () => void }) {
  const [form, setForm] = useState({ full_name: "", username: "", email: "", password: "", role: "student_researcher" });
  const [busy, setBusy] = useState(false);
  const set = (k: string) => (e: React.ChangeEvent<any>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/admin/users", form);
      toast.success("User created");
      onDone();
      onClose();
      setForm({ full_name: "", username: "", email: "", password: "", role: "student_researcher" });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not create user");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create user" width={480}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label>Full name</Label><Input required value={form.full_name} onChange={set("full_name")} /></div>
          <div><Label>Username</Label><Input required value={form.username} onChange={set("username")} /></div>
        </div>
        <div><Label>Email</Label><Input type="email" required value={form.email} onChange={set("email")} /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label>Temporary password</Label><Input required minLength={8} value={form.password} onChange={set("password")} /></div>
          <div>
            <Label>Role</Label>
            <Select value={form.role} onChange={set("role")}>
              <option value="student_researcher">Student researcher</option>
              <option value="researcher">Researcher</option>
              <option value="super_admin">Super administrator</option>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy}>{busy ? "Creating…" : "Create user"}</Button>
        </div>
      </form>
    </Modal>
  );
}
