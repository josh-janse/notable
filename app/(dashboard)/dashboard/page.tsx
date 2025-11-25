import { Bell, Calendar, FileText, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's an overview of your practice.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Total Clients</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">0</div>
            <p className="text-muted-foreground text-xs">No clients yet</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Total Notes</CardTitle>
            <FileText className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">0</div>
            <p className="text-muted-foreground text-xs">No notes yet</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Upcoming Sessions
            </CardTitle>
            <Calendar className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">0</div>
            <p className="text-muted-foreground text-xs">
              No sessions scheduled
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Notifications</CardTitle>
            <Bell className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">0</div>
            <p className="text-muted-foreground text-xs">All caught up</p>
          </CardContent>
        </Card>
      </div>

      {/* Session Notifications Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Session Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="mb-4 size-12 text-muted-foreground" />
              <p className="text-muted-foreground text-sm">
                No upcoming session notifications
              </p>
              <p className="mt-2 text-muted-foreground text-xs">
                Session reminders will appear here when you schedule follow-ups
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FileText className="mb-4 size-12 text-muted-foreground" />
              <p className="text-muted-foreground text-sm">
                No recent activity
              </p>
              <p className="mt-2 text-muted-foreground text-xs">
                Your recent notes and actions will appear here
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <a
              className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted"
              href="/clients"
            >
              <Users className="size-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Manage Clients</p>
                <p className="text-muted-foreground text-xs">
                  View and manage your client roster
                </p>
              </div>
            </a>
            <a
              className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted"
              href="/notes/new"
            >
              <FileText className="size-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Create Note</p>
                <p className="text-muted-foreground text-xs">
                  Start a new session note
                </p>
              </div>
            </a>
            <a
              className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted"
              href="/search"
            >
              <FileText className="size-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Search Notes</p>
                <p className="text-muted-foreground text-xs">
                  Find notes using natural language
                </p>
              </div>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
