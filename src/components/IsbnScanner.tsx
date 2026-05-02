"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser";
import { Button } from "@/components/ui/button";
import { Camera, X } from "lucide-react";

type Props = { onDetect: (isbn: string) => void };

export function IsbnScanner({ onDetect }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const reader = new BrowserMultiFormatReader();
    let cancelled = false;

    (async () => {
      try {
        const devices = await BrowserMultiFormatReader.listVideoInputDevices();
        const rear =
          devices.find((d) => /back|rear|environment/i.test(d.label)) ?? devices[0];
        if (!rear) throw new Error("カメラが見つかりません");
        const controls = await reader.decodeFromVideoDevice(
          rear.deviceId,
          videoRef.current!,
          (result) => {
            if (cancelled || !result) return;
            const text = result.getText().replace(/[-\s]/g, "");
            if (/^\d{10}(\d{3})?$/.test(text)) {
              controls.stop();
              setOpen(false);
              onDetect(text);
            }
          }
        );
        controlsRef.current = controls;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "カメラの起動に失敗しました";
        setError(msg);
      }
    })();

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [open, onDetect]);

  if (!open) {
    return (
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        <Camera className="h-4 w-4" />
        ISBNスキャン
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
      <button
        onClick={() => setOpen(false)}
        className="absolute top-4 right-4 z-10 text-white p-2"
        aria-label="閉じる"
      >
        <X className="h-6 w-6" />
      </button>
      <div className="flex-1 flex items-center justify-center">
        <video ref={videoRef} className="w-full max-h-full" playsInline muted />
      </div>
      <div className="p-4 text-center text-white text-sm">
        {error ? error : "本の裏のバーコードを枠内に収めてください"}
      </div>
    </div>
  );
}
