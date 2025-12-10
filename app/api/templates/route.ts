import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const isActive = searchParams.get("is_active");

    let query = supabase
      .from("note_templates")
      .select("*")
      .order("name", { ascending: true });

    if (isActive !== null) {
      query = query.eq("is_active", isActive === "true");
    }

    const { data: templates, error } = await query;

    if (error) {
      console.error("Failed to fetch templates:", error);
      return Response.json(
        { error: "Failed to fetch templates" },
        { status: 500 }
      );
    }

    return Response.json({ templates: templates || [] });
  } catch (error) {
    console.error("GET /api/templates error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
