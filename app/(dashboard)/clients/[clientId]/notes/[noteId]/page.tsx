import { Calendar, Clock, Edit, FileText } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{
    clientId: string;
    noteId: string;
  }>;
};

type Note = {
  id: string;
  markdown_content: string;
  status: "draft" | "completed" | "approved";
  session_date: string;
  duration_minutes: number | null;
  follow_up_items: string[] | null;
  created_at: string;
  approved_at: string | null;
  client: {
    id: string;
    full_name: string;
  };
  note_template: {
    id: string;
    name: string;
  };
};

async function getNote(noteId: string): Promise<Note | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: note, error } = await supabase
    .from("notes")
    .select(
      `
      *,
      client:clients!notes_client_id_fkey(id, full_name),
      note_template:note_templates!notes_template_id_fkey(id, name)
    `
    )
    .eq("id", noteId)
    .eq("practitioner_id", user.id)
    .single();

  if (error || !note) {
    return null;
  }

  return note as Note;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDuration(minutes: number | null): string {
  if (!minutes) {
    return "Not specified";
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

function getStatusBadge(status: string) {
  const styles = {
    draft: "bg-yellow-100 text-yellow-800",
    completed: "bg-blue-100 text-blue-800",
    approved: "bg-green-100 text-green-800",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-medium text-xs ${styles[status as keyof typeof styles]}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default async function NoteViewPage({ params }: PageProps) {
  const { clientId, noteId } = await params;
  const note = await getNote(noteId);

  if (!note || note.client.id !== clientId) {
    notFound();
  }

  return (
    <div className="container mx-auto max-w-5xl py-8">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-bold text-foreground">
                {note.client.full_name}
              </h1>
              {getStatusBadge(note.status)}
            </div>
            <p className="text-muted-foreground">
              {note.note_template.name} • {formatDate(note.session_date)}
            </p>
          </div>

          {/* Button group: full width on mobile, content-sized on md+ */}
          <div className="flex w-full gap-2 md:w-auto">
            {/* Edit */}
            <Button
              asChild
              className="w-full flex-1 gap-2 md:w-auto md:flex-none"
              variant="outline"
            >
              <Link href={`/clients/${clientId}/notes/${noteId}/edit`}>
                <Edit className="h-4 w-4" />
                Edit
              </Link>
            </Button>

            {/* Delete - hidden to functionality active */}
            {/*<Button
              className="w-full flex-1 gap-2 md:w-auto md:flex-none"
              variant="destructive"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>*/}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Note Content</CardTitle>
              <CardDescription>
                Session documentation and observations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none space-y-4">
                {note.markdown_content ? (
                  note.markdown_content.split("\n\n").map((paragraph) => {
                    if (paragraph.startsWith("## ")) {
                      const text = paragraph.slice(3);
                      return (
                        <h2
                          className="mt-6 mb-3 font-semibold text-xl"
                          key={text}
                        >
                          {text}
                        </h2>
                      );
                    }
                    if (paragraph.startsWith("# ")) {
                      const text = paragraph.slice(2);
                      return (
                        <h1 className="mt-6 mb-3 font-bold text-2xl" key={text}>
                          {text}
                        </h1>
                      );
                    }
                    if (paragraph.trim()) {
                      return (
                        <p className="mb-2" key={paragraph}>
                          {paragraph}
                        </p>
                      );
                    }
                    return null;
                  })
                ) : (
                  <p className="text-muted-foreground italic">
                    No content available
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Session Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">Session Date</p>
                    <p className="text-muted-foreground text-sm">
                      {formatDate(note.session_date)}
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">Duration</p>
                    <p className="text-muted-foreground text-sm">
                      {formatDuration(note.duration_minutes)}
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-start gap-3">
                  <FileText className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">Template</p>
                    <p className="text-muted-foreground text-sm">
                      {note.note_template.name}
                    </p>
                  </div>
                </div>
                {note.approved_at && (
                  <>
                    <Separator />
                    <div className="flex items-start gap-3">
                      <FileText className="mt-0.5 h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">Approved</p>
                        <p className="text-muted-foreground text-sm">
                          {formatDate(note.approved_at)}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {note.follow_up_items && note.follow_up_items.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Follow-up Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {note.follow_up_items.map((item) => (
                      <li className="flex gap-2 text-sm" key={item}>
                        <span className="text-muted-foreground">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
