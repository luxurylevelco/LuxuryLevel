export default function Spinner({ className }: { className?: string }) {
  return (
    <span className={`flex items-center justify-center `}>
      <span
        className={`h-10 w-10 animate-spin rounded-full border-4 border-solid border-gray-300 border-t-black ${className}`}
      />
    </span>
  );
}
