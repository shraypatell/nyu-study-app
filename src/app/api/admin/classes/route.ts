import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const classSchema = z.object({
  name: z.string().min(1).max(200),
  code: z.string().min(1).max(50),
  section: z.string().max(50).optional(),
  semester: z.string().min(1).max(50),
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
    const classes = z.array(classSchema).parse(body);

    const results = await Promise.all(
      classes.map(async (cls) => {
        try {
          const existing = await prisma.class.findUnique({
            where: {
              code_section_semester: {
                code: cls.code,
                section: cls.section || "",
                semester: cls.semester,
              },
            },
          });

          if (existing) {
            return { ...cls, status: "skipped", reason: "Already exists" };
          }

          await prisma.class.create({
            data: {
              name: cls.name,
              code: cls.code,
              section: cls.section || null,
              semester: cls.semester,
            },
          });

          return { ...cls, status: "created" };
        } catch (error) {
          return { ...cls, status: "error", reason: String(error) };
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
    console.error("Upload classes error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
