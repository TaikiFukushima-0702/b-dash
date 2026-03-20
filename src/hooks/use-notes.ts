import { useState, useCallback, useEffect } from "react";
import { useDatabase } from "./use-database";
import type { Note } from "@/types";
import {
  getNotesByProjectId,
  createNote,
  updateNote,
  deleteNote,
} from "@/lib/repositories/note-repository";

export function useNotes(projectId: string) {
  const db = useDatabase();
  const [notes, setNotes] = useState<Note[]>([]);

  const refresh = useCallback(() => {
    setNotes(getNotesByProjectId(db, projectId));
  }, [db, projectId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const add = useCallback(
    async (content: string) => {
      await createNote(db, { project_id: projectId, content });
      refresh();
    },
    [db, projectId, refresh]
  );

  const update = useCallback(
    async (id: string, content: string) => {
      await updateNote(db, id, content);
      refresh();
    },
    [db, refresh]
  );

  const remove = useCallback(
    async (id: string) => {
      await deleteNote(db, id);
      refresh();
    },
    [db, refresh]
  );

  return { notes, add, update, remove, refresh };
}
