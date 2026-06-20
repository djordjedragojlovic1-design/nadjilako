export default function ChatPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 p-12 text-center text-muted-foreground">
      <svg
        className="text-border"
        width="64"
        height="64"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
      >
        <path
          d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
      <p>Izaberite razgovor sa liste da biste vidjeli poruke.</p>
    </div>
  );
}
