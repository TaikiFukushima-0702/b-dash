import { useNavigate } from "react-router-dom";
import { useDatabase } from "@/hooks/use-database";
import { useProjects } from "@/hooks/use-projects";
import { getProjectCounts } from "@/lib/repositories/project-repository";
import { getRecentTodos } from "@/lib/repositories/todo-repository";
import { getRecentNotes } from "@/lib/repositories/note-repository";
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS } from "@/lib/constants";
import type { ProjectStatus } from "@/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FolderKanban, ListTodo, StickyNote, Clock } from "lucide-react";

export function DashboardPage() {
  const db = useDatabase();
  const { projects } = useProjects();
  const navigate = useNavigate();

  const counts = getProjectCounts(db);
  const totalProjects = Object.values(counts).reduce((a, b) => a + b, 0);
  const recentTodos = getRecentTodos(db, 5);
  const recentNotes = getRecentNotes(db, 5);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">ダッシュボード</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">全案件数</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProjects}</div>
          </CardContent>
        </Card>
        {(Object.entries(PROJECT_STATUS_LABELS) as [ProjectStatus, string][]).slice(0, 3).map(([status, label]) => (
          <Card key={status}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Badge className={PROJECT_STATUS_COLORS[status]} variant="secondary">
                {counts[status]}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{counts[status]}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Active Projects */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FolderKanban className="h-4 w-4" />
              進行中の案件
            </CardTitle>
          </CardHeader>
          <CardContent>
            {projects.filter((p) => p.status === "active").length === 0 ? (
              <p className="text-sm text-muted-foreground">進行中の案件はありません</p>
            ) : (
              <div className="space-y-2">
                {projects
                  .filter((p) => p.status === "active")
                  .slice(0, 5)
                  .map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/projects/${p.id}`)}
                    >
                      <div>
                        <p className="text-sm font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.customer_name}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{p.assignee || "—"}</span>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4" />
              最近のアクティビティ
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentTodos.length === 0 && recentNotes.length === 0 ? (
              <p className="text-sm text-muted-foreground">まだアクティビティはありません</p>
            ) : (
              <div className="space-y-2">
                {recentTodos.map((todo) => (
                  <div key={`todo-${todo.id}`} className="flex items-start gap-2 p-2 rounded-lg hover:bg-muted/50">
                    <ListTodo className="h-4 w-4 mt-0.5 text-blue-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{todo.title}</p>
                      <p className="text-xs text-muted-foreground">{todo.project_name}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {todo.updated_at?.slice(0, 10)}
                    </span>
                  </div>
                ))}
                {recentNotes.map((note) => (
                  <div key={`note-${note.id}`} className="flex items-start gap-2 p-2 rounded-lg hover:bg-muted/50">
                    <StickyNote className="h-4 w-4 mt-0.5 text-green-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{note.content.slice(0, 50)}</p>
                      <p className="text-xs text-muted-foreground">{note.project_name}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {note.updated_at?.slice(0, 10)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
