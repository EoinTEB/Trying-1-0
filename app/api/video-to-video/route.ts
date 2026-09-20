import { NextRequest, NextResponse } from "next/server";
import RunwayML from "@runwayml/sdk";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!process.env.RUNWAYML_API_SECRET) {
    return NextResponse.json(
      { error: "Missing RUNWAYML_API_SECRET environment variable." },
      { status: 500 },
    );
  }

  const body = await request.json();

  if (!body?.videoUri) {
    return NextResponse.json(
      { error: "videoUri is required." },
      { status: 400 },
    );
  }

  const client = new RunwayML();

  try {
    const task = await client.videoToVideo.create({
      model: "aleph2",
      videoUri: body.videoUri,
      promptText: body.promptText || undefined,
      seed: body.seed ?? undefined,
    });

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
