export function Toast({ message, tone = "dark" }: { message: string | null; tone?: "dark" | "error" }) {
  if (!message) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-none fixed bottom-20 left-1/2 z-40 -translate-x-1/2 rounded-md px-4 py-3 text-sm shadow-lg ${
        tone === "error" ? "bg-[#d93025] text-white" : "bg-[#323232] text-white"
      }`}
    >
      {message}
    </div>
  );
}
