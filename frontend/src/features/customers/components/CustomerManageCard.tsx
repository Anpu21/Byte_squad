import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { LuX as X } from "react-icons/lu";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import { useConfirm } from "@/hooks/useConfirm";
import { customerService } from "@/services/customers.service";
import type { ICustomerProfileDetail, ICustomerProfileUpdate } from "@/types";

/**
 * Editable management metadata on the 360 — tags, notes, segment, and the
 * active/blocked status. Metadata edits apply on Save; the status toggle applies
 * immediately (with a confirm before blocking).
 */
export function CustomerManageCard({
  profile,
}: {
  profile: ICustomerProfileDetail;
}) {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [tags, setTags] = useState<string[]>(profile.tags);
  const [tagInput, setTagInput] = useState("");
  const [notes, setNotes] = useState(profile.notes ?? "");
  const [segment, setSegment] = useState(profile.segment ?? "");

  const mutation = useMutation({
    mutationFn: (payload: ICustomerProfileUpdate) =>
      customerService.update(profile.customerKey, payload),
    onSuccess: () => {
      toast.success("Customer updated");
      // Prefix-match invalidation: refresh both the detail and every list query.
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: () => toast.error("Failed to update customer"),
  });

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  };
  const removeTag = (t: string) => setTags(tags.filter((x) => x !== t));

  const save = () => mutation.mutate({ tags, notes, segment });

  const toggleStatus = async () => {
    const blocking = profile.status !== "blocked";
    if (blocking) {
      const ok = await confirm({
        title: "Deactivate customer?",
        body: "They'll be marked blocked across the customer hub.",
        confirmLabel: "Deactivate",
        tone: "danger",
      });
      if (!ok) return;
    }
    mutation.mutate({ status: blocking ? "blocked" : "active" });
  };

  return (
    <Card className="space-y-4 p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[13px] font-semibold text-text-1">Manage</h3>
        <Button
          variant={profile.status === "blocked" ? "secondary" : "danger"}
          size="sm"
          onClick={toggleStatus}
          disabled={mutation.isPending}
        >
          {profile.status === "blocked" ? "Reactivate" : "Deactivate"}
        </Button>
      </div>

      <Input
        label="Segment"
        value={segment}
        onChange={(e) => setSegment(e.target.value)}
      />

      <div>
        <div className="mb-2 flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-text-2"
            >
              {t}
              <button
                type="button"
                onClick={() => removeTag(t)}
                aria-label={`Remove ${t}`}
                className="text-text-3 hover:text-danger"
              >
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
        <Input
          placeholder="Add a tag, press Enter"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag();
            }
          }}
        />
      </div>

      <Textarea
        label="Notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={3}
      />

      <Button onClick={save} disabled={mutation.isPending} className="w-full">
        {mutation.isPending ? "Saving…" : "Save changes"}
      </Button>
    </Card>
  );
}
