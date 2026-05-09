import type * as React from "react";

import { cn } from "~/lib/utils";

// Toban PageContainer — unified horizontal padding + max-width for any page
// that doesn't use a `MasterDetailLayout`. Mobile: 16 px gutter; desktop:
// 24 px gutter inside a centred 1280 px column.
function PageContainer({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="page-container"
      className={cn("mx-auto w-full max-w-screen-xl px-4 md:px-6", className)}
      {...props}
    />
  );
}

export { PageContainer };
