import { useState, useCallback, useEffect } from "react";
import { useDatabase } from "./use-database";
import type { Todo, TodoPriority } from "@/types";
import {
  getTodosByProjectId,
  createTodo,
  updateTodo,
  deleteTodo,
} from "@/lib/repositories/todo-repository";

export function useTodos(projectId: string) {
  const db = useDatabase();
  const [todos, setTodos] = useState<Todo[]>([]);

  const refresh = useCallback(() => {
    setTodos(getTodosByProjectId(db, projectId));
  }, [db, projectId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const add = useCallback(
    async (data: { title: string; description?: string; priority?: TodoPriority; due_date?: string | null }) => {
      await createTodo(db, { ...data, project_id: projectId });
      refresh();
    },
    [db, projectId, refresh]
  );

  const update = useCallback(
    async (id: string, data: Partial<Omit<Todo, "id" | "project_id" | "created_at" | "updated_at">>) => {
      await updateTodo(db, id, data);
      refresh();
    },
    [db, refresh]
  );

  const remove = useCallback(
    async (id: string) => {
      await deleteTodo(db, id);
      refresh();
    },
    [db, refresh]
  );

  return { todos, add, update, remove, refresh };
}
