/**
 * Clients API Route Handler
 *
 * GET /api/clients - List clients with search, filter, and pagination
 * POST /api/clients - Create a new client
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database.types";
import {
  clientQuerySchema,
  createClientSchema,
} from "@/lib/validations/client";

type Client = Database["public"]["Tables"]["clients"]["Row"];

/**
 * GET /api/clients
 * List clients with optional search, status filter, and pagination
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = {
      search: searchParams.get("search") || undefined,
      status: searchParams.get("status") || undefined,
      page: searchParams.get("page") || undefined,
      limit: searchParams.get("limit") || undefined,
    };

    const validatedParams = clientQuerySchema.parse(queryParams);

    // Build query
    let query = supabase
      .from("clients")
      .select("*", { count: "exact" })
      .eq("practitioner_id", user.id)
      .is("archived_at", null) // Exclude archived by default
      .order("created_at", { ascending: false });

    // Apply search filter
    if (validatedParams.search) {
      query = query.ilike("full_name", `%${validatedParams.search}%`);
    }

    // Apply status filter
    if (validatedParams.status) {
      query = query.eq("status", validatedParams.status);
    }

    // Apply pagination
    const from = (validatedParams.page - 1) * validatedParams.limit;
    const to = from + validatedParams.limit - 1;
    query = query.range(from, to);

    // Execute query
    const { data: clients, error, count } = await query;

    if (error) {
      console.error("Error fetching clients:", error);
      return NextResponse.json(
        { error: "Failed to fetch clients" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      clients: clients as Client[],
      pagination: {
        page: validatedParams.page,
        limit: validatedParams.limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / validatedParams.limit),
      },
    });
  } catch (error) {
    console.error("Error in GET /api/clients:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid query parameters", details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/clients
 * Create a new client profile
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createClientSchema.parse(body);

    // Insert client
    const { data: client, error } = await supabase
      .from("clients")
      .insert({
        practitioner_id: user.id,
        full_name: validatedData.full_name,
        email: validatedData.email || null,
        phone: validatedData.phone || null,
        date_of_birth: validatedData.date_of_birth
          ? validatedData.date_of_birth.toISOString()
          : null,
        initial_assessment_date: validatedData.initial_assessment_date
          ? validatedData.initial_assessment_date.toISOString()
          : null,
        notes_summary: validatedData.notes_summary || null,
        metadata: validatedData.metadata || {},
        status: "active",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating client:", error);
      return NextResponse.json(
        { error: "Failed to create client" },
        { status: 500 }
      );
    }

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/clients:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid request body", details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
