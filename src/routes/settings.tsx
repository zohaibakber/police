import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/settings")({
  component: Settings,
});

function Settings() {
  return (
    <main className="p-2">
      <h3>Settings</h3>
    </main>
  );
}
