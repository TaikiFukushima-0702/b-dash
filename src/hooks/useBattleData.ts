"use client";

import { useState, useEffect } from "react";
import { BattleRecord } from "@/lib/types";
import { fetchSheetData } from "@/lib/fetchSheetData";
import { sampleData } from "@/lib/sampleData";

export function useBattleData() {
  const [records, setRecords] = useState<BattleRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SHEET_CSV_URL;

    if (!url) {
      setRecords(sampleData);
      setIsLoading(false);
      return;
    }

    fetchSheetData(url)
      .then(setRecords)
      .catch((e) => setError(e.message))
      .finally(() => setIsLoading(false));
  }, []);

  return { records, isLoading, error };
}
