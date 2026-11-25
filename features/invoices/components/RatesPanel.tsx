"use client";

import { useMemo, useState } from "react";
import { ShieldCheck, Trash2, UserRound } from "lucide-react";
import { useSites } from "@/features/user-management/hooks/useSites";
import { useCleaners } from "@/features/cleaners/hooks/useCleaners";
import { getErrorMessage } from "@/features/users/hooks/useCreateUser";
import { SiteFilterSelect } from "@/components/admin/SiteFilterSelect";
import { DateInput } from "@/components/shared/DateInput";
import { formatDate, todayISODate } from "@/lib/utils/format";
import {
  WEEKDAYS,
  formatMoney,
  useAddAgreedHours,
  useAddRate,
  useAgreedHours,
  useDeleteAgreedHours,
  useDeleteRate,
  useInvoicePeople,
  useRates,
  type AgreedHours,
  type Rate,
  type RateInput,
  type RateType,
  type Weekday,
} from "@/features/invoices/hooks/useInvoices";
import { cn } from "@/lib/utils/cn";

const input = "h-9 rounded-lg border border-grey-300 bg-white px-2.5 text-sm text-on-surface";
const PER_VISIT_HINT =
  "Per visit: no agreed hours are needed. Any day with hours above 0 (worked or entered on the invoice) is billed as one visit, and the invoice total adds up the visits.";

type DayHours = Partial<Record<Weekday, string>>;

function num(v: string): number | null {
  if (v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function hoursText(minutes?: number | null) {
  return minutes == null ? "—" : `${(minutes / 60).toFixed(2)} h`;
}

/** Weekday hours as minutes; null when an entry is invalid. */
function dayMinutes(byDay: DayHours): Partial<Record<Weekday, number>> | null {
  const out: Partial<Record<Weekday, number>> = {};
  for (const d of WEEKDAYS) {
    const raw = byDay[d] ?? "";
    if (raw.trim() === "") continue;
    const h = num(raw);
    if (h == null || h < 0 || h > 24) return null;
    out[d] = Math.round(h * 60);
  }
  return out;
}

function weekdaySummary(byDay: Record<string, number>) {
  const entries = Object.entries(byDay);
  if (entries.length === 0) return null;
  return (
    <span className="block text-[11px] text-grey-500">
      {entries.map(([d, m]) => `${d.slice(0, 1)}${d.slice(1, 3).toLowerCase()} ${(m / 60).toFixed(2)}h`).join(", ")}
    </span>
  );
}

function rateText(type: RateType | null | undefined, hourly?: number | null, perVisit?: number | null) {
  return type === "PER_VISIT" ? `${formatMoney(perVisit)}/visit` : `${formatMoney(hourly)}/h`;
}

/** Effective-dated cleaning and supervision rates for a site (or the company default), plus per-person agreements. */
export function RatesPanel() {
  const { data: sites = [], isLoading: sitesLoading } = useSites();
  const [siteId, setSiteId] = useState<string>("");
  const scope = siteId || null;
  const rates = useRates(scope);
  const all = rates.data ?? [];
  const siteOptions = useMemo(
    () => [
      { id: "", name: "Company default supervision rate" },
      ...[...sites].sort((a, b) => a.name.localeCompare(b.name)).map((s) => ({ id: s.id, name: s.name })),
    ],
    [sites],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <p className="mb-1 text-xs font-medium text-grey-600">Rates for</p>
        <SiteFilterSelect
          variant="field"
          sites={siteOptions}
          value={siteId}
          onChange={setSiteId}
          loading={sitesLoading}
          ariaLabel="Rates for"
          placeholder="Search a site…"
          searchPlaceholder="Search sites by name…"
          className="sm:max-w-sm"
        />
        {!scope && (
          <p className="mt-2 max-w-2xl text-xs text-grey-500">
            The company default supervision rate is a fallback. Supervision hours at a site use that site&apos;s own
            supervision rate; if the site has none (for example a one-off work order site), this default rate is used
            instead. Choose a site above to set its cleaning and supervision rates.
          </p>
        )}
      </div>

      <div className={cn("grid grid-cols-1 gap-4", scope && "xl:grid-cols-2")}>
        {scope && (
          <CleaningRatesBox
            key={`c-${scope}`}
            siteId={scope}
            rates={all.filter((r) => r.cleaningHourlyRate != null || r.cleaningPerVisitAmount != null)}
          />
        )}
        <SupervisionRateBox
          key={`s-${scope ?? "default"}`}
          siteId={scope}
          rates={all.filter((r) => r.supervisionHourlyRate != null || r.supervisionPerVisitAmount != null)}
        />
      </div>

      {scope && <PersonAgreementsSection key={`a-${scope}`} siteId={scope} />}
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

function RateTypeSelect({ value, onChange, allowSite }: {
  value: RateType | "";
  onChange: (v: RateType | "") => void;
  allowSite?: boolean;
}) {
  return (
    <select className={input} value={value} onChange={(e) => onChange(e.target.value as RateType | "")}>
      {allowSite && <option value="">Site rate</option>}
      <option value="HOURLY">Per hour</option>
      <option value="PER_VISIT">Per visit (day)</option>
    </select>
  );
}

function WeekdayHoursInput({ value, onChange, label }: { value: DayHours; onChange: (v: DayHours) => void; label: string }) {
  return (
    <div className="mt-3">
      <p className="mb-1 text-xs text-grey-600">{label}</p>
      <div className="flex flex-wrap gap-2">
        {WEEKDAYS.map((d) => (
          <label key={d} className="flex items-center gap-1 text-xs text-grey-600">
            {d.slice(0, 1)}{d.slice(1, 3).toLowerCase()}
            <input type="number" min={0} max={24} step="0.25" className={`${input} w-16`}
              value={value[d] ?? ""}
              onChange={(e) => onChange({ ...value, [d]: e.target.value })} />
          </label>
        ))}
      </div>
    </div>
  );
}

function CleaningRatesBox({ siteId, rates }: { siteId: string; rates: Rate[] }) {
  const addRate = useAddRate();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    effectiveFrom: todayISODate(),
    cleaningRateType: "HOURLY" as RateType,
    cleaningHourlyRate: "",
    cleaningPerVisitAmount: "",
    agreedHours: "",
    weekendMultiplier: "1",
    publicHolidayMultiplier: "1",
    byDay: {} as DayHours,
  });
  const perVisit = form.cleaningRateType === "PER_VISIT";

  async function save() {
    setError(null);
    if (!form.effectiveFrom) {
      setError("Choose the date the rate applies from.");
      return;
    }
    const rate = num(perVisit ? form.cleaningPerVisitAmount : form.cleaningHourlyRate);
    if (rate == null || rate < 0) {
      setError("Enter the cleaning rate.");
      return;
    }
    const byDay = perVisit ? {} : dayMinutes(form.byDay);
    const agreed = perVisit ? null : num(form.agreedHours);
    if (byDay == null || (agreed != null && (agreed < 0 || agreed > 24))) {
      setError("Agreed hours must be between 0 and 24.");
      return;
    }
    const body: RateInput = {
      effectiveFrom: form.effectiveFrom,
      cleaningRateType: form.cleaningRateType,
      cleaningHourlyRate: perVisit ? null : rate,
      cleaningPerVisitAmount: perVisit ? rate : null,
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
          <DateInput className={input} value={form.effectiveFrom}
            onChange={(e) => setForm({ ...form, effectiveFrom: e.target.value })} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-grey-600">
          Rate type
          <RateTypeSelect value={form.cleaningRateType}
            onChange={(v) => setForm({ ...form, cleaningRateType: (v || "HOURLY") as RateType })} />
        </label>
        {perVisit ? (
          <label className="flex flex-col gap-1 text-xs text-grey-600">
            Per visit ($)
            <input type="number" min={0} step="0.01" className={input} value={form.cleaningPerVisitAmount}
              onChange={(e) => setForm({ ...form, cleaningPerVisitAmount: e.target.value })} />
          </label>
        ) : (
          <>
            <label className="flex flex-col gap-1 text-xs text-grey-600">
              Hourly rate ($)
              <input type="number" min={0} step="0.01" className={input} value={form.cleaningHourlyRate}
                onChange={(e) => setForm({ ...form, cleaningHourlyRate: e.target.value })} />
            </label>
            <label className="flex flex-col gap-1 text-xs text-grey-600">
              Agreed hours / cleaner / day
              <input type="number" min={0} max={24} step="0.25" className={input} value={form.agreedHours}
                onChange={(e) => setForm({ ...form, agreedHours: e.target.value })} />
            </label>
          </>
        )}
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
      {perVisit ? (
        <p className="mt-3 rounded-lg bg-grey-50 px-3 py-2 text-xs text-grey-600">{PER_VISIT_HINT}</p>
      ) : (
        <WeekdayHoursInput label="Agreed hours for particular weekdays (optional)" value={form.byDay}
          onChange={(byDay) => setForm({ ...form, byDay })} />
      )}
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
                  <td className="py-2">{formatDate(r.effectiveFrom)}</td>
                  <td className="py-2">{rateText(r.cleaningRateType, r.cleaningHourlyRate, r.cleaningPerVisitAmount)}</td>
                  <td className="py-2">
                    {r.cleaningRateType === "PER_VISIT" ? "Per visit" : hoursText(r.agreedMinutesPerDay)}
                    {r.cleaningRateType !== "PER_VISIT" && weekdaySummary(r.agreedMinutesByDay)}
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
  const [effectiveFrom, setEffectiveFrom] = useState(() => todayISODate());
  const [rateType, setRateType] = useState<RateType>("HOURLY");
  const [rate, setRate] = useState("");
  const [agreedHours, setAgreedHours] = useState("");
  const [byDay, setByDay] = useState<DayHours>({});
  const [weekend, setWeekend] = useState("1");
  const [holiday, setHoliday] = useState("1");
  const perVisit = rateType === "PER_VISIT";

  async function save() {
    setError(null);
    if (!effectiveFrom) {
      setError("Choose the date the rate applies from.");
      return;
    }
    const value = num(rate);
    if (value == null || value < 0) {
      setError("Enter the supervision rate.");
      return;
    }
    const agreed = perVisit ? null : num(agreedHours);
    const days = perVisit ? {} : dayMinutes(byDay);
    if (days == null || (agreed != null && (agreed < 0 || agreed > 24))) {
      setError("Agreed supervision hours must be between 0 and 24.");
      return;
    }
    try {
      await addRate.mutateAsync({
        siteId,
        input: {
          effectiveFrom,
          cleaningRateType: "HOURLY",
          supervisionRateType: rateType,
          supervisionHourlyRate: perVisit ? null : value,
          supervisionPerVisitAmount: perVisit ? value : null,
          supervisionAgreedMinutesPerDay: agreed == null ? null : Math.round(agreed * 60),
          supervisionAgreedMinutesByDay: days,
          supervisionWeekendMultiplier: num(weekend),
          supervisionPublicHolidayMultiplier: num(holiday),
        },
      });
      setRate("");
      setAgreedHours("");
      setByDay({});
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
          ? "Supervisors' hours at this site. Leave empty to use the company default supervision rate. Agreed hours are the default final hours on supervisors' invoices."
          : "Used for supervision at any site that has no supervision rate of its own."}
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs text-grey-600">
          Effective from
          <DateInput className={input} value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-grey-600">
          Rate type
          <RateTypeSelect value={rateType} onChange={(v) => setRateType((v || "HOURLY") as RateType)} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-grey-600">
          {perVisit ? "Per visit ($)" : "Hourly rate ($)"}
          <input type="number" min={0} step="0.01" className={input} value={rate} onChange={(e) => setRate(e.target.value)} />
        </label>
        {!perVisit && (
          <label className="flex flex-col gap-1 text-xs text-grey-600">
            Agreed supervision hours per day (optional)
            <input type="number" min={0} max={24} step="0.25" className={input} value={agreedHours}
              onChange={(e) => setAgreedHours(e.target.value)} placeholder="e.g. 1.5" />
          </label>
        )}
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
      {perVisit ? (
        <p className="mt-3 rounded-lg bg-grey-50 px-3 py-2 text-xs text-grey-600">{PER_VISIT_HINT}</p>
      ) : (
        <WeekdayHoursInput label="Agreed supervision hours for particular weekdays (optional)" value={byDay} onChange={setByDay} />
      )}
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
              <li key={r.id} className="flex items-center justify-between gap-2 py-2">
                <span>
                  From {formatDate(r.effectiveFrom)} · {rateText(r.supervisionRateType, r.supervisionHourlyRate, r.supervisionPerVisitAmount)}
                  {r.supervisionRateType !== "PER_VISIT" && r.supervisionAgreedMinutesPerDay != null
                    ? ` · agreed ${hoursText(r.supervisionAgreedMinutesPerDay)}/day` : ""} · weekend ×
                  {r.supervisionWeekendMultiplier ?? 1} · holiday ×{r.supervisionPublicHolidayMultiplier ?? 1}
                  {r.supervisionRateType !== "PER_VISIT" && weekdaySummary(r.supervisionAgreedMinutesByDay)}
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

function PersonAgreementsSection({ siteId }: { siteId: string }) {
  const { data: rows = [] } = useAgreedHours(siteId);
  const { data: cleaners = [], isLoading: cleanersLoading } = useCleaners();
  const { data: people = [], isLoading: peopleLoading } = useInvoicePeople();
  const cleanerOptions = useMemo(
    () =>
      cleaners
        .map((c) => ({ id: c.id, name: `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim() || c.email || "Cleaner" }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [cleaners],
  );
  const supervisorOptions = useMemo(
    () =>
      people
        .filter((p) => p.roles.includes("SUPERVISOR"))
        .map((p) => ({ id: p.userId, name: p.name || p.email || "Supervisor" }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [people],
  );

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <AgreementBox
        siteId={siteId}
        role="CLEANER"
        title="Agreed hours & rate per cleaner"
        options={cleanerOptions}
        loading={cleanersLoading}
        rows={rows.filter((r) => r.personRole === "CLEANER")}
      />
      <AgreementBox
        siteId={siteId}
        role="SUPERVISOR"
        title="Agreed hours & rate per supervisor"
        options={supervisorOptions}
        loading={peopleLoading}
        rows={rows.filter((r) => r.personRole === "SUPERVISOR")}
      />
    </div>
  );
}

function AgreementBox({ siteId, role, title, options, loading, rows }: {
  siteId: string;
  role: "CLEANER" | "SUPERVISOR";
  title: string;
  options: { id: string; name: string }[];
  loading: boolean;
  rows: AgreedHours[];
}) {
  const add = useAddAgreedHours();
  const remove = useDeleteAgreedHours();
  const noun = role === "CLEANER" ? "cleaner" : "supervisor";
  const [personId, setPersonId] = useState("");
  const [from, setFrom] = useState(() => todayISODate());
  const [to, setTo] = useState("");
  const [rateType, setRateType] = useState<RateType | "">("");
  const [rate, setRate] = useState("");
  const [hours, setHours] = useState("");
  const [byDay, setByDay] = useState<DayHours>({});
  const [error, setError] = useState<string | null>(null);
  const perVisit = rateType === "PER_VISIT";

  async function save() {
    setError(null);
    if (!personId || !from) {
      setError(`Choose a ${noun} and the date the agreement applies from.`);
      return;
    }
    if (to && to < from) {
      setError("The end date must be on or after the start date.");
      return;
    }
    const h = perVisit ? null : num(hours);
    const days = perVisit ? {} : dayMinutes(byDay);
    if (days == null || (h != null && (h < 0 || h > 24))) {
      setError("Agreed hours must be between 0 and 24.");
      return;
    }
    const r = rateType ? num(rate) : null;
    if (rateType && (r == null || r < 0)) {
      setError("Enter the rate, or choose “Site rate”.");
      return;
    }
    if (h == null && Object.keys(days).length === 0 && !rateType) {
      setError("Enter agreed hours (every day or particular weekdays) or a rate.");
      return;
    }
    try {
      await add.mutateAsync({
        siteId,
        cleanerId: role === "CLEANER" ? personId : null,
        supervisorUserId: role === "SUPERVISOR" ? personId : null,
        effectiveFrom: from,
        effectiveTo: to || null,
        agreedMinutesPerDay: h == null ? null : Math.round(h * 60),
        agreedMinutesByDay: days,
        rateType: rateType || null,
        hourlyRate: rateType === "HOURLY" ? r : null,
        perVisitAmount: perVisit ? r : null,
      });
      setHours("");
      setRate("");
      setByDay({});
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm">
      <h3 className="mb-1 text-sm font-semibold text-on-surface">{title}</h3>
      <p className="mb-3 text-xs text-grey-500">
        Overrides the site&apos;s agreed hours and/or rate for one {noun}. Set an end date to apply it only to particular
        dates (the same start and end date = one day).
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1 text-xs text-grey-600 sm:col-span-2">
          {role === "CLEANER" ? "Cleaner" : "Supervisor"}
          <SiteFilterSelect
            variant="field"
            sites={options}
            value={personId}
            onChange={setPersonId}
            loading={loading}
            icon={role === "CLEANER" ? UserRound : ShieldCheck}
            ariaLabel={`Select ${noun}`}
            placeholder={`Search a ${noun} by name…`}
            searchPlaceholder={`Search ${noun}s by name…`}
            emptyLabel={`No ${noun}s`}
            noResultsLabel={`No ${noun}s match your search.`}
            noOptionsLabel={`No ${noun}s available.`}
            className="sm:max-w-none"
          />
        </div>
        <label className="flex flex-col gap-1 text-xs text-grey-600">
          From
          <DateInput className={input} value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-grey-600">
          To (optional)
          <DateInput className={input} value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-grey-600">
          Rate type
          <RateTypeSelect allowSite value={rateType} onChange={setRateType} />
        </label>
        {rateType ? (
          <label className="flex flex-col gap-1 text-xs text-grey-600">
            {perVisit ? "Per visit ($)" : "Hourly rate ($)"}
            <input type="number" min={0} step="0.01" className={input} value={rate} onChange={(e) => setRate(e.target.value)} />
          </label>
        ) : (
          <span className="hidden sm:block" />
        )}
        {!perVisit && (
          <label className="flex flex-col gap-1 text-xs text-grey-600">
            Agreed hours / day
            <input type="number" min={0} max={24} step="0.25" placeholder="Hours / day" value={hours}
              onChange={(e) => setHours(e.target.value)} className={input} />
          </label>
        )}
      </div>
      {perVisit ? (
        <p className="mt-3 rounded-lg bg-grey-50 px-3 py-2 text-xs text-grey-600">{PER_VISIT_HINT}</p>
      ) : (
        <WeekdayHoursInput label="Agreed hours for particular weekdays (optional)" value={byDay} onChange={setByDay} />
      )}
      {error && <p className="mt-2 text-sm text-error">{error}</p>}
      <button type="button" onClick={save} disabled={add.isPending}
        className="mt-3 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
        {add.isPending ? "Saving…" : "Add"}
      </button>
      {rows.length > 0 && (
        <ul className="mt-3 divide-y divide-grey-100 border-t border-grey-100 text-sm">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-2 py-2">
              <span className="min-w-0">
                <span className="font-medium text-on-surface">{r.cleanerName}</span>
                {" · "}
                {r.effectiveTo
                  ? r.effectiveTo === r.effectiveFrom
                    ? `on ${formatDate(r.effectiveFrom)}`
                    : `${formatDate(r.effectiveFrom)} – ${formatDate(r.effectiveTo)}`
                  : `from ${formatDate(r.effectiveFrom)}`}
                {r.rateType ? ` · ${rateText(r.rateType, r.hourlyRate, r.perVisitAmount)}` : ""}
                {r.rateType !== "PER_VISIT" && r.agreedMinutesPerDay != null ? ` · ${hoursText(r.agreedMinutesPerDay)}/day` : ""}
                {r.rateType !== "PER_VISIT" && weekdaySummary(r.agreedMinutesByDay)}
              </span>
              <button type="button" aria-label="Remove" onClick={() => remove.mutate(r.id)}
                className="shrink-0 rounded-full p-1.5 text-grey-400 hover:bg-error/10 hover:text-error">
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

