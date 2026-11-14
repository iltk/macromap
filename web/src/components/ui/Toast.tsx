export function Toast({ message, tone = "dark" }: { message: string | null; tone?: "dark" | "error" }) {
  if (!message) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-none fixed bottom-6 left-1/2 z-40 -translate-x-1/2 rounded-md px-3.5 py-2.5 text-sm shadow-lg ${
        tone === "error" ? "bg-danger-ink text-white" : "bg-gray-900 text-white"
      }`}
    >
      {message}
    </div>
  );
}
