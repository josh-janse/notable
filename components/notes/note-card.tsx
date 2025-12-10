import { Calendar, Clock, FileText, User } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Database } from "@/lib/types/database.types";

type Note = Database["public"]["Tables"]["notes"]["Row"] & {
  client?: {
    full_name: string;
  };
  note_template?: {
    name: string;
  };
};

type NoteCardProps = {
  note: Note;
  showClient?: boolean;
};

export function NoteCard({ note, showClient = true }: NoteCardProps) {
  const statusColors: Record<string, string> = {
    draft: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    completed: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    approved: "bg-green-500/10 text-green-500 border-green-500/20",
  };

  const statusColor = statusColors[note.status || "draft"];

  const sessionDate = note.session_date
    ? new Date(note.session_date)
    : new Date(note.created_at || "");

  const formattedDate = sessionDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const formattedTime = sessionDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Link
      className="block transition-transform hover:scale-[1.01]"
      href={`/clients/${note.client_id}/notes/${note.id}`}
    >
      <Card className="overflow-hidden border-border transition-all hover:border-foreground/20 hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <CardTitle className="line-clamp-1 text-base">
                {note.note_template?.name || "Untitled Note"}
              </CardTitle>
              {showClient && note.client && (
                <CardDescription className="mt-1 flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {note.client.full_name}
                </CardDescription>
              )}
            </div>
            <Badge className={statusColor} variant="outline">
              {note.status || "draft"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-4 text-muted-foreground text-xs">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{formattedTime}</span>
            </div>
            {note.duration_minutes && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{note.duration_minutes} min</span>
              </div>
            )}
          </div>

          {note.markdown_content && (
            <div className="line-clamp-2 text-muted-foreground text-sm">
              {note.markdown_content.substring(0, 150)}...
            </div>
          )}

          {note.follow_up_items && note.follow_up_items.length > 0 && (
            <div className="flex items-center gap-2">
              <FileText className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground text-xs">
                {note.follow_up_items.length} follow-up{" "}
                {note.follow_up_items.length === 1 ? "item" : "items"}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
