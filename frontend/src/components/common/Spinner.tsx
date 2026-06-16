export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dim = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' }[size];
  return (
    <span
      className={`inline-block ${dim} animate-spin rounded-full border-2 border-blue-100 border-t-blue-500`}
      role="status"
      aria-label="Loading"
    />
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-gray-100 ${className}`} aria-hidden="true" />;
}
