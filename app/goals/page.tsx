import Goals from "@/components/Goals";
import HydrationGate from "@/components/HydrationGate";

export default function GoalsPage() {
  return (
    <HydrationGate>
      <Goals />
    </HydrationGate>
  );
}
