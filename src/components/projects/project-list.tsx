import { useNavigate } from "react-router-dom";
import type { Project } from "@/types";
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface ProjectListProps {
  projects: Project[];
  onDelete: (id: string) => void;
}

export function ProjectList({ projects, onDelete }: ProjectListProps) {
  const navigate = useNavigate();

  if (projects.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        まだ案件がありません。「新規案件」ボタンから作成してください。
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left p-3 font-medium">案件名</th>
            <th className="text-left p-3 font-medium">顧客名</th>
            <th className="text-left p-3 font-medium">ステータス</th>
            <th className="text-left p-3 font-medium">担当者</th>
            <th className="text-left p-3 font-medium">更新日</th>
            <th className="text-right p-3 font-medium w-12"></th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => (
            <tr
              key={project.id}
              className="border-t hover:bg-muted/30 cursor-pointer transition-colors"
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              <td className="p-3 font-medium">{project.name}</td>
              <td className="p-3">{project.customer_name}</td>
              <td className="p-3">
                <Badge className={PROJECT_STATUS_COLORS[project.status]} variant="secondary">
                  {PROJECT_STATUS_LABELS[project.status]}
                </Badge>
              </td>
              <td className="p-3">{project.assignee || "—"}</td>
              <td className="p-3 text-muted-foreground">{project.updated_at?.slice(0, 10)}</td>
              <td className="p-3 text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("この案件を削除しますか？関連するToDo・メモもすべて削除されます。")) {
                      onDelete(project.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
