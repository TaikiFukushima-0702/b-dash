import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProjects } from "@/hooks/use-projects";
import { useTodos } from "@/hooks/use-todos";
import { useNotes } from "@/hooks/use-notes";
import type { Project, Todo, TodoStatus } from "@/types";
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS } from "@/lib/constants";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProjectForm } from "@/components/projects/project-form";
import { TodoForm } from "@/components/todos/todo-form";
import { TodoList } from "@/components/todos/todo-list";
import { NoteEditor } from "@/components/notes/note-editor";
import { NoteList } from "@/components/notes/note-list";
import { ArrowLeft, Pencil, Plus } from "lucide-react";

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { getById, update } = useProjects();
  const { todos, add: addTodo, update: updateTodo, remove: removeTodo } = useTodos(projectId!);
  const { notes, add: addNote, update: updateNote, remove: removeNote } = useNotes(projectId!);

  const [project, setProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [todoFormOpen, setTodoFormOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);

  useEffect(() => {
    if (projectId) {
      setProject(getById(projectId));
    }
  }, [projectId, getById]);

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">案件が見つかりません</p>
        <Button variant="outline" onClick={() => navigate("/projects")}>
          案件一覧へ戻る
        </Button>
      </div>
    );
  }

  return (
    <div>
      <button
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 cursor-pointer"
        onClick={() => navigate("/projects")}
      >
        <ArrowLeft className="h-4 w-4" />
        案件一覧
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <Badge className={PROJECT_STATUS_COLORS[project.status]} variant="secondary">
              {PROJECT_STATUS_LABELS[project.status]}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">{project.customer_name}</p>
        </div>
        <Button variant="outline" onClick={() => setEditFormOpen(true)}>
          <Pencil className="h-4 w-4 mr-2" />
          編集
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">概要</TabsTrigger>
          <TabsTrigger value="todos">課題・ToDo ({todos.length})</TabsTrigger>
          <TabsTrigger value="notes">メモ ({notes.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 mt-4">
            <div className="border rounded-lg p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">担当者</h3>
              <p className="text-sm">{project.assignee || "未設定"}</p>
            </div>
            <div className="border rounded-lg p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">説明</h3>
              <p className="text-sm whitespace-pre-wrap">{project.description || "説明はありません"}</p>
            </div>
            <div className="border rounded-lg p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">作成日</h3>
              <p className="text-sm">{project.created_at?.slice(0, 10)}</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="todos">
          <div className="mt-4">
            <div className="flex justify-end mb-4">
              <Button onClick={() => { setEditingTodo(null); setTodoFormOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                ToDo追加
              </Button>
            </div>
            <TodoList
              todos={todos}
              onStatusChange={(id, status: TodoStatus) => updateTodo(id, { status })}
              onEdit={(todo) => { setEditingTodo(todo); setTodoFormOpen(true); }}
              onDelete={removeTodo}
            />
          </div>
        </TabsContent>

        <TabsContent value="notes">
          <div className="mt-4 space-y-4">
            <NoteEditor onSubmit={addNote} />
            <NoteList notes={notes} onUpdate={updateNote} onDelete={removeNote} />
          </div>
        </TabsContent>
      </Tabs>

      <ProjectForm
        open={editFormOpen}
        onOpenChange={setEditFormOpen}
        initial={project}
        onSubmit={async (data) => {
          await update(project.id, data);
          setProject(getById(project.id));
        }}
      />

      <TodoForm
        open={todoFormOpen}
        onOpenChange={setTodoFormOpen}
        initial={editingTodo}
        onSubmit={async (data) => {
          if (editingTodo) {
            await updateTodo(editingTodo.id, data);
          } else {
            await addTodo(data);
          }
        }}
      />
    </div>
  );
}
