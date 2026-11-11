"use client";

import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { useSites } from "@/features/user-management/hooks/useSites";
import { useCleaners } from "@/features/cleaners/hooks/useCleaners";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import { toLocalDateString } from "@/features/tasks/lib/task-utils";
import {
  WEEKDAYS,
  formatMoney,
  useAddAgreedHours,
  useAddRate,
  useAgreedHours,
  useDeleteAgreedHours,
  useDeleteRate,
  useRates,
  type Rate,
  type RateInput,
  type Weekday,
} from "@/features/invoices/hooks/useInvoices";
import { cn } from "@/lib/utils/cn";

const input = "h-9 rounded-lg border border-grey-300 bg-white px-2.5 text-sm text-on-surface";

function num(v: string): number | null {
  if (v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function hoursText(minutes?: number | null) {
  return minutes == null ? "—" : `${(minutes / 60).toFixed(2)} h`;
}

/** Effective-dated cleaning and supervision rates for a site (or the company default), plus per-cleaner agreed hours. */
export function RatesPanel() {
  const { data: sites = [] } = useSites();
  const [siteId, setSiteId] = useState<string>("");
  const scope = siteId || null;
  const rates = useRates(scope);
  const all = rates.data ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <label className="flex max-w-sm flex-col gap-1 text-xs font-medium text-grey-600">
          Rates for
          <select value={siteId} onChange={(e) => setSiteId(e.target.value)} className={`${input} h-10`}>
            <option value="">Company default supervision rate</option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        {!scope && (
          <p className="mt-2 max-w-2xl text-xs text-grey-500">
            The company default supervision rate is a fallback. Supervision hours at a site use that site&apos;s own
            supervision rate; if the site has none (for example a one-off work order site), this default rate is used
            instead. Choose a site above to set its cleaning and supervision rates.
          </p>
        )}
      </div>

      <div className={cn("grid grid-cols-1 gap-4", scope && "xl:grid-cols-2")}>
        {scope && <CleaningRatesBox key={`c-${scope}`} siteId={scope} rates={all.filter((r) => r.cleaningHourlyRate != null || r.cleaningPerVisitAmount != null)} />}
        <SupervisionRateBox key={`s-${scope ?? "default"}`} siteId={scope} rates={all.filter((r) => r.supervisionHourlyRate != null)} />
      </div>

      {scope && <AgreedHoursSection siteId={scope} />}
    </div>
  );
}

function DeleteRateButton({ id }: { id: string }) {
  const deleteRate = useDeleteRate();
  return (
    <button type="button" aria-label="Delete rate" onClick={() => deleteRate.mutate(id)}
      className="rounded-full p-1.5 text-grey-400 hover:bg-error/10 hover:text-error">
      <Trash2 size={14} />
    </button>
  );
}

function CleaningRatesBox({ siteId, rates }: { siteId: string; rates: Rate[] }) {
  const addRate = useAddRate();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    effectiveFrom: toLocalDateString(new Date()),
    cleaningRateType: "HOURLY" as "HOURLY" | "PER_VISIT",
    cleaningHourlyRate: "",
    cleaningPerVisitAmount: "",
    agreedHours: "",
    weekendMultiplier: "1",
    publicHolidayMultiplier: "1",
    byDay: {} as Partial<Record<Weekday, string>>,
  });

  async function save() {
    setError(null);
    const rate = num(form.cleaningRateType === "HOURLY" ? form.cleaningHourlyRate : form.cleaningPerVisitAmount);
    if (rate == null) {
      setError("Enter the cleaning rate.");
      return;
    }
    const byDay: Partial<Record<Weekday, number>> = {};
    for (const d of WEEKDAYS) {
      const h = num(form.byDay[d] ?? "");
      if (h != null) byDay[d] = Math.round(h * 60);
    }
    const agreed = num(form.agreedHours);
    const body: RateInput = {
      effectiveFrom: form.effectiveFrom,
      cleaningRateType: form.cleaningRateType,
      cleaningHourlyRate: form.cleaningRateType === "HOURLY" ? rate : null,
      cleaningPerVisitAmount: form.cleaningRateType === "PER_VISIT" ? rate : null,
      agreedMinutesPerDay: agreed == null ? null : Math.round(agreed * 60),
      agreedMinutesByDay: byDay,
      weekendMultiplier: num(form.weekendMultiplier),
      publicHolidayMultiplier: num(form.publicHolidayMultiplier),
    };
    try {
      await addRate.mutateAsync({ siteId, input: body });
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm">
      <h3 className="mb-1 text-sm font-semibold text-on-surface">Cleaning</h3>
      <p className="mb-3 text-xs text-grey-500">General and cover cleaning at this site.</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs text-grey-600">
          Effective from
          <input type="date" className={input} value={form.effectiveFrom}
            onChange={(e) => setForm({ ...form, effectiveFrom: e.target.value })} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-grey-600">
          Rate type
          <select className={input} value={form.cleaningRateType}
            onChange={(e) => setForm({ ...form, cleaningRateType: e.target.value as "HOURLY" | "PER_VISIT" })}>
            <option value="HOURLY">Per hour</option>
            <option value="PER_VISIT">Per visit (day)</option>
          </select>
        </label>
        {form.cleaningRateType === "HOURLY" ? (
          <label className="flex flex-col gap-1 text-xs text-grey-600">
            Hourly rate ($)
            <input type="number" min={0} step="0.01" className={input} value={form.cleaningHourlyRate}
              onChange={(e) => setForm({ ...form, cleaningHourlyRate: e.target.value })} />
          </label>
        ) : (
          <label className="flex flex-col gap-1 text-xs text-grey-600">
            Per visit ($)
            <input type="number" min={0} step="0.01" className={input} value={form.cleaningPerVisitAmount}
              onChange={(e) => setForm({ ...form, cleaningPerVisitAmount: e.target.value })} />
          </label>
        )}
        <label className="flex flex-col gap-1 text-xs text-grey-600">
          Agreed hours / cleaner / day
          <input type="number" min={0} max={24} step="0.25" className={input} value={form.agreedHours}
            onChange={(e) => setForm({ ...form, agreedHours: e.target.value })} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-grey-600">
          Weekend multiplier
          <input type="number" min={0.1} max={10} step="0.05" className={input} value={form.weekendMultiplier}
            onChange={(e) => setForm({ ...form, weekendMultiplier: e.target.value })} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-grey-600">
          Public holiday multiplier
          <input type="number" min={0.1} max={10} step="0.05" className={input} value={form.publicHolidayMultiplier}
            onChange={(e) => setForm({ ...form, publicHolidayMultiplier: e.target.value })} />
        </label>
      </div>
      <div className="mt-3">
        <p className="mb-1 text-xs text-grey-600">Agreed hours for particular weekdays (optional)</p>
        <div className="flex flex-wrap gap-2">
          {WEEKDAYS.map((d) => (
            <label key={d} className="flex items-center gap-1 text-xs text-grey-600">
              {d.slice(0, 3)}
              <input type="number" min={0} max={24} step="0.25" className={`${input} w-16`}
                value={form.byDay[d] ?? ""}
                onChange={(e) => setForm({ ...form, byDay: { ...form.byDay, [d]: e.target.value } })} />
            </label>
          ))}
        </div>
      </div>
      {error && <p className="mt-2 text-sm text-error">{error}</p>}
      <button type="button" onClick={save} disabled={addRate.isPending}
        className="mt-3 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
        {addRate.isPending ? "Saving…" : "Save cleaning rate"}
      </button>

      <div className="mt-4 overflow-x-auto border-t border-grey-100 pt-3">
        <h4 className="mb-2 text-xs font-semibold uppercase text-grey-500">History</h4>
        {rates.length === 0 ? (
          <p className="text-sm text-grey-500">No cleaning rate yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-grey-500">
              <tr>
                <th className="py-1">From</th>
                <th className="py-1">Rate</th>
                <th className="py-1">Agreed / day</th>
                <th className="py-1">Weekend ×</th>
                <th className="py-1">Holiday ×</th>
                <th />
              </tr>
            </thead>
            <tbody className="divide-y divide-grey-100">
              {rates.map((r) => (
                <tr key={r.id}>
                  <td className="py-2">{r.effectiveFrom}</td>
                  <td className="py-2">
                    {r.cleaningRateType === "HOURLY"
                      ? `${formatMoney(r.cleaningHourlyRate)}/h`
                      : `${formatMoney(r.cleaningPerVisitAmount)}/visit`}
                  </td>
                  <td className="py-2">
                    {hoursText(r.agreedMinutesPerDay)}
                    {Object.keys(r.agreedMinutesByDay).length > 0 && (
                      <span className="block text-[11px] text-grey-500">
                        {Object.entries(r.agreedMinutesByDay).map(([d, m]) => `${d.slice(0, 3)} ${(m / 60).toFixed(2)}h`).join(", ")}
                      </span>
                    )}
                  </td>
                  <td className="py-2">{r.weekendMultiplier ?? 1}</td>
                  <td className="py-2">{r.publicHolidayMultiplier ?? 1}</td>
                  <td className="py-2 text-right">
                    <DeleteRateButton id={r.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

function SupervisionRateBox({ siteId, rates }: { siteId: string | null; rates: Rate[] }) {
  const addRate = useAddRate();
  const [error, setError] = useState<string | null>(null);
  const [effectiveFrom, setEffectiveFrom] = useState(() => toLocalDateString(new Date()));
  const [rate, setRate] = useState("");
  const [weekend, setWeekend] = useState("1");
  const [holiday, setHoliday] = useState("1");

  async function save() {
    setError(null);
    const value = num(rate);
    if (value == null) {
      setError("Enter the supervision rate.");
      return;
    }
    try {
      await addRate.mutateAsync({
        siteId,
        input: {
          effectiveFrom,
          cleaningRateType: "HOURLY",
          supervisionHourlyRate: value,
          supervisionWeekendMultiplier: num(weekend),
          supervisionPublicHolidayMultiplier: num(holiday),
        },
      });
      setRate("");
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm">
      <h3 className="mb-1 text-sm font-semibold text-on-surface">
        {siteId ? "Supervision" : "Company default supervision"}
      </h3>
      <p className="mb-3 text-xs text-grey-500">
        {siteId
          ? "Supervisors' hours at this site. Leave empty to use the company default supervision rate."
          : "Used for supervision at any site that has no supervision rate of its own."}
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs text-grey-600">
          Effective from
          <input type="date" className={input} value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-grey-600">
          Hourly rate ($)
          <input type="number" min={0} step="0.01" className={input} value={rate} onChange={(e) => setRate(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-grey-600">
          Weekend multiplier
          <input type="number" min={0.1} max={10} step="0.05" className={input} value={weekend}
            onChange={(e) => setWeekend(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-grey-600">
          Public holiday multiplier
          <input type="number" min={0.1} max={10} step="0.05" className={input} value={holiday}
            onChange={(e) => setHoliday(e.target.value)} />
        </label>
      </div>
      {error && <p className="mt-2 text-sm text-error">{error}</p>}
      <button type="button" onClick={save} disabled={addRate.isPending}
        className="mt-3 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
        {addRate.isPending ? "Saving…" : "Save supervision rate"}
      </button>

      <div className="mt-4 border-t border-grey-100 pt-3">
        <h4 className="mb-2 text-xs font-semibold uppercase text-grey-500">History</h4>
        {rates.length === 0 ? (
          <p className="text-sm text-grey-500">
            {siteId ? "No supervision rate yet — the company default applies." : "No default supervision rate yet."}
          </p>
        ) : (
          <ul className="divide-y divide-grey-100 text-sm">
            {rates.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-2">
                <span>
                  From {r.effectiveFrom} · {formatMoney(r.supervisionHourlyRate)}/h · weekend ×
                  {r.supervisionWeekendMultiplier ?? 1} · holiday ×{r.supervisionPublicHolidayMultiplier ?? 1}
                </span>
                <DeleteRateButton id={r.id} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function AgreedHoursSection({ siteId }: { siteId: string }) {
  const { data: rows = [] } = useAgreedHours(siteId);
  const { data: cleaners = [] } = useCleaners();
  const add = useAddAgreedHours();
  const remove = useDeleteAgreedHours();
  const [cleanerId, setCleanerId] = useState("");
  const [from, setFrom] = useState(() => toLocalDateString(new Date()));
  const [hours, setHours] = useState("");
  const [error, setError] = useState<string | null>(null);
  const options = useMemo(
    () => cleaners.map((c) => ({ id: c.id, name: `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim() || c.email || "Cleaner" })),
    [cleaners],
  );

  async function save() {
    setError(null);
    const h = num(hours);
    if (!cleanerId || h == null) {
      setError("Choose a cleaner and enter the agreed hours.");
      return;
    }
    try {
      await add.mutateAsync({ siteId, cleanerId, effectiveFrom: from, agreedMinutesPerDay: Math.round(h * 60) });
      setHours("");
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm">
      <h3 className="mb-1 text-sm font-semibold text-on-surface">Agreed hours per cleaner</h3>
      <p className="mb-3 text-xs text-grey-500">Overrides the site&apos;s agreed hours for one cleaner from a date.</p>
      <div className="flex flex-wrap items-end gap-2">
        <select value={cleanerId} onChange={(e) => setCleanerId(e.target.value)} className={`${input} min-w-[200px]`}>
          <option value="">Select cleaner…</option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={input} />
        <input type="number" min={0} max={24} step="0.25" placeholder="Hours / day" value={hours}
          onChange={(e) => setHours(e.target.value)} className={`${input} w-28`} />
        <button type="button" onClick={save} disabled={add.isPending}
          className="rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-50">
          Add
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-error">{error}</p>}
      {rows.length > 0 && (
        <ul className="mt-3 divide-y divide-grey-100 text-sm">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center justify-between py-2">
              <span>
                {r.cleanerName} · from {r.effectiveFrom} · {hoursText(r.agreedMinutesPerDay)}
              </span>
              <button type="button" aria-label="Remove" onClick={() => remove.mutate(r.id)}
                className="rounded-full p-1.5 text-grey-400 hover:bg-error/10 hover:text-error">
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
