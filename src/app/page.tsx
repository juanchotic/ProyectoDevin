"use client";

import { useEffect, useMemo, useState } from "react";
import { addWeeks, formatWeek, mondayOf } from "@/lib/week";

type Entry = { id: string; week: string; project: string; body: string; createdAt: string };

const STORAGE_KEY = "shiplog.entries";

function toMarkdown(week: string, entries: Entry[]) {
  const byProject = new Map<string, Entry[]>();
  for (const e of entries) byProject.set(e.project, [...(byProject.get(e.project) ?? []), e]);
  const lines = [`# shiplog · ${formatWeek(week)}`, ""];
  for (const [project, items] of byProject) {
    lines.push(`## ${project}`, ...items.map((e) => `- ${e.body}`), "");
  }
  return lines.join("\n");
}

export default function Home() {
  const currentWeek = mondayOf(new Date());
  const [week, setWeek] = useState(currentWeek);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [project, setProject] = useState("");
  const [body, setBody] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"));
    } catch {
      setEntries([]);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries, loaded]);

  const weekEntries = useMemo(() => entries.filter((e) => e.week === week), [entries, week]);
  const grouped = useMemo(() => {
    const map = new Map<string, Entry[]>();
    for (const e of weekEntries) map.set(e.project, [...(map.get(e.project) ?? []), e]);
    return [...map.entries()];
  }, [weekEntries]);
  const projects = useMemo(() => [...new Set(entries.map((e) => e.project))].sort(), [entries]);

  function add(e: React.FormEvent) {
    e.preventDefault();
    if (!project.trim() || !body.trim()) return;
    setEntries((prev) => [
      ...prev,
      { id: crypto.randomUUID(), week, project: project.trim(), body: body.trim(), createdAt: new Date().toISOString() },
    ]);
    setBody("");
  }

  function remove(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  async function copy() {
    await navigator.clipboard.writeText(toMarkdown(week, weekEntries));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const btn =
    "rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800";
  const input = "rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700";

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 p-6">
      <header>
        <h1 className="text-3xl font-bold">shiplog</h1>
        <p className="text-sm text-zinc-500">Tu bitácora semanal de avances.</p>
      </header>

      <nav className="flex items-center justify-between">
        <button className={btn} onClick={() => setWeek(addWeeks(week, -1))}>
          ← Anterior
        </button>
        <div className="text-center">
          <div className="font-semibold">{formatWeek(week)}</div>
          {week !== currentWeek && (
            <button className="text-xs text-zinc-500 hover:underline" onClick={() => setWeek(currentWeek)}>
              Ir a esta semana
            </button>
          )}
        </div>
        <button className={btn} onClick={() => setWeek(addWeeks(week, 1))} disabled={week >= currentWeek}>
          Siguiente →
        </button>
      </nav>

      <form onSubmit={add} className="flex flex-col gap-2">
        <input
          className={input}
          list="projects"
          placeholder="Proyecto (ej. shiplog)"
          value={project}
          onChange={(e) => setProject(e.target.value)}
          required
        />
        <datalist id="projects">
          {projects.map((p) => (
            <option key={p} value={p} />
          ))}
        </datalist>
        <textarea
          className={input}
          rows={3}
          placeholder="¿Qué avanzaste esta semana?"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
        />
        <button className="self-end rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900">
          Agregar avance
        </button>
      </form>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Avances ({weekEntries.length})
          </h2>
          <button className={btn} onClick={copy} disabled={weekEntries.length === 0}>
            {copied ? "¡Copiado!" : "Copiar resumen"}
          </button>
        </div>
        {loaded && grouped.length === 0 && (
          <p className="text-sm text-zinc-500">Aún no hay avances esta semana.</p>
        )}
        {grouped.map(([name, items]) => (
          <article key={name} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <h3 className="mb-2 font-medium">{name}</h3>
            <ul className="flex flex-col gap-1">
              {items.map((e) => (
                <li key={e.id} className="flex items-start justify-between gap-3 text-sm">
                  <span className="whitespace-pre-wrap">• {e.body}</span>
                  <button
                    className="text-xs text-zinc-400 hover:text-red-600"
                    onClick={() => remove(e.id)}
                    aria-label="Eliminar"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </main>
  );
}
