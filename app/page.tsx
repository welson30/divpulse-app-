import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-sp-6 px-sp-3 py-sp-8">
      {/* eslint-disable-next-line @next/next/no-img-element -- static local SVG, next/image needs dangerouslyAllowSVG for this */}
      <img src="/logo.svg" alt="DivPulse" className="h-16 w-16 rounded-card" width={64} height={64} />

      <div className="flex max-w-md flex-col items-center gap-sp-2 text-center">
        <h1 className="text-h1">DivPulse</h1>
        <p className="text-body text-text-secondary">
          Dividend income dashboard. Design tokens, type scale, and the
          approved component kit are wired into the global theme.
        </p>
      </div>

      {/* kit.css — the approved, preserved DivPulse component classes */}
      <div className="flex flex-wrap items-center justify-center gap-sp-2">
        <button className="btn btn-primary">Add holding</button>
        <button className="btn btn-secondary">View details</button>
        <button className="btn btn-destructive">Remove position</button>
      </div>

      <div className="flex items-center gap-sp-2">
        <span className="badge badge-info">New feature</span>
        <span className="badge badge-warning">Trial ends in 3 days</span>
      </div>

      {/* shadcn/ui — same tokens, for cases that need a composable primitive */}
      <div className="flex flex-wrap items-center justify-center gap-sp-2">
        <Button>Add holding</Button>
        <Button variant="secondary">View details</Button>
        <Button variant="destructive">Remove position</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
      </div>
    </main>
  );
}
