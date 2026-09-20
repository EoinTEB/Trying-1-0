"use client";

import { useRef, useState } from "react";

type TaskStatus =
  | { status: "PENDING" | "THROTTLED" | "RUNNING"; progress?: number }
  | { status: "SUCCEEDED"; output: string[] }
  | { status: "FAILED"; failure: string }
  | { status: "CANCELLED" };

export default function VideoToVideoPage() {
  const [videoUri, setVideoUri] = useState("");
  const [promptText, setPromptText] = useState("");
  const [taskId, setTaskId] = useState<string | null>(null);
  const [task, setTask] = useState<TaskStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function stopPolling() {
    if (pollRef.current) {
      clearTimeout(pollRef.current);
      pollRef.current = null;
    }
  }

  function pollTask(id: string) {
    stopPolling();
    const check = async () => {
      const res = await fetch(`/api/video-to-video/${id}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }

      setTask(data);

      if (data.status === "SUCCEEDED" || data.status === "FAILED" || data.status === "CANCELLED") {
        return;
      }

      pollRef.current = setTimeout(check, 5000);
    };

    check();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setTask(null);
    setTaskId(null);
    stopPolling();
    setSubmitting(true);

    try {
      const res = await fetch("/api/video-to-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUri, promptText }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }

      setTaskId(data.id);
      pollTask(data.id);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main
      style={{
        maxWidth: 640,
        margin: "0 auto",
        padding: "64px 24px",
        fontFamily: "var(--font-inter)",
      }}
    >
      <h1
        style={{
          fontFamily: "var(--font-playfair)",
          fontSize: 32,
          marginBottom: 8,
        }}
      >
        Video to Video
      </h1>
      <p style={{ opacity: 0.7, marginBottom: 32 }}>
        Transform an existing video with Runway&apos;s Aleph 2 model.
      </p>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Video URL</span>
          <input
            type="url"
            required
            value={videoUri}
            onChange={(e) => setVideoUri(e.target.value)}
            placeholder="https://example.com/video.mp4"
            style={{
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid #d8d0c2",
              background: "#fff",
            }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Prompt (optional)</span>
          <textarea
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            placeholder="Describe what the output should look like"
            rows={3}
            style={{
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid #d8d0c2",
              background: "#fff",
              resize: "vertical",
            }}
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: "12px 20px",
            borderRadius: 8,
            border: "none",
            background: "#2C2924",
            color: "#F4EFE7",
            cursor: submitting ? "not-allowed" : "pointer",
            opacity: submitting ? 0.6 : 1,
          }}
        >
          {submitting ? "Starting…" : "Generate"}
        </button>
      </form>

      {error && (
        <p style={{ color: "#b3261e", marginTop: 24 }}>Error: {error}</p>
      )}

      {taskId && (
        <div style={{ marginTop: 32 }}>
          <p style={{ opacity: 0.7 }}>Task {taskId}</p>

          {(!task || task.status === "PENDING" || task.status === "THROTTLED" || task.status === "RUNNING") && (
            <p>
              Status: {task?.status ?? "PENDING"}
              {task && "progress" in task && task.progress !== undefined
                ? ` (${Math.round(task.progress * 100)}%)`
                : ""}
            </p>
          )}

          {task?.status === "FAILED" && (
            <p style={{ color: "#b3261e" }}>Failed: {task.failure}</p>
          )}

          {task?.status === "CANCELLED" && <p>Task was cancelled.</p>}

          {task?.status === "SUCCEEDED" && (
            <div style={{ marginTop: 16 }}>
              {task.output.map((url) => (
                <video key={url} src={url} controls style={{ width: "100%", borderRadius: 12 }} />
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
