import Inventory from "@/components/Inventory";
import HydrationGate from "@/components/HydrationGate";

export default function InventoryPage() {
  return (
    <HydrationGate>
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-2xl border-4 border-frame-dark bg-pop-pink px-4 py-2 shadow-pop">
          <div className="flex items-center gap-2 font-bold text-frame-dark">
            <span className="text-2xl">🎒</span>
            <span>もちもの</span>
          </div>
        </div>
        <Inventory />
      </div>
    </HydrationGate>
  );
}
