import { NextResponse } from "next/server";
import RunwayML from "@runwayml/sdk";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!process.env.RUNWAYML_API_SECRET) {
    return NextResponse.json(
      { error: "Missing RUNWAYML_API_SECRET environment variable." },
      { status: 500 },
    );
  }

  const { id } = await params;
  const client = new RunwayML();

  try {
    const task = await client.tasks.retrieve(id);
    return NextResponse.json(task);
  } catch (error) {
    if (error instanceof RunwayML.APIError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status ?? 500 },
      );
    }
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
