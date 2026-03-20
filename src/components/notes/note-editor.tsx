import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";

interface NoteEditorProps {
  onSubmit: (content: string) => void;
}

export function NoteEditor({ onSubmit }: NoteEditorProps) {
  const [content, setContent] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = () => {
    if (!content.trim()) return;
    onSubmit(content.trim());
    setContent("");
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <Button variant="outline" onClick={() => setIsOpen(true)} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        メモを追加
      </Button>
    );
  }

  return (
    <div className="space-y-2 border rounded-lg p-3">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="メモを入力..."
        rows={4}
        autoFocus
      />
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => { setIsOpen(false); setContent(""); }}>
          キャンセル
        </Button>
        <Button size="sm" onClick={handleSubmit} disabled={!content.trim()}>
          保存
        </Button>
      </div>
    </div>
  );
}
