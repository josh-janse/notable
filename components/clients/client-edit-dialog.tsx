"use client";

import { Edit } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ClientForm } from "@/components/clients/client-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Database } from "@/lib/types/database.types";

type Client = Database["public"]["Tables"]["clients"]["Row"];

type ClientEditDialogProps = {
  client: Client;
  trigger?: React.ReactNode;
};

export function ClientEditDialog({ client, trigger }: ClientEditDialogProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleSuccess = () => {
    setOpen(false);
    router.refresh();
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" variant="outline">
            <Edit className="mr-2 h-4 w-4" />
            Edit Client
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Client</DialogTitle>
          <DialogDescription>
            Update client profile information.
          </DialogDescription>
        </DialogHeader>
        <ClientForm client={client} onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
