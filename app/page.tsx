import Character from "@/components/Character";
import Stats from "@/components/Stats";
import ActivityLogger from "@/components/ActivityLogger";
import RecentActivities from "@/components/RecentActivities";
import HydrationGate from "@/components/HydrationGate";

export default function HomePage() {
  return (
    <HydrationGate>
      <div className="space-y-4">
        <Character />
        <Stats />
        <ActivityLogger />
        <RecentActivities />
      </div>
    </HydrationGate>
  );
}
