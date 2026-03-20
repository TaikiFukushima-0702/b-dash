import { useContext } from "react";
import { DatabaseContext } from "@/context/database-context";

export function useDatabase() {
  const db = useContext(DatabaseContext);
  if (!db) {
    throw new Error("useDatabase must be used within a DatabaseProvider");
  }
  return db;
}
