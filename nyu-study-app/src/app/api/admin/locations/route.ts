import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const locationSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
  description: z.string().max(500).optional(),
});

const ADMIN_SECRET = process.env.ADMIN_SECRET;

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (ADMIN_SECRET && authHeader !== `Bearer ${ADMIN_SECRET}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const locations = z.array(locationSchema).parse(body);

    const results = await Promise.all(
      locations.map(async (loc) => {
        try {
          const existing = await prisma.location.findUnique({
            where: { slug: loc.slug },
          });

          if (existing) {
            return { ...loc, status: "skipped", reason: "Slug already exists" };
          }

          await prisma.location.create({
            data: {
              name: loc.name,
              slug: loc.slug,
              description: loc.description || null,
            },
          });

          return { ...loc, status: "created" };
        } catch (error) {
          return { ...loc, status: "error", reason: String(error) };
        }
      })
    );

    const created = results.filter((r: { status: string }) => r.status === "created").length;
    const skipped = results.filter((r: { status: string }) => r.status === "skipped").length;
    const errors = results.filter((r: { status: string }) => r.status === "error").length;

    return NextResponse.json({
      success: true,
      summary: { created, skipped, errors },
      results,
    });
  } catch (error) {
    console.error("Upload locations error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
