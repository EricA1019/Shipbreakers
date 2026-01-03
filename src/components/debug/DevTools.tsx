import { useState, useEffect, useRef } from "react";
import { logger, exportLogsText } from "../../utils/debug/logger";
import type { LogEntry } from "../../utils/debug/logger";
import { Diagnostics } from "../../utils/debug/diagnostics";
import { useGameStore } from "../../stores/gameStore";

export default function DevTools() {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<"logs" | "state" | "diagnostics">(
    "logs",
  );
  const [diagResults, setDiagResults] = useState<string[]>([]);
  const [diagTimestamp, setDiagTimestamp] = useState<string | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const state = useGameStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "`") {
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    // Subscribe to logs
    const unsubscribe = logger.subscribe((entry) => {
      setLogs((prev) => [...prev, entry]);
    });

    // Initial logs
    setLogs(logger.getLogs());

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isOpen && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, isOpen, activeTab]);

  if (!isOpen) return null;

  const runDiagnostics = () => {
    const issues = Diagnostics.validateGameState(state);
    setDiagResults(issues);
    setDiagTimestamp(new Date().toISOString());
  };

  const downloadBugReport = () => {
    const issues = diagResults.length
      ? diagResults
      : Diagnostics.validateGameState(state);
    const stamp = diagTimestamp ?? new Date().toISOString();
    const lines: string[] = [];
    lines.push(`Shipbreakers Bug Report`);
    lines.push(`Timestamp: ${stamp}`);
    lines.push("");
    lines.push("Diagnostics:");
    if (issues.length === 0) {
      lines.push("- No issues detected");
    } else {
      issues.forEach((i) => lines.push(`- ${i}`));
    }
    lines.push("");
    lines.push("Logs:");
    lines.push(exportLogsText());

    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shipbreakers-bug-report-${stamp}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-8">
      <div className="bg-zinc-900 border-2 border-amber-600 w-full h-full max-w-5xl max-h-[80vh] flex flex-col shadow-2xl rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-zinc-950 p-3 border-b border-amber-600/30 flex justify-between items-center">
          <div className="font-mono font-bold text-amber-500 flex gap-4">
            <span>DEV TOOLS</span>
            <div className="flex gap-2 text-xs">
              <button
                className={`px-2 py-1 rounded ${activeTab === "logs" ? "bg-amber-600 text-zinc-900" : "bg-zinc-800 text-zinc-400"}`}
                onClick={() => setActiveTab("logs")}
              >
                LOGS
              </button>
              <button
                className={`px-2 py-1 rounded ${activeTab === "state" ? "bg-amber-600 text-zinc-900" : "bg-zinc-800 text-zinc-400"}`}
                onClick={() => setActiveTab("state")}
              >
                STATE
              </button>
              <button
                className={`px-2 py-1 rounded ${activeTab === "diagnostics" ? "bg-amber-600 text-zinc-900" : "bg-zinc-800 text-zinc-400"}`}
                onClick={() => setActiveTab("diagnostics")}
              >
                DIAGNOSTICS
              </button>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-zinc-500 hover:text-amber-500"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden bg-zinc-900/90 font-mono text-xs">
          {activeTab === "logs" && (
            <div className="h-full flex flex-col">
              <div className="flex-1 overflow-y-auto p-4 space-y-1">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex gap-2 hover:bg-zinc-800/50 p-0.5 rounded"
                  >
                    <span className="text-zinc-500 shrink-0 w-20">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span
                      className={`shrink-0 w-12 font-bold ${
                        log.level === "ERROR"
                          ? "text-red-500"
                          : log.level === "WARN"
                            ? "text-amber-400"
                            : log.level === "INFO"
                              ? "text-blue-400"
                              : "text-zinc-400"
                      }`}
                    >
                      {log.level}
                    </span>
                    <span className="text-zinc-300 break-all">
                      {log.message}
                      {log.meta && (
                        <span className="text-zinc-500 ml-2">
                          {JSON.stringify(log.meta)}
                        </span>
                      )}
                      {log.stack && (
                        <pre className="text-red-400/70 mt-1 ml-4 text-[10px]">
                          {log.stack}
                        </pre>
                      )}
                    </span>
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
              <div className="p-2 border-t border-amber-600/20 flex justify-between bg-zinc-950">
                <button
                  onClick={() => logger.clear()}
                  className="text-zinc-400 hover:text-white px-2"
                >
                  Clear
                </button>
                <button
                  onClick={() => logger.download()}
                  className="text-amber-500 hover:text-amber-400 px-2"
                >
                  Download Export
                </button>
              </div>
            </div>
          )}

          {activeTab === "state" && (
            <div className="h-full overflow-y-auto p-4">
              <div className="mb-3 flex gap-2">
                <button
                  className="bg-zinc-800 text-amber-400 border border-amber-600/30 px-3 py-1 rounded hover:bg-zinc-700"
                  onClick={() => (state as any).debugSkipCharacterCreation?.()}
                >
                  Skip Character Creation
                </button>
              </div>
              <pre className="text-green-400/80 whitespace-pre-wrap">
                {JSON.stringify(
                  state,
                  (key, value) => {
                    if (key === "grid")
                      return `[Grid ${value.length}x${value[0]?.length}]`; // Summarize grid
                    return value;
                  },
                  2,
                )}
              </pre>
            </div>
          )}

          {activeTab === "diagnostics" && (
            <div className="h-full p-4">
              <button
                className="bg-amber-600 text-zinc-900 px-4 py-2 font-bold rounded hover:bg-amber-500 mb-4"
                onClick={runDiagnostics}
              >
                RUN DIAGNOSTICS
              </button>
              <div className="text-zinc-300 mb-3">
                {diagTimestamp ? `Last run: ${diagTimestamp}` : "Not run yet"}
              </div>
              {diagResults.length === 0 ? (
                <div className="text-emerald-400">No issues detected.</div>
              ) : (
                <ul className="list-disc list-inside text-red-300 space-y-1">
                  {diagResults.map((issue, idx) => (
                    <li key={idx}>{issue}</li>
                  ))}
                </ul>
              )}

              <div className="mt-4 flex gap-2">
                <button
                  className="bg-zinc-800 text-amber-400 border border-amber-600/30 px-3 py-1 rounded hover:bg-zinc-700"
                  onClick={downloadBugReport}
                >
                  Download Bug Report (logs + diagnostics)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
