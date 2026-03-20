import { useState } from "react";
import type { Project, ProjectStatus } from "@/types";
import { PROJECT_STATUS_LABELS } from "@/lib/constants";
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

interface ProjectFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    name: string;
    customer_name: string;
    status: ProjectStatus;
    assignee: string;
    description: string;
  }) => void;
  initial?: Project | null;
}

export function ProjectForm({ open, onOpenChange, onSubmit, initial }: ProjectFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [customerName, setCustomerName] = useState(initial?.customer_name ?? "");
  const [status, setStatus] = useState<ProjectStatus>(initial?.status ?? "active");
  const [assignee, setAssignee] = useState(initial?.assignee ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !customerName.trim()) return;
    onSubmit({ name: name.trim(), customer_name: customerName.trim(), status, assignee: assignee.trim(), description: description.trim() });
    if (!initial) {
      setName("");
      setCustomerName("");
      setStatus("active");
      setAssignee("");
      setDescription("");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>{initial ? "案件を編集" : "新規案件"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">案件名 *</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="案件名を入力" required />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">顧客名 *</label>
            <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="顧客名を入力" required />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">ステータス</label>
            <Select value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus)}>
              {(Object.entries(PROJECT_STATUS_LABELS) as [ProjectStatus, string][]).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">担当者</label>
            <Input value={assignee} onChange={(e) => setAssignee(e.target.value)} placeholder="担当者名を入力" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">説明</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="案件の説明を入力" rows={3} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              キャンセル
            </Button>
            <Button type="submit">{initial ? "更新" : "作成"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
