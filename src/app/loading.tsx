import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-12 sm:px-6 lg:px-8">
      <div className="space-y-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-12 max-w-xl" />
        <Skeleton className="h-6 max-w-2xl" />
      </div>
      <Skeleton className="h-20 rounded-2xl" />
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="aspect-[0.78] rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
