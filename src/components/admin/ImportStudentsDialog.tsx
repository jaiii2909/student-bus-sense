import { useState } from "react";
import axios from "axios";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiErrorMessage, plural } from "@/lib/utils";
import { endOfDayIso, parseCsv } from "@/lib/csv";

interface ImportRow {
  row: number;
  studentId: string;
  name: string;
  password: string;
  routes: string[];
}

interface ImportResult {
  added: number;
  skipped: { row: number; studentId: string; reason: string }[];
}

interface ImportStudentsDialogProps {
  onImported: () => void;
}

const MAX_ROWS = 500;
const REQUIRED_COLUMNS = ["studentid", "name", "password"];

// header names are matched loosely: "Student ID", "student_id" and "studentId" all work
const normalize = (header: string) => header.toLowerCase().replace(/[^a-z]/g, "");

// turn CSV text into rows for the API, or explain what's wrong with the file
const readRows = (text: string): { rows: ImportRow[]; error?: string } => {
  const table = parseCsv(text);
  if (table.length < 2) return { rows: [], error: "The file needs a header row and at least one student." };

  const headers = table[0].map(normalize);
  const missing = REQUIRED_COLUMNS.filter((c) => !headers.includes(c));
  if (missing.length) return { rows: [], error: "Columns needed: studentId, name, password (routes is optional)." };

  const col = (name: string) => headers.indexOf(name);
  const rows = table.slice(1).map((cells, i) => ({
    row: i + 2,
    studentId: (cells[col("studentid")] || "").trim(),
    name: (cells[col("name")] || "").trim(),
    password: cells[col("password")] || "",
    routes: col("routes") >= 0 ? (cells[col("routes")] || "").split(";").map((r) => r.trim()).filter(Boolean) : []
  }));
  if (rows.length > MAX_ROWS) return { rows: [], error: `Up to ${MAX_ROWS} students per file. Split it into smaller files.` };
  return { rows };
};

// Admin: upload a CSV of students, preview it, import, and see what was skipped.
const ImportStudentsDialog = ({ onImported }: ImportStudentsDialogProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [validUntil, setValidUntil] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const reset = () => {
    setRows([]);
    setFileError(null);
    setValidUntil("");
    setResult(null);
  };

  const handleFile = async (file: File | undefined) => {
    setResult(null);
    if (!file) return;
    const { rows: parsed, error } = readRows(await file.text());
    setRows(parsed);
    setFileError(error || null);
  };

  const handleImport = async () => {
    setIsImporting(true);
    try {
      const response = await axios.post<ImportResult>("/api/admin/students/import", {
        students: rows,
        accessValidUntil: endOfDayIso(validUntil)
      });
      setResult(response.data);
      setRows([]);
      onImported();
      toast({ title: `${plural(response.data.added, "student")} added` });
    } catch (error) {
      toast({ title: "Import failed", description: apiErrorMessage(error, "Please try again."), variant: "destructive" });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)} className="h-8 text-xs font-semibold gap-1">
        <Upload className="w-3.5 h-3.5" aria-hidden="true" />
        Import CSV
      </Button>

      <Dialog open={open} onOpenChange={(value) => { setOpen(value); if (!value) reset(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Import students from CSV</DialogTitle>
            <DialogDescription>
              Columns: <code>studentId, name, password, routes</code>. Separate several routes with <code>;</code>.
              Students that already exist are skipped, not changed.
            </DialogDescription>
          </DialogHeader>

          <pre className="text-2xs bg-muted/50 border border-border/80 rounded-xl p-3 overflow-x-auto font-mono">
{`studentId,name,password,routes
UGI-2024-CS-001,Asha Verma,asha2024,Kareli
UGI-2024-CS-002,"Khan, Imran",imran2024,Kareli;Dhoomanganj`}
          </pre>

          <div className="space-y-1.5">
            <Label htmlFor="import-file">CSV file</Label>
            <Input id="import-file" type="file" accept=".csv,text/csv" onChange={(e) => handleFile(e.target.files?.[0])} className="text-xs" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="import-valid-until">Pass valid until (optional)</Label>
            <Input id="import-valid-until" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className="text-xs" />
            <p className="text-2xs text-muted-foreground">Applies to every imported student. Leave empty for no expiry.</p>
          </div>

          {fileError && <p className="text-xs text-destructive" role="alert">{fileError}</p>}

          {rows.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold">{plural(rows.length, "student")} found. First few:</p>
              <div className="border border-border/80 rounded-lg divide-y divide-border text-xs">
                {rows.slice(0, 5).map((r) => (
                  <div key={r.row} className="px-3 py-1.5 flex justify-between gap-2">
                    <span className="font-mono">{r.studentId || "(no ID)"}</span>
                    <span className="truncate">{r.name || "(no name)"}</span>
                    <span className="text-muted-foreground truncate">{r.routes.join(", ") || "no routes"}</span>
                  </div>
                ))}
              </div>
              <Button onClick={handleImport} disabled={isImporting} className="w-full">
                {isImporting ? "Importing… this can take up to a minute" : `Import ${plural(rows.length, "Student")}`}
              </Button>
            </div>
          )}

          {result && (
            <div className="space-y-2 text-xs">
              <p className="font-semibold">
                {result.added} added, {result.skipped.length} skipped.
              </p>
              {result.skipped.length > 0 && (
                <div className="border border-border/80 rounded-lg divide-y divide-border max-h-48 overflow-y-auto">
                  {result.skipped.map((s) => (
                    <div key={s.row} className="px-3 py-1.5">
                      Row {s.row}{s.studentId ? ` (${s.studentId})` : ""}: {s.reason}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ImportStudentsDialog;
