import Shop from "@/components/Shop";
import HydrationGate from "@/components/HydrationGate";

export default function ShopPage() {
  return (
    <HydrationGate>
      <Shop />
    </HydrationGate>
  );
}
