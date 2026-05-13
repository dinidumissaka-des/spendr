import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const CATEGORIES = [
  "Food & Dining",
  "Grocery",
  "Transport",
  "Shopping",
  "Entertainment",
  "Health",
  "Utilities",
  "Travel",
  "Education",
];

export async function POST(request: NextRequest) {
  const body = await request.json();
  const description: string = body.description ?? "";

  if (typeof description !== "string" || description.trim().length < 2) {
    return NextResponse.json({ category: null }, { status: 400 });
  }

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 16,
      system: `You are an expense categorizer. Given an expense description, respond with ONLY one of these exact category names and nothing else: ${CATEGORIES.join(", ")}.`,
      messages: [{ role: "user", content: description.trim() }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text.trim() : "";
    const category = CATEGORIES.find((c) => c === text) ?? null;
    return NextResponse.json({ category });
  } catch {
    return NextResponse.json({ category: null }, { status: 500 });
  }
}
