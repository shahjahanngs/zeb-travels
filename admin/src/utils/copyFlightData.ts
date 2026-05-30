// ── Shared types ──────────────────────────────────────────────────────────────

export interface FlightDetail {
  dep_date?: string;
  flight_date?: string;
  flight_no?: string;
  flightNo?: string;
  origin?: string;
  from?: string;
  destination?: string;
  to?: string;
  dept_time?: string;
  dep_time?: string;
  depTime?: string;
  arv_time?: string;
  arr_time?: string;
  arrTime?: string;
}

export interface UnifiedGroup {
  id: string;
  source: string;
  sector: string;
  type: string;
  available_no_of_pax: number;
  price: number;
  dept_date: string;
  airline: {
    airline_name: string;
    short_name: string;
    logo_url: string | null;
  };
  pnr: string;
  details?: FlightDetail[];
}

export interface CopyTextEntry {
  group: UnifiedGroup;
  date: Date;
  price: number;
  line: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

export const MONTHS_TITLE = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const COPY_FOOTER = `*ALL GROUPS ARE NON REFUNDABLE AND NON CHANGEABLE*

=======================

AL - MAMOORAH INTERNATIONAL PVT LTD

Mobile: 0300-5008889
Address: Shop No 03 G Floor G 13 Services Road G 12 Islamabad.
Ptcl: 0300-5008889
Website: almamoorah.com`;

// ── Helpers ───────────────────────────────────────────────────────────────────

export function trimTime(t: string): string {
  if (!t) return "";
  return t.slice(0, 5);
}

export function extractIATA(terminal: string): string {
  if (!terminal) return "";
  const match = terminal.match(/\(([A-Z]{3})\)/);
  return match ? match[1] : terminal.trim();
}

function buildFlightLine(
  g: UnifiedGroup,
): { date: Date; price: number; line: string } | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const price = g.price || 0;

  if (g.details && g.details.length > 0) {
    const d = g.details[0];
    const rawDate = d.dep_date || d.flight_date || g.dept_date;
    if (!rawDate) return null;

    const date = new Date(rawDate);
    if (isNaN(date.getTime())) return null;

    const depDay = new Date(date);
    depDay.setHours(0, 0, 0, 0);
    if (depDay < today) return null;

    const dd = String(date.getDate()).padStart(2, "0");
    const mon = MONTHS_TITLE[date.getMonth()];
    const flightNo = (d.flight_no || d.flightNo || "").toUpperCase();
    const origin = extractIATA(d.origin || d.from || "");
    const dest = extractIATA(d.destination || d.to || "");
    const depTime = trimTime(d.dept_time || d.dep_time || d.depTime || "");
    const arvTime = trimTime(d.arv_time || d.arr_time || d.arrTime || "");
    const formattedDate = `${dd}${mon.toUpperCase()}`;
    const cleanDepTime = depTime.replace(":", "");
    const cleanArrTime = arvTime.replace(":", "");

    const line = `${flightNo} *${formattedDate}* ${origin} ${cleanDepTime} ${dest} ${cleanArrTime} *PKR ${price}*`;
    return { date, price, line };
  } else {
    const rawDate = g.dept_date;
    if (!rawDate) return null;

    const date = new Date(rawDate);
    if (isNaN(date.getTime())) return null;

    const depDay = new Date(date);
    depDay.setHours(0, 0, 0, 0);
    if (depDay < today) return null;

    const dd = String(date.getDate()).padStart(2, "0");
    const mon = MONTHS_TITLE[date.getMonth()];
    const code = g.airline?.short_name || "";
    const formattedDate = `${dd}${mon.toUpperCase()}`;
    const sec = (g.sector || "").replace("-", " ");

    const line = `${code} *${formattedDate}* ${sec}..... *PKR ${price}*`;
    return { date, price, line };
  }
}

function sortByDateThenPrice<T extends { date: Date; price: number }>(
  entries: T[],
): T[] {
  return entries.sort((a, b) => {
    const timeDiff = a.date.getTime() - b.date.getTime();
    if (timeDiff !== 0) return timeDiff;
    return a.price - b.price;
  });
}

function buildHeader(): string {
  const today = new Date();
  return `*===== ${String(today.getDate()).padStart(2, "0")} ${MONTHS_TITLE[today.getMonth()].toUpperCase()} UPDATES =====*`;
}

// ── Public build functions ────────────────────────────────────────────────────

export function buildCopyText(groups: UnifiedGroup[]): string {
  if (!groups.length) return "";

  const header = buildHeader();

  const sectorMap = new Map<string, CopyTextEntry[]>();
  const sectorOrder: string[] = [];

  groups.forEach((g) => {
    if (g.available_no_of_pax !== undefined && g.available_no_of_pax <= 0)
      return;

    const sector = g.sector || "UNKNOWN";
    if (!sectorMap.has(sector)) {
      sectorMap.set(sector, []);
      sectorOrder.push(sector);
    }

    const entry = buildFlightLine(g);
    if (!entry) return;

    sectorMap.get(sector)!.push({ group: g, ...entry });
  });

  sectorMap.forEach((entries) => sortByDateThenPrice(entries));

  const lines: string[] = [];
  sectorOrder.forEach((sector) => {
    sectorMap.get(sector)!.forEach((e) => lines.push(e.line));
  });

  return [header, ...lines, "=======================", COPY_FOOTER].join(
    "\n\n",
  );
}

export function buildSectorCopyText(
  groups: UnifiedGroup[],
  sectorFilter: string,
): string {
  if (!groups.length) return "";

  const header = buildHeader();

  const entries: Array<{ date: Date; price: number; line: string }> = [];

  groups.forEach((g) => {
    if ((g.sector || "UNKNOWN") !== sectorFilter) return;
    if (g.available_no_of_pax !== undefined && g.available_no_of_pax <= 0)
      return;

    const entry = buildFlightLine(g);
    if (entry) entries.push(entry);
  });

  sortByDateThenPrice(entries);

  return [
    header,
    ...entries.map((e) => e.line),
    "=======================",
    COPY_FOOTER,
  ].join("\n\n");
}

// ── Copy-to-clipboard helper ──────────────────────────────────────────────────

export async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const el = document.createElement("textarea");
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
  }
}

// ── Sector helpers ────────────────────────────────────────────────────────────

export function getAvailableSectors(groups: UnifiedGroup[]): string[] {
  const sectorSet = new Set<string>();
  groups.forEach((g) => {
    if (
      g.sector &&
      g.available_no_of_pax !== undefined &&
      g.available_no_of_pax > 0
    ) {
      sectorSet.add(g.sector);
    }
  });
  return Array.from(sectorSet).sort();
}
