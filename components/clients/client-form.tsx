"use client";

/**
 * Client Form Client Component
 *
 * Form for creating and updating client profiles.
 * Uses react-hook-form with Zod validation.
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Database } from "@/lib/types/database.types";
import {
  type CreateClientInput,
  clientStatusSchema,
  createClientSchema,
  type UpdateClientInput,
  updateClientSchema,
} from "@/lib/validations/client";

type Client = Database["public"]["Tables"]["clients"]["Row"];

type ClientFormProps = {
  client?: Client;
  onSuccess?: () => void;
};

export function ClientForm({ client, onSuccess }: ClientFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = Boolean(client);

  // Use UpdateClientInput which is a superset of CreateClientInput (all fields optional)
  const form = useForm<UpdateClientInput>({
    // @ts-expect-error - Zod v4 compatibility with resolvers
    resolver: zodResolver(isEditing ? updateClientSchema : createClientSchema),
    defaultValues: {
      full_name: client?.full_name || "",
      email: client?.email || "",
      phone: client?.phone || "",
      date_of_birth: client?.date_of_birth
        ? new Date(client.date_of_birth)
        : undefined,
      initial_assessment_date: client?.initial_assessment_date
        ? new Date(client.initial_assessment_date)
        : undefined,
      notes_summary: client?.notes_summary || "",
      status:
        (client?.status as "active" | "inactive" | "archived") || "active",
      metadata: (client?.metadata as Record<string, unknown>) || {},
    },
  });

  async function onSubmit(data: CreateClientInput | UpdateClientInput) {
    setIsSubmitting(true);
    setError(null);

    try {
      const url = isEditing ? `/api/clients/${client?.id}` : "/api/clients";
      const method = isEditing ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save client");
      }

      const result = await response.json();

      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      } else {
        // Navigate to client detail page
        router.push(`/clients/${result.id}`);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
        {error && (
          <div className="rounded-md bg-destructive/10 px-4 py-3 text-destructive text-sm">
            {error}
          </div>
        )}

        <FormField
          control={form.control}
          name="full_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name *</FormLabel>
              <FormControl>
                <Input placeholder="Jane Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="jane@example.com"
                    type="email"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input
                    placeholder="+1 (555) 123-4567"
                    type="tel"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="date_of_birth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date of Birth</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value
                        ? new Date(e.target.value)
                        : undefined;
                      field.onChange(value);
                    }}
                    value={
                      field.value instanceof Date
                        ? field.value.toISOString().split("T")[0]
                        : ""
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="initial_assessment_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Initial Assessment Date</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value
                        ? new Date(e.target.value)
                        : undefined;
                      field.onChange(value);
                    }}
                    value={
                      field.value instanceof Date
                        ? field.value.toISOString().split("T")[0]
                        : ""
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {isEditing && (
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select
                  defaultValue={field.value as string}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {clientStatusSchema.options.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="notes_summary"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes Summary</FormLabel>
              <FormControl>
                <Input
                  placeholder="Brief overview for quick reference"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormDescription>
                Optional summary visible in client list (max 500 characters)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <Button disabled={isSubmitting} type="submit">
            {(() => {
              if (isSubmitting) {
                return isEditing ? "Updating..." : "Creating...";
              }
              return isEditing ? "Update Client" : "Create Client";
            })()}
          </Button>
          <Button
            disabled={isSubmitting}
            onClick={() => router.back()}
            type="button"
            variant="outline"
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
