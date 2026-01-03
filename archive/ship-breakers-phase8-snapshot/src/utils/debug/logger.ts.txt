export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

export interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  message: string;
  meta?: any;
  stack?: string;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private listeners: ((entry: LogEntry) => void)[] = [];

  constructor() {
    // Auto-capture unhandled errors
    if (typeof window !== "undefined") {
      window.addEventListener("error", (event) => {
        this.error(
          "Unhandled Exception",
          {
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
          },
          event.error?.stack,
        );
      });

      window.addEventListener("unhandledrejection", (event) => {
        this.error(
          "Unhandled Promise Rejection",
          {
            reason: event.reason,
          },
          event.reason?.stack,
        );
      });
    }
  }

  private add(level: LogLevel, message: string, meta?: any, stack?: string) {
    const entry: LogEntry = {
      id: Math.random().toString(36).slice(2),
      timestamp: Date.now(),
      level,
      message,
      meta,
      stack,
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output
    const style = {
      DEBUG: "color: #9ca3af",
      INFO: "color: #60a5fa",
      WARN: "color: #fbbf24",
      ERROR: "color: #f87171",
    }[level];

    console.log(`%c[${level}] ${message}`, style, meta || "");

    // Notify listeners
    this.listeners.forEach((l) => l(entry));
  }

  debug(message: string, meta?: any) {
    this.add("DEBUG", message, meta);
  }
  info(message: string, meta?: any) {
    this.add("INFO", message, meta);
  }
  warn(message: string, meta?: any) {
    this.add("WARN", message, meta);
  }
  error(message: string, meta?: any, stack?: string) {
    // If meta is an Error object, extract stack
    if (meta instanceof Error) {
      stack = stack || meta.stack;
      meta = { message: meta.message, name: meta.name };
    }
    this.add("ERROR", message, meta, stack);
  }

  getLogs() {
    return [...this.logs];
  }

  clear() {
    this.logs = [];
    this.info("Logs cleared");
  }

  subscribe(listener: (entry: LogEntry) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  exportText() {
    return this.logs
      .map((l) => {
        const time = new Date(l.timestamp).toISOString();
        const metaStr = l.meta ? ` | ${JSON.stringify(l.meta)}` : "";
        const stackStr = l.stack ? `\n${l.stack}` : "";
        return `${time} [${l.level}] ${l.message}${metaStr}${stackStr}`;
      })
      .join("\n");
  }

  download() {
    const text = this.exportText();
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shipbreakers-log-${new Date().toISOString()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

export const logger = new Logger();

// Helper exports for easy import
export const logDebug = (msg: string, meta?: any) => logger.debug(msg, meta);
export const logInfo = (msg: string, meta?: any) => logger.info(msg, meta);
export const logWarn = (msg: string, meta?: any) => logger.warn(msg, meta);
export const logError = (msg: string, meta?: any) => logger.error(msg, meta);
export const downloadLogs = () => logger.download();
export const exportLogsText = () => logger.exportText();
export const getLogs = () => logger.getLogs();
