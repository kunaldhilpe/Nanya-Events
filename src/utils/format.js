import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import isBetween from 'dayjs/plugin/isBetween';
dayjs.extend(relativeTime);
dayjs.extend(isBetween);

export const TODAY = dayjs('2026-10-15');

export const fmtINR = (n, compact = false) => {
  if (n == null || Number.isNaN(n)) return '—';
  if (compact) {
    if (Math.abs(n) >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
    if (Math.abs(n) >= 1e5) return `₹${(n / 1e5).toFixed(1)} L`;
    if (Math.abs(n) >= 1e3) return `₹${(n / 1e3).toFixed(0)}K`;
  }
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
};

export const fmtDate = (d, f = 'DD MMM YYYY') => (d ? dayjs(d).format(f) : '—');
export const fmtRange = (a, b) => {
  const s = dayjs(a), e = dayjs(b);
  if (s.isSame(e, 'month')) return `${s.format('DD')}–${e.format('DD MMM YYYY')}`;
  return `${s.format('DD MMM')} – ${e.format('DD MMM YYYY')}`;
};
export const fromNow = (d) => dayjs(d).from(TODAY);
export const daysUntil = (d) => dayjs(d).diff(TODAY, 'day');
export const initials = (name = '') => name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
export const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
export const sum = (arr, key) => arr.reduce((s, x) => s + (typeof key === 'function' ? key(x) : x[key] || 0), 0);
export const groupBy = (arr, key) =>
  arr.reduce((acc, x) => {
    const k = typeof key === 'function' ? key(x) : x[key];
    (acc[k] ||= []).push(x);
    return acc;
  }, {});

export const EVENT_STATUSES = ['Planning', 'Design', 'Fabrication', 'Installation', 'Live', 'Completed', 'Cancelled'];
export const TASK_STATUSES = ['To Do', 'In Progress', 'Review', 'Done'];
export const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];
export const STALL_TYPES = ['Custom Build', 'Double Decker', 'Modular', 'Outdoor Pavilion', 'Design Only'];
export const EXPENSE_CATEGORIES = ['Fabrication', 'Electrical', 'Audio Visual', 'Printing & Graphics', 'Furniture & Decor', 'Logistics', 'Flooring & Carpet', 'Rigging & Truss', 'Landscaping', 'Hostess & Manpower', 'Venue Charges', 'Travel & Stay', 'Miscellaneous'];

export function downloadJSON(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadCSV(filename, rows) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [keys.join(','), ...rows.map((r) => keys.map((k) => esc(Array.isArray(r[k]) ? r[k].join('; ') : r[k])).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
