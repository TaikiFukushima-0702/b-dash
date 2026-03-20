import { useState } from "react";
import type { Todo, TodoPriority } from "@/types";
import { TODO_PRIORITY_LABELS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface TodoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    title: string;
    description?: string;
    priority?: TodoPriority;
    due_date?: string | null;
  }) => void;
  initial?: Todo | null;
}

export function TodoForm({ open, onOpenChange, onSubmit, initial }: TodoFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [priority, setPriority] = useState<TodoPriority>(initial?.priority ?? "medium");
  const [dueDate, setDueDate] = useState(initial?.due_date ?? "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      priority,
      due_date: dueDate || null,
    });
    if (!initial) {
      setTitle("");
      setDescription("");
      setPriority("medium");
      setDueDate("");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>{initial ? "ToDo を編集" : "新規 ToDo"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">タイトル *</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="ToDoのタイトル" required />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">説明</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="詳細な説明" rows={2} />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-1 block">優先度</label>
              <Select value={priority} onChange={(e) => setPriority(e.target.value as TodoPriority)}>
                {(Object.entries(TODO_PRIORITY_LABELS) as [TodoPriority, string][]).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-1 block">期限</label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              キャンセル
            </Button>
            <Button type="submit">{initial ? "更新" : "追加"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
