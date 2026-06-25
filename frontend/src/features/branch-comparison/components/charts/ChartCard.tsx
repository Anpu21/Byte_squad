import type { ReactNode } from "react";
import Card from "@/components/ui/Card";

export function ChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Card className="p-5">
      <div className="mb-4">
        <h3 className="text-[14px] font-semibold tracking-tight text-text-1">
          {title}
        </h3>
        <p className="mt-0.5 text-[11px] text-text-3">{description}</p>
      </div>
      {children}
    </Card>
  );
}
