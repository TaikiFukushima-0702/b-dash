import type { Todo, TodoStatus } from "@/types";
import { TODO_STATUS_LABELS, TODO_PRIORITY_LABELS, TODO_PRIORITY_COLORS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Trash2, Pencil } from "lucide-react";

interface TodoListProps {
  todos: Todo[];
  onStatusChange: (id: string, status: TodoStatus) => void;
  onEdit: (todo: Todo) => void;
  onDelete: (id: string) => void;
}

export function TodoList({ todos, onStatusChange, onEdit, onDelete }: TodoListProps) {
  if (todos.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        まだToDoがありません。「ToDo追加」ボタンから作成してください。
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {todos.map((todo) => (
        <div
          key={todo.id}
          className={`flex items-center gap-3 p-3 border rounded-lg transition-colors ${
            todo.status === "done" ? "opacity-60 bg-muted/30" : "bg-background"
          }`}
        >
          <Select
            className="w-28 h-8 text-xs"
            value={todo.status}
            onChange={(e) => onStatusChange(todo.id, e.target.value as TodoStatus)}
          >
            {(Object.entries(TODO_STATUS_LABELS) as [TodoStatus, string][]).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${todo.status === "done" ? "line-through" : ""}`}>
                {todo.title}
              </span>
              <Badge className={TODO_PRIORITY_COLORS[todo.priority]} variant="secondary">
                {TODO_PRIORITY_LABELS[todo.priority]}
              </Badge>
            </div>
            {todo.description && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{todo.description}</p>
            )}
          </div>
          {todo.due_date && (
            <span className="text-xs text-muted-foreground whitespace-nowrap">{todo.due_date}</span>
          )}
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(todo)}>
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => {
                if (confirm("このToDoを削除しますか？")) onDelete(todo.id);
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
