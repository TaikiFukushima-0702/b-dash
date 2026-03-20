import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="text-center py-20">
      <h1 className="text-4xl font-bold mb-4">404</h1>
      <p className="text-muted-foreground mb-6">ページが見つかりません</p>
      <Button onClick={() => navigate("/")}>ダッシュボードへ戻る</Button>
    </div>
  );
}
