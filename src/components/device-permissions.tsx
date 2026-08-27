import { useEffect, useState } from "react";
import { useGps } from "@/lib/field/use-gps";
import { Button } from "@/components/ui/button";

export function DevicePermissions({ tracking }: { tracking: boolean }) {
  const gps = useGps(false, 30);
  const [notes, setNotes] = useState<"default" | "granted" | "denied" | "unsupported">("default");

  useEffect(() => {
    if (typeof Notification === "undefined") {
      setNotes("unsupported");
      return;
    }
    setNotes(Notification.permission);
  }, []);

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl bg-surface px-3 py-2 shadow-[var(--shadow-border)]">
      <p className="mr-auto text-sm text-muted">This device</p>
      <Button
        type="button"
        variant={gps.permission === "granted" ? "secondary" : "default"}
        size="sm"
        onClick={() => gps.request()}
      >
        {gps.permission === "granted" ? "Location on" : "Enable location"}
      </Button>
      <Button
        type="button"
        variant={notes === "granted" ? "secondary" : "default"}
        size="sm"
        onClick={() => {
          if (typeof Notification === "undefined") {
            setNotes("unsupported");
            return;
          }
          void Notification.requestPermission().then((p) => {
            setNotes(p);
            if (p === "granted") {
              new Notification("Field Ledger", { body: "Shop alerts will show on this device." });
            }
          });
        }}
      >
        {notes === "granted" ? "Alerts on" : "Enable alerts"}
      </Button>
      {gps.error ? <span className="basis-full text-xs text-danger">{gps.error}</span> : null}
      {tracking ? <span className="basis-full text-xs text-ok">Clocked in — GPS is watching this job.</span> : null}
    </div>
  );
}
