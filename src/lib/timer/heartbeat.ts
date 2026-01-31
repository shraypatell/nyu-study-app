export async function sendHeartbeat(): Promise<boolean> {
  try {
    const response = await fetch("/api/timer/heartbeat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    return response.ok;
  } catch (error) {
    console.error("Heartbeat failed:", error);
    return false;
  }
}

export function setupHeartbeat(intervalMs: number = 30000): () => void {
  const intervalId = setInterval(async () => {
    await sendHeartbeat();
  }, intervalMs);

  return () => clearInterval(intervalId);
}

export function setupBeforeUnloadHandler(): void {
  window.addEventListener("beforeunload", async (e) => {
    await fetch("/api/timer/pause", {
      method: "POST",
      keepalive: true,
    });
  });
}
