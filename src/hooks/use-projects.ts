import { useState, useCallback, useEffect } from "react";
import { useDatabase } from "./use-database";
import type { Project, ProjectStatus } from "@/types";
import {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} from "@/lib/repositories/project-repository";

export function useProjects() {
  const db = useDatabase();
  const [projects, setProjects] = useState<Project[]>([]);

  const refresh = useCallback(() => {
    setProjects(getAllProjects(db));
  }, [db]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const add = useCallback(
    async (data: { name: string; customer_name: string; status?: ProjectStatus; assignee?: string; description?: string }) => {
      await createProject(db, data);
      refresh();
    },
    [db, refresh]
  );

  const update = useCallback(
    async (id: string, data: Partial<Omit<Project, "id" | "created_at" | "updated_at">>) => {
      await updateProject(db, id, data);
      refresh();
    },
    [db, refresh]
  );

  const remove = useCallback(
    async (id: string) => {
      await deleteProject(db, id);
      refresh();
    },
    [db, refresh]
  );

  const getById = useCallback(
    (id: string) => getProjectById(db, id),
    [db]
  );

  return { projects, add, update, remove, getById, refresh };
}
