import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="rounded-md border bg-white p-8 text-center">
      <h1 className="text-xl font-semibold">Page not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        The requested page does not exist in this demo state.
      </p>
      <Link href="/" className={`${buttonVariants({})} mt-4`}>
        Back to home
      </Link>
    </div>
  );
}
