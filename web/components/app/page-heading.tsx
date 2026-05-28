import type { ReactNode } from "react";

export function PageHeading({
  eyebrow,
  title,
  children
}: {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-4">
      {eyebrow ? <p className="mb-2 text-xs font-bold uppercase text-gold">{eyebrow}</p> : null}
      <h1 className="text-3xl font-black tracking-normal">{title}</h1>
      {children ? <div className="mt-2 text-sm leading-6 text-smoke">{children}</div> : null}
    </div>
  );
}
