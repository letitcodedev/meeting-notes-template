import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Trash2,
  Check,
  Clock,
  ChevronDown,
  ChevronUp,
  Printer,
  Download,
  RotateCcw,
  Calendar,
  Users,
  Tag,
  Circle,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

type Priority = "high" | "medium" | "low";
type ActionStatus = "pending" | "in-progress" | "done";

interface AgendaItem {
  id: string;
  title: string;
  duration: string;
  notes: string;
  presenter: string;
  expanded: boolean;
}

interface Decision {
  id: string;
  text: string;
  context: string;
  rationale: string;
}

interface ActionItem {
  id: string;
  task: string;
  owner: string;
  dueDate: string;
  priority: Priority;
  status: ActionStatus;
}

interface MeetingMeta {
  title: string;
  date: string;
  time: string;
  location: string;
  attendees: string;
  facilitator: string;
  notetaker: string;
  objectives: string;
}

const defaultMeta: MeetingMeta = {
  title: "Weekly Team Sync",
  date: new Date().toISOString().split("T")[0],
  time: "10:00",
  location: "",
  attendees: "",
  facilitator: "",
  notetaker: "",
  objectives: "",
};

const defaultAgendaItems: AgendaItem[] = [
  {
    id: "a1",
    title: "Review last week's action items",
    duration: "10",
    notes: "",
    presenter: "",
    expanded: true,
  },
  {
    id: "a2",
    title: "Product roadmap update",
    duration: "20",
    notes: "",
    presenter: "",
    expanded: false,
  },
  {
    id: "a3",
    title: "Open discussion",
    duration: "15",
    notes: "",
    presenter: "",
    expanded: false,
  },
];

const defaultDecisions: Decision[] = [
  { id: "d1", text: "", context: "", rationale: "" },
];

const defaultActions: ActionItem[] = [
  {
    id: "ac1",
    task: "",
    owner: "",
    dueDate: "",
    priority: "medium",
    status: "pending",
  },
];

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

const priorityConfig: Record<
  Priority,
  { label: string; color: string; bg: string }
> = {
  high: {
    label: "High",
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
  },
  medium: {
    label: "Medium",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
  },
  low: {
    label: "Low",
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
  },
};

const statusConfig: Record<
  ActionStatus,
  { label: string; icon: typeof Circle; color: string }
> = {
  pending: {
    label: "Pending",
    icon: Circle,
    color: "text-muted-foreground",
  },
  "in-progress": {
    label: "In Progress",
    icon: Loader2,
    color: "text-blue-500",
  },
  done: {
    label: "Done",
    icon: CheckCircle2,
    color: "text-green-500",
  },
};

function FieldInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  className = "",
  "data-testid": testId,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
  "data-testid"?: string;
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        data-testid={testId}
        className="px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all placeholder:text-muted-foreground/50"
      />
    </div>
  );
}

function FieldTextarea({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
  className = "",
  "data-testid": testId,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  "data-testid"?: string;
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        data-testid={testId}
        className="px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all resize-none placeholder:text-muted-foreground/50"
      />
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  count,
  accentColor = "bg-primary",
}: {
  icon: React.ReactNode;
  title: string;
  count?: number;
  accentColor?: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div
        className={`w-1 h-7 rounded-full ${accentColor} flex-shrink-0`}
      />
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">{icon}</span>
        <h2 className="text-lg font-semibold text-foreground tracking-tight">
          {title}
        </h2>
        {count !== undefined && (
          <Badge
            variant="secondary"
            className="text-xs h-5 px-1.5 font-medium"
          >
            {count}
          </Badge>
        )}
      </div>
    </div>
  );
}

export default function MeetingNotes() {
  const [meta, setMeta] = useState<MeetingMeta>(defaultMeta);
  const [agenda, setAgenda] = useState<AgendaItem[]>(defaultAgendaItems);
  const [decisions, setDecisions] = useState<Decision[]>(defaultDecisions);
  const [actions, setActions] = useState<ActionItem[]>(defaultActions);
  const [darkMode, setDarkMode] = useState(false);
  const [saved, setSaved] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const toggleDark = useCallback(() => {
    setDarkMode((d) => {
      const next = !d;
      document.documentElement.classList.toggle("dark", next);
      return next;
    });
  }, []);

  const updateMeta = useCallback(
    (key: keyof MeetingMeta, value: string) => {
      setMeta((m) => ({ ...m, [key]: value }));
    },
    []
  );

  const addAgendaItem = useCallback(() => {
    setAgenda((a) => [
      ...a,
      {
        id: generateId(),
        title: "",
        duration: "",
        notes: "",
        presenter: "",
        expanded: true,
      },
    ]);
  }, []);

  const updateAgendaItem = useCallback(
    (id: string, key: keyof AgendaItem, value: string | boolean) => {
      setAgenda((a) =>
        a.map((item) => (item.id === id ? { ...item, [key]: value } : item))
      );
    },
    []
  );

  const removeAgendaItem = useCallback((id: string) => {
    setAgenda((a) => a.filter((item) => item.id !== id));
  }, []);

  const toggleAgendaExpand = useCallback((id: string) => {
    setAgenda((a) =>
      a.map((item) =>
        item.id === id ? { ...item, expanded: !item.expanded } : item
      )
    );
  }, []);

  const addDecision = useCallback(() => {
    setDecisions((d) => [
      ...d,
      { id: generateId(), text: "", context: "", rationale: "" },
    ]);
  }, []);

  const updateDecision = useCallback(
    (id: string, key: keyof Decision, value: string) => {
      setDecisions((d) =>
        d.map((item) => (item.id === id ? { ...item, [key]: value } : item))
      );
    },
    []
  );

  const removeDecision = useCallback((id: string) => {
    setDecisions((d) => d.filter((item) => item.id !== id));
  }, []);

  const addAction = useCallback(() => {
    setActions((a) => [
      ...a,
      {
        id: generateId(),
        task: "",
        owner: "",
        dueDate: "",
        priority: "medium",
        status: "pending",
      },
    ]);
  }, []);

  const updateAction = useCallback(
    (id: string, key: keyof ActionItem, value: string) => {
      setActions((a) =>
        a.map((item) => (item.id === id ? { ...item, [key]: value } : item))
      );
    },
    []
  );

  const removeAction = useCallback((id: string) => {
    setActions((a) => a.filter((item) => item.id !== id));
  }, []);

  const cycleActionStatus = useCallback((id: string) => {
    const order: ActionStatus[] = ["pending", "in-progress", "done"];
    setActions((a) =>
      a.map((item) => {
        if (item.id !== id) return item;
        const idx = order.indexOf(item.status);
        return { ...item, status: order[(idx + 1) % order.length] };
      })
    );
  }, []);

  const handleReset = useCallback(() => {
    if (
      window.confirm(
        "Reset all fields to defaults? This cannot be undone."
      )
    ) {
      setMeta(defaultMeta);
      setAgenda(defaultAgendaItems.map((a) => ({ ...a, id: generateId() })));
      setDecisions(
        defaultDecisions.map((d) => ({ ...d, id: generateId() }))
      );
      setActions(defaultActions.map((a) => ({ ...a, id: generateId() })));
    }
  }, []);

  const handleSave = useCallback(() => {
    const data = { meta, agenda, decisions, actions };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const date = meta.date || new Date().toISOString().split("T")[0];
    a.download = `meeting-notes-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [meta, agenda, decisions, actions]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const totalDuration = agenda.reduce(
    (sum, item) => sum + (parseInt(item.duration) || 0),
    0
  );
  const doneActions = actions.filter((a) => a.status === "done").length;
  const pendingActions = actions.filter(
    (a) => a.status === "pending" || a.status === "in-progress"
  ).length;

  return (
    <div className="min-h-screen bg-background transition-colors duration-200">
      {/* Top bar */}
      <div className="no-print sticky top-0 z-20 bg-background/90 backdrop-blur border-b border-border px-4 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
            <span className="text-white text-xs font-bold">MN</span>
          </div>
          <span className="font-semibold text-sm text-foreground tracking-tight">
            Meeting Notes
          </span>
          <Badge
            variant="secondary"
            className="text-xs hidden sm:inline-flex"
          >
            Template
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleDark}
            data-testid="button-toggle-dark"
            className="text-xs gap-1.5 px-2.5"
          >
            {darkMode ? "Light" : "Dark"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            data-testid="button-reset"
            className="text-xs gap-1.5 px-2.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrint}
            data-testid="button-print"
            className="text-xs gap-1.5 px-2.5"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            data-testid="button-save"
            className="text-xs gap-1.5 px-3"
          >
            {saved ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Saved!
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                Export
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div
        ref={printRef}
        className="max-w-3xl mx-auto px-4 py-8 pb-16"
      >
        {/* Meeting Header */}
        <div
          className="rounded-xl border border-border bg-card p-6 mb-6 animate-fade-in"
          data-testid="section-meeting-header"
        >
          <div className="flex items-start gap-3 mb-5">
            <div className="flex-1">
              <input
                type="text"
                value={meta.title}
                onChange={(e) => updateMeta("title", e.target.value)}
                placeholder="Meeting Title"
                data-testid="input-meeting-title"
                className="w-full text-2xl font-bold bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/40 focus:ring-0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <FieldInput
              label="Date"
              value={meta.date}
              onChange={(v) => updateMeta("date", v)}
              type="date"
              data-testid="input-meeting-date"
            />
            <FieldInput
              label="Time"
              value={meta.time}
              onChange={(v) => updateMeta("time", v)}
              type="time"
              data-testid="input-meeting-time"
            />
            <FieldInput
              label="Location / Link"
              value={meta.location}
              onChange={(v) => updateMeta("location", v)}
              placeholder="Office / Zoom"
              data-testid="input-meeting-location"
            />
            <FieldInput
              label="Facilitator"
              value={meta.facilitator}
              onChange={(v) => updateMeta("facilitator", v)}
              placeholder="Name"
              data-testid="input-facilitator"
            />
            <FieldInput
              label="Note Taker"
              value={meta.notetaker}
              onChange={(v) => updateMeta("notetaker", v)}
              placeholder="Name"
              data-testid="input-notetaker"
            />
            <FieldInput
              label="Attendees"
              value={meta.attendees}
              onChange={(v) => updateMeta("attendees", v)}
              placeholder="Names / count"
              data-testid="input-attendees"
            />
          </div>

          <div className="mt-4">
            <FieldTextarea
              label="Meeting Objectives"
              value={meta.objectives}
              onChange={(v) => updateMeta("objectives", v)}
              placeholder="What do we need to accomplish in this meeting?"
              rows={2}
              data-testid="textarea-objectives"
            />
          </div>

          {/* Stats row */}
          <div className="mt-5 pt-4 border-t border-border flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {totalDuration > 0
                ? `${totalDuration} min total`
                : "No duration set"}
            </span>
            <span className="flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              {decisions.filter((d) => d.text).length} decision
              {decisions.filter((d) => d.text).length !== 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {doneActions} / {actions.length} actions done
            </span>
            {pendingActions > 0 && (
              <span className="flex items-center gap-1.5 text-amber-500">
                <AlertCircle className="w-3.5 h-3.5" />
                {pendingActions} pending
              </span>
            )}
          </div>
        </div>

        {/* ── AGENDA ── */}
        <div
          className="rounded-xl border border-border bg-card p-6 mb-6 animate-fade-in"
          data-testid="section-agenda"
        >
          <SectionHeader
            icon={<Calendar className="w-4 h-4" />}
            title="Agenda"
            count={agenda.length}
            accentColor="bg-blue-500"
          />

          <div className="space-y-3">
            {agenda.map((item, index) => (
              <div
                key={item.id}
                className="rounded-lg border border-border bg-background/50 overflow-hidden animate-slide-in transition-all"
                data-testid={`card-agenda-${item.id}`}
              >
                {/* Agenda item header */}
                <div className="flex items-center gap-2 px-3 py-2.5">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center flex-shrink-0">
                    {index + 1}
                  </span>
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) =>
                      updateAgendaItem(item.id, "title", e.target.value)
                    }
                    placeholder="Agenda item title"
                    data-testid={`input-agenda-title-${item.id}`}
                    className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-foreground placeholder:text-muted-foreground/50 focus:ring-0"
                  />
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    <input
                      type="number"
                      value={item.duration}
                      onChange={(e) =>
                        updateAgendaItem(item.id, "duration", e.target.value)
                      }
                      placeholder="0"
                      min="0"
                      data-testid={`input-agenda-duration-${item.id}`}
                      className="w-12 bg-transparent border-none outline-none text-xs text-muted-foreground text-right focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="text-xs text-muted-foreground">min</span>
                    <button
                      onClick={() => toggleAgendaExpand(item.id)}
                      data-testid={`button-agenda-expand-${item.id}`}
                      className="ml-1 p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {item.expanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => removeAgendaItem(item.id)}
                      data-testid={`button-agenda-remove-${item.id}`}
                      className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Expandable body */}
                {item.expanded && (
                  <div className="px-3 pb-3 pt-1 border-t border-border/60 space-y-2.5 animate-fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <FieldInput
                        label="Presenter"
                        value={item.presenter}
                        onChange={(v) =>
                          updateAgendaItem(item.id, "presenter", v)
                        }
                        placeholder="Who leads this item?"
                        data-testid={`input-agenda-presenter-${item.id}`}
                      />
                    </div>
                    <FieldTextarea
                      label="Discussion Notes"
                      value={item.notes}
                      onChange={(v) =>
                        updateAgendaItem(item.id, "notes", v)
                      }
                      placeholder="Key points discussed, questions raised, outcomes..."
                      rows={3}
                      data-testid={`textarea-agenda-notes-${item.id}`}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={addAgendaItem}
            data-testid="button-add-agenda"
            className="mt-3 w-full py-2 rounded-lg border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add agenda item
          </button>
        </div>

        {/* ── DECISIONS ── */}
        <div
          className="rounded-xl border border-border bg-card p-6 mb-6 animate-fade-in"
          data-testid="section-decisions"
        >
          <SectionHeader
            icon={<Check className="w-4 h-4" />}
            title="Decisions Made"
            count={decisions.length}
            accentColor="bg-violet-500"
          />

          <div className="space-y-3">
            {decisions.map((decision, index) => (
              <div
                key={decision.id}
                className="rounded-lg border border-border bg-background/50 p-3.5 animate-slide-in"
                data-testid={`card-decision-${decision.id}`}
              >
                <div className="flex items-start gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 text-xs font-semibold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  <div className="flex-1 space-y-2.5">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">
                        Decision
                      </label>
                      <textarea
                        value={decision.text}
                        onChange={(e) =>
                          updateDecision(decision.id, "text", e.target.value)
                        }
                        placeholder="What was decided?"
                        rows={2}
                        data-testid={`textarea-decision-text-${decision.id}`}
                        className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all resize-none placeholder:text-muted-foreground/50"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <FieldTextarea
                        label="Context"
                        value={decision.context}
                        onChange={(v) =>
                          updateDecision(decision.id, "context", v)
                        }
                        placeholder="Background / why this came up"
                        rows={2}
                        data-testid={`textarea-decision-context-${decision.id}`}
                      />
                      <FieldTextarea
                        label="Rationale"
                        value={decision.rationale}
                        onChange={(v) =>
                          updateDecision(decision.id, "rationale", v)
                        }
                        placeholder="Why this decision was made"
                        rows={2}
                        data-testid={`textarea-decision-rationale-${decision.id}`}
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => removeDecision(decision.id)}
                    data-testid={`button-decision-remove-${decision.id}`}
                    className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={addDecision}
            data-testid="button-add-decision"
            className="mt-3 w-full py-2 rounded-lg border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-violet-500/50 hover:bg-violet-500/5 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add decision
          </button>
        </div>

        {/* ── ACTION ITEMS ── */}
        <div
          className="rounded-xl border border-border bg-card p-6 animate-fade-in"
          data-testid="section-actions"
        >
          <SectionHeader
            icon={<Users className="w-4 h-4" />}
            title="Action Items"
            count={actions.length}
            accentColor="bg-emerald-500"
          />

          {/* Summary bar */}
          {actions.length > 0 && (
            <div className="flex gap-2 mb-4 flex-wrap">
              {(["pending", "in-progress", "done"] as ActionStatus[]).map(
                (s) => {
                  const count = actions.filter((a) => a.status === s).length;
                  const cfg = statusConfig[s];
                  const Icon = cfg.icon;
                  return (
                    <div
                      key={s}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground"
                    >
                      <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                      <span>
                        {count} {cfg.label}
                      </span>
                    </div>
                  );
                }
              )}
            </div>
          )}

          <div className="space-y-2.5">
            {actions.map((action) => {
              const StatusIcon = statusConfig[action.status].icon;
              const pCfg = priorityConfig[action.priority];

              return (
                <div
                  key={action.id}
                  className={`rounded-lg border p-3.5 animate-slide-in transition-all ${
                    action.status === "done"
                      ? "bg-background/30 border-border/50 opacity-75"
                      : "bg-background/50 border-border"
                  }`}
                  data-testid={`card-action-${action.id}`}
                >
                  <div className="flex items-start gap-2.5">
                    <button
                      onClick={() => cycleActionStatus(action.id)}
                      data-testid={`button-action-status-${action.id}`}
                      className={`mt-0.5 flex-shrink-0 transition-all hover:scale-110 ${statusConfig[action.status].color}`}
                      title={`Status: ${statusConfig[action.status].label} — click to cycle`}
                    >
                      <StatusIcon
                        className={`w-4.5 h-4.5 ${action.status === "in-progress" ? "animate-spin" : ""}`}
                      />
                    </button>
                    <div className="flex-1 space-y-2">
                      <textarea
                        value={action.task}
                        onChange={(e) =>
                          updateAction(action.id, "task", e.target.value)
                        }
                        placeholder="Describe the action item..."
                        rows={2}
                        data-testid={`textarea-action-task-${action.id}`}
                        className={`w-full bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground/50 focus:ring-0 resize-none ${
                          action.status === "done" ? "line-through text-muted-foreground" : ""
                        }`}
                      />
                      <div className="flex flex-wrap gap-2 items-center">
                        <input
                          type="text"
                          value={action.owner}
                          onChange={(e) =>
                            updateAction(action.id, "owner", e.target.value)
                          }
                          placeholder="Owner"
                          data-testid={`input-action-owner-${action.id}`}
                          className="px-2.5 py-1 rounded border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all placeholder:text-muted-foreground/50 w-28"
                        />
                        <input
                          type="date"
                          value={action.dueDate}
                          onChange={(e) =>
                            updateAction(action.id, "dueDate", e.target.value)
                          }
                          data-testid={`input-action-due-${action.id}`}
                          className="px-2.5 py-1 rounded border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                        />
                        <select
                          value={action.priority}
                          onChange={(e) =>
                            updateAction(
                              action.id,
                              "priority",
                              e.target.value
                            )
                          }
                          data-testid={`select-action-priority-${action.id}`}
                          className={`px-2.5 py-1 rounded border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-ring transition-all ${pCfg.bg} ${pCfg.color}`}
                        >
                          <option value="high">High</option>
                          <option value="medium">Medium</option>
                          <option value="low">Low</option>
                        </select>
                      </div>
                    </div>
                    <button
                      onClick={() => removeAction(action.id)}
                      data-testid={`button-action-remove-${action.id}`}
                      className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={addAction}
            data-testid="button-add-action"
            className="mt-3 w-full py-2 rounded-lg border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add action item
          </button>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-muted-foreground/50 no-print">
          <Separator className="mb-4" />
          Meeting Notes Template &mdash; export as JSON or print to PDF
        </div>
      </div>
    </div>
  );
}
