"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { QuestionDefinition } from "@/types/assessment";
import { unitOptionsFor } from "@/lib/assessment/engine";

type QuestionRendererProps = {
  question: QuestionDefinition;
  value: unknown;
  answers: Record<string, unknown>;
  onChange: (value: unknown) => void;
  disabled?: boolean;
};

export function QuestionRenderer({
  question,
  value,
  answers,
  onChange,
  disabled,
}: QuestionRendererProps) {
  const id = `q-${question.id}`;

  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Label htmlFor={id} className="text-sm font-medium">
            {question.label}
            {question.required && <span className="text-destructive"> *</span>}
          </Label>
          {question.help && <p className="mt-0.5 text-xs text-muted-foreground">{question.help}</p>}
        </div>
        {question.type === "boolean" && (
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-[11px] text-muted-foreground">No</span>
            <Switch
              id={id}
              checked={Boolean(value)}
              onCheckedChange={onChange}
              disabled={disabled}
            />
            <span className="text-[11px] text-muted-foreground">Yes</span>
          </div>
        )}
      </div>

      {question.type === "text" && (
        <Input
          id={id}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          placeholder={question.placeholder}
          disabled={disabled}
        />
      )}

      {question.type === "number" && (
        <Input
          id={id}
          type="number"
          step="any"
          value={value === undefined || value === null || value === "" ? "" : String(value)}
          onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
          disabled={disabled}
        />
      )}

      {question.type === "date" && (
        <Input
          id={id}
          type="date"
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
      )}

      {question.type === "textarea" && (
        <textarea
          id={id}
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          placeholder={question.placeholder}
          disabled={disabled}
          rows={3}
        />
      )}

      {question.type === "single_select" && (
        <Select
          value={String(value ?? "") || undefined}
          onValueChange={onChange}
          disabled={disabled}
        >
          <SelectTrigger id={id}>
            <SelectValue placeholder="Select…" />
          </SelectTrigger>
          <SelectContent>
            {(question.options ?? []).map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {question.type === "multi_select" && (
        <div className="flex flex-wrap gap-2">
          {(question.options ?? []).map((o) => {
            const selected = Array.isArray(value) && value.includes(o.value);
            return (
              <button
                key={o.value}
                type="button"
                disabled={disabled}
                onClick={() => {
                  const cur = Array.isArray(value) ? [...value] : [];
                  onChange(
                    selected ? cur.filter((x) => x !== o.value) : [...cur, o.value]
                  );
                }}
                className={cn(
                  "rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
                  selected
                    ? "border-brand/40 bg-brand-light text-brand-dark"
                    : "border-border bg-background text-muted-foreground hover:border-brand/25"
                )}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      )}

      {question.optionsFrom && (
        <Select
          value={String(value ?? "") || undefined}
          onValueChange={onChange}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select unit…" />
          </SelectTrigger>
          <SelectContent>
            {unitOptionsFor(question, answers).map((u) => (
              <SelectItem key={u} value={u}>
                {u}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
