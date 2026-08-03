"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/primitives";
import { api, ApiError } from "@/lib/api";

export function RequestAccessModal({
  open,
  onClose,
  datasetId,
  onSubmitted,
}: {
  open: boolean;
  onClose: () => void;
  datasetId: number;
  onSubmitted?: () => void;
}) {
  const [purpose, setPurpose] = useState("");
  const [institution, setInstitution] = useState("");
  const [researchArea, setResearchArea] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post(`/access-requests/datasets/${datasetId}`, {
        purpose,
        institution,
        research_area: researchArea,
        message,
      });
      toast.success("Access request submitted", {
        description: "The dataset owner has been notified. You will hear back by email.",
      });
      onSubmitted?.();
      onClose();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not submit request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Request dataset access" width={520}>
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-ink-faint">
          Tell the dataset owner how you intend to use this data. They will review your request.
        </p>
        <div>
          <Label>Purpose of use *</Label>
          <Textarea
            required
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="Describe your intended research use..."
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Institution</Label>
            <Input
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              placeholder="University of Rwanda"
            />
          </div>
          <div>
            <Label>Research area</Label>
            <Input
              value={researchArea}
              onChange={(e) => setResearchArea(e.target.value)}
              placeholder="e.g. Machine Learning"
            />
          </div>
        </div>
        <div>
          <Label>Message (optional)</Label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Any additional context for the owner..."
          />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Submitting..." : "Submit request"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
