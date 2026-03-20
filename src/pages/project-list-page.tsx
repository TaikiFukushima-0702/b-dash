import { useState } from "react";
import { useProjects } from "@/hooks/use-projects";
import { ProjectList } from "@/components/projects/project-list";
import { ProjectForm } from "@/components/projects/project-form";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Plus } from "lucide-react";
import type { ProjectStatus } from "@/types";
import { PROJECT_STATUS_LABELS } from "@/lib/constants";

export function ProjectListPage() {
  const { projects, add, remove } = useProjects();
  const [formOpen, setFormOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = statusFilter === "all"
    ? projects
    : projects.filter((p) => p.status === statusFilter);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">案件一覧</h1>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          新規案件
        </Button>
      </div>
      <div className="mb-4">
        <Select
          className="w-40"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">すべて</option>
          {(Object.entries(PROJECT_STATUS_LABELS) as [ProjectStatus, string][]).map(
            ([value, label]) => (
              <option key={value} value={value}>{label}</option>
            )
          )}
        </Select>
      </div>
      <ProjectList projects={filtered} onDelete={remove} />
      <ProjectForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={add}
      />
    </div>
  );
}
