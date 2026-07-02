import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { customerService } from "@/services/customers.service";
import type { ICustomerProfileDetail, IWalkInUpdate } from "@/types";

function apiMessage(err: unknown, fallback: string): string {
  if (typeof err === "object" && err !== null && "response" in err) {
    const data = (err as { response?: { data?: { message?: unknown } } })
      .response?.data?.message;
    if (typeof data === "string") return data;
  }
  return fallback;
}

export function CustomerEditWalkInModal({
  isOpen,
  onClose,
  profile,
  loyaltyId,
}: {
  isOpen: boolean;
  onClose: () => void;
  profile: ICustomerProfileDetail;
  loyaltyId: string;
}) {
  const queryClient = useQueryClient();
  const nameParts = (profile.displayName ?? "").trim().split(/\s+/);
  const initialPhone = profile.phone ?? "";
  const [firstName, setFirstName] = useState(nameParts[0] ?? "");
  const [lastName, setLastName] = useState(nameParts.slice(1).join(" "));
  const [phone, setPhone] = useState(initialPhone);

  const mutation = useMutation({
    mutationFn: (payload: IWalkInUpdate) =>
      customerService.updateWalkIn(loyaltyId, payload),
    onSuccess: () => {
      toast.success("Walk-in updated");
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      onClose();
    },
    onError: (err) =>
      toast.error(apiMessage(err, "Couldn’t update this walk-in")),
  });

  const save = () => {
    const payload: IWalkInUpdate = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
    };
    const trimmedPhone = phone.trim();
    // Only send phone when actually changed — avoids re-validating a legacy
    // malformed stored phone on a name-only edit.
    if (trimmedPhone && trimmedPhone !== initialPhone) {
      payload.phone = trimmedPhone;
    }
    mutation.mutate(payload);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit walk-in details" maxWidth="md">
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="First name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <Input
            label="Last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>
        <Input
          label="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={save}
            disabled={mutation.isPending || firstName.trim().length === 0}
          >
            {mutation.isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
