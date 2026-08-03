"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, Inbox, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge, EmptyState, Select, Spinner } from "@/components/ui/primitives";
import { Modal } from "@/components/ui/modal";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { AccessRequest } from "@/lib/types";

const STATUS_TONE: Record<string, any> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
  more_info_requested: "brand",
  revoked: "neutral",
};

export default function RequestsPage() {
  const { isRole } = useAuth();
  const isUploader = isRole("student_researcher", "super_admin");
  const [tab, setTab] = useState<"incoming" | "outgoing">(isUploader ? "incoming" : "outgoing");
  const [incoming, setIncoming] = useState<AccessRequest[]>([]);
  const [outgoing, setOutgoing] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [decision, setDecision] = useState<AccessRequest | null>(null);

  const load = () => {
    setLoading(true);
    const calls: Promise<any>[] = [
      api.get<AccessRequest[]>("/access-requests/outgoing").then(setOutgoing),
    ];
    if (isUploader) calls.push(api.get<AccessRequest[]>("/access-requests/incoming").then(setIncoming));
    Promise.all(calls).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, [isUploader]);

  const list = tab === "incoming" ? incoming : outgoing;

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Access requests</h1>
      <p className="mt-1 text-sm text-ink-faint">Manage requests to your datasets and track your own.</p>

      {isUploader && (
        <div className="mt-6 flex gap-1 border-b border-border">
          {(["incoming", "outgoing"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium capitalize ${
                tab === t ? "border-b-2 border-brand-600 text-brand-700" : "text-ink-faint"
              }`}
            >
              {t === "incoming" ? "Incoming" : "My requests"}
            </button>
          ))}
        </div>
      )}

      <div className="mt-6">
        {loading ? (
          <div className="flex justify-center py-16 text-brand-500"><Spinner className="h-6 w-6" /></div>
        ) : list.length === 0 ? (
          <EmptyState
            icon={tab === "incoming" ? <Inbox size={26} /> : <Send size={26} />}
            title={tab === "incoming" ? "No incoming requests" : "You haven't requested any datasets"}
          />
        ) : (
          <div className="space-y-3">
            {list.map((r) => (
              <div key={r.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        {tab === "incoming"
                          ? r.requester.full_name || r.requester.username
                          : `Dataset #${r.dataset_id}`}
                      </span>
                      <Badge tone={STATUS_TONE[r.status]}>{r.status.replace(/_/g, " ")}</Badge>
                    </div>
                    {r.purpose && <p className="mt-1.5 text-sm text-ink-soft"><b>Purpose:</b> {r.purpose}</p>}
                    <div className="mt-1 flex flex-wrap gap-x-4 text-xs text-ink-faint">
                      {r.institution && <span>Institution: {r.institution}</span>}
                      {r.research_area && <span>Area: {r.research_area}</span>}
                      <span>{new Date(r.created_at).toLocaleDateString()}</span>
                    </div>
                    {r.decision_note && (
                      <p className="mt-1.5 text-xs text-ink-faint"><b>Note:</b> {r.decision_note}</p>
                    )}
                  </div>
                  {tab === "incoming" && r.status === "pending" && (
                    <Button size="sm" onClick={() => setDecision(r)}>Review</Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <DecisionModal request={decision} onClose={() => setDecision(null)} onDone={load} />
    </div>
  );
}

function DecisionModal({
  request,
  onClose,
  onDone,
}: {
  request: AccessRequest | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [accessLevel, setAccessLevel] = useState("download");
  const [duration, setDuration] = useState("permanent");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const decide = async (approve: boolean) => {
    if (!request) return;
    setBusy(true);
    try {
      await api.post(`/access-requests/${request.id}/decide`, {
        approve,
        decision_note: note || undefined,
        access_level: accessLevel,
        grant_duration: duration,
      });
      toast.success(approve ? "Request approved" : "Request rejected");
      onDone();
      onClose();
    } catch {
      toast.error("Action failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={!!request} onClose={onClose} title="Review access request" width={480}>
      {request && (
        <div className="space-y-4">
          <div className="rounded-md bg-muted/60 p-3 text-sm">
            <p className="font-medium">{request.requester.full_name || request.requester.username}</p>
            {request.purpose && <p className="mt-1 text-ink-soft">{request.purpose}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-soft">Access level</label>
              <Select value={accessLevel} onChange={(e) => setAccessLevel(e.target.value)}>
                <option value="view_only">View only</option>
                <option value="download">Download</option>
                <option value="download_api">Download + API</option>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-soft">Duration</label>
              <Select value={duration} onChange={(e) => setDuration(e.target.value)}>
                <option value="permanent">Permanent</option>
                <option value="time_limited">Time limited</option>
              </Select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-soft">Note (optional)</label>
            <textarea
              className="input-base min-h-[70px]"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Message to the requester..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" className="text-danger" disabled={busy} onClick={() => decide(false)}>
              <X size={15} /> Reject
            </Button>
            <Button disabled={busy} onClick={() => decide(true)}>
              <Check size={15} /> Approve
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
