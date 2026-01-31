import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email, password, username } = await request.json();

    // Validate NYU email
    if (!email.endsWith("@nyu.edu")) {
      return NextResponse.json(
        { error: "Only NYU email addresses (@nyu.edu) are allowed" },
        { status: 400 }
      );
    }

    // Validate username
    if (!username || username.length < 3 || username.length > 20) {
      return NextResponse.json(
        { error: "Username must be between 3 and 20 characters" },
        { status: 400 }
      );
    }

    // Check if username is already taken
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Username is already taken" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
      },
    });

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      );
    }

    // Create user in our database
    await prisma.user.create({
      data: {
        id: authData.user.id,
        email,
        username,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Check your email to confirm your account",
      userId: authData.user.id,
    });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
