import React, { useMemo, useState } from 'react';
import { Box, Button, Card, Grid, MenuItem, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography, Chip } from '@mui/material';
import { BarChart, LineChart, PieChart } from '@mui/x-charts';
import DownloadIcon from '@mui/icons-material/DownloadRounded';
import dayjs from 'dayjs';
import { useTheme } from '@mui/material/styles';
import { useApp } from '../store/AppContext.jsx';
import { PageHeader, SectionCard, StatCard, PersonAvatar } from '../components/common.jsx';
import { fmtINR, sum, groupBy, pct, downloadJSON, TODAY } from '../utils/format';
import { statusColors } from '../theme/theme';

export default function ReportsPage() {
  const brandPrimary = useTheme().palette.primary.main;
  const { state, clientById, venueById, teamById } = useApp();
  const [year, setYear] = useState('All');
  const years = useMemo(() => ['All', ...[...new Set(state.events.map((e) => e.startDate.slice(0, 4)))].sort().reverse()], [state.events]);
  const events = useMemo(() => state.events.filter((e) => year === 'All' || e.startDate.startsWith(year)), [state.events, year]);
  const ids = new Set(events.map((e) => e.id));
  const expenses = state.expenses.filter((x) => ids.has(x.eventId));
  const tasks = state.tasks.filter((t) => ids.has(t.eventId));

  const r = useMemo(() => {
    const byClient = Object.entries(groupBy(events, 'clientId')).map(([id, arr]) => ({ name: clientById[id]?.name || id, value: sum(arr, 'budget'), sqm: sum(arr, 'stallSizeSqm'), n: arr.length })).sort((a, b) => b.value - a.value).slice(0, 10);
    const byVenue = Object.entries(groupBy(events, 'venueId')).map(([id, arr]) => ({ name: venueById[id]?.name?.split(' (')[0] || id, n: arr.length, sqm: sum(arr, 'stallSizeSqm') })).sort((a, b) => b.n - a.n).slice(0, 8);
    const byType = Object.entries(groupBy(events, 'stallType')).map(([t, arr]) => ({ id: t, label: t, value: arr.length }));
    const byStatus = Object.entries(groupBy(events, 'status')).map(([t, arr]) => ({ id: t, label: t, value: arr.length, color: statusColors[t] }));
    const byCity = Object.entries(groupBy(events, (e) => venueById[e.venueId]?.city || '—')).map(([c, arr]) => ({ city: c, n: arr.length }));
    const quarters = [...new Set(events.map((e) => `${e.startDate.slice(0, 4)} Q${Math.ceil(Number(e.startDate.slice(5, 7)) / 3)}`))].sort();
    const qData = quarters.map((q) => { const arr = events.filter((e) => `${e.startDate.slice(0, 4)} Q${Math.ceil(Number(e.startDate.slice(5, 7)) / 3)}` === q); return { q, value: sum(arr, 'budget'), sqm: sum(arr, 'stallSizeSqm'), n: arr.length }; });
    const done = events.filter((e) => e.status === 'Completed');
    const avgMargin = done.length ? Math.round(done.reduce((s, e) => s + ((e.budget - e.spent) / e.budget) * 100, 0) / done.length) : 0;
    const onBudget = done.filter((e) => e.spent <= e.budget).length;
    const teamLoad = state.team.map((t) => ({ t, open: tasks.filter((x) => x.assigneeId === t.id && x.status !== 'Done').length, done: tasks.filter((x) => x.assigneeId === t.id && x.status === 'Done').length })).sort((a, b) => b.open + b.done - a.open - a.done).slice(0, 8);
    const taskDone = pct(tasks.filter((t) => t.status === 'Done').length, tasks.length);
    const overdue = tasks.filter((t) => t.status !== 'Done' && dayjs(t.dueDate).isBefore(TODAY)).length;
    return { byClient, byVenue, byType, byStatus, byCity, qData, avgMargin, onBudget, done, teamLoad, taskDone, overdue };
  }, [events, tasks, clientById, venueById, state.team]);

  return (
    <Box>
      <PageHeader title="Reports & analytics" subtitle="Business performance across projects, clients, venues and the team"
        actions={<><TextField select size="small" value={year} onChange={(e) => setYear(e.target.value)} sx={{ minWidth: 120 }}>{years.map((y) => <MenuItem key={y} value={y}>{y === 'All' ? 'All years' : y}</MenuItem>)}</TextField><Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => downloadJSON(`nanya-report-${year}.json`, { generated: TODAY.format(), year, events, expenses, summary: r })}>Export JSON</Button></>} />
      <Grid container spacing={2.5}>
        <Grid item xs={6} md={3}><StatCard title="Projects" value={events.length} sub={`${sum(events, 'stallSizeSqm').toLocaleString('en-IN')} m² · ${fmtINR(sum(events, 'budget'), true)}`} /></Grid>
        <Grid item xs={6} md={3}><StatCard title="Avg. margin (completed)" value={`${r.avgMargin}%`} sub={`${r.onBudget}/${r.done.length} delivered on budget`} color={r.avgMargin < 5 ? 'error' : 'success'} /></Grid>
        <Grid item xs={6} md={3}><StatCard title="Task completion" value={`${r.taskDone}%`} sub={`${tasks.length} tasks · ${r.overdue} overdue`} color="info" /></Grid>
        <Grid item xs={6} md={3}><StatCard title="Avg. stall size" value={`${Math.round(sum(events, 'stallSizeSqm') / (events.length || 1))} m²`} sub={`Avg. value ${fmtINR(sum(events, 'budget') / (events.length || 1), true)}`} color="secondary" /></Grid>

        <Grid item xs={12} lg={8}>
          <SectionCard title="Quarterly project value & area">
            <LineChart height={280} xAxis={[{ scaleType: 'point', data: r.qData.map((x) => x.q) }]}
              series={[{ data: r.qData.map((x) => x.value), label: 'Value', color: brandPrimary, yAxisId: 'v', area: true }, { data: r.qData.map((x) => x.sqm), label: 'Sqm', color: '#c9a24a', yAxisId: 's' }]}
              yAxis={[{ id: 'v', valueFormatter: (v) => fmtINR(v, true) }, { id: 's' }]} rightAxis="s" margin={{ left: 70, right: 50, top: 30, bottom: 30 }} sx={{ '.MuiAreaElement-root': { fillOpacity: 0.1 } }} />
          </SectionCard>
        </Grid>
        <Grid item xs={12} lg={4}>
          <SectionCard title="Stall type mix">
            <PieChart height={280} series={[{ data: r.byType, innerRadius: 55, outerRadius: 100, paddingAngle: 2, cornerRadius: 4 }]} margin={{ left: 0, right: 0, top: 10, bottom: 60 }} slotProps={{ legend: { direction: 'row', position: { vertical: 'bottom', horizontal: 'middle' }, itemMarkWidth: 10, itemMarkHeight: 10, labelStyle: { fontSize: 12 } } }} />
          </SectionCard>
        </Grid>

        <Grid item xs={12} lg={6}>
          <SectionCard title="Top clients by project value">
            <BarChart height={320} dataset={r.byClient} yAxis={[{ scaleType: 'band', dataKey: 'name', tickLabelStyle: { fontSize: 11 } }]} xAxis={[{ valueFormatter: (v) => fmtINR(v, true) }]} series={[{ dataKey: 'value', label: 'Value', color: '#1f6f5c', valueFormatter: (v) => fmtINR(v) }]} layout="horizontal" margin={{ left: 150, right: 10, top: 10, bottom: 30 }} slotProps={{ legend: { hidden: true } }} />
          </SectionCard>
        </Grid>
        <Grid item xs={12} lg={6}>
          <SectionCard title="Projects by venue">
            <BarChart height={320} dataset={r.byVenue} yAxis={[{ scaleType: 'band', dataKey: 'name', tickLabelStyle: { fontSize: 11 } }]} series={[{ dataKey: 'n', label: 'Projects', color: '#c9a24a' }]} layout="horizontal" margin={{ left: 170, right: 10, top: 10, bottom: 30 }} slotProps={{ legend: { hidden: true } }} />
          </SectionCard>
        </Grid>

        <Grid item xs={12} lg={5}>
          <SectionCard title="Team workload (tasks)">
            <Stack gap={1.25}>
              {r.teamLoad.map(({ t, open, done }) => (
                <Stack key={t.id} direction="row" gap={1.5} alignItems="center">
                  <PersonAvatar person={t} size={30} />
                  <Box sx={{ flex: 1 }}>
                    <Stack direction="row" justifyContent="space-between"><Typography fontSize={13.5} fontWeight={600}>{t.name}</Typography><Typography variant="caption" color="text.secondary">{open} open · {done} done</Typography></Stack>
                    <Box sx={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', bgcolor: 'action.hover', mt: 0.5 }}>
                      <Box sx={{ width: `${pct(done, open + done)}%`, bgcolor: 'success.main' }} /><Box sx={{ width: `${pct(open, open + done)}%`, bgcolor: 'info.main' }} />
                    </Box>
                  </Box>
                </Stack>
              ))}
            </Stack>
          </SectionCard>
        </Grid>
        <Grid item xs={12} lg={7}>
          <SectionCard title="Completed project margins" noPadding>
            <Table size="small">
              <TableHead><TableRow><TableCell>Project</TableCell><TableCell align="right">Budget</TableCell><TableCell align="right">Actual</TableCell><TableCell align="right">Margin</TableCell><TableCell>Result</TableCell></TableRow></TableHead>
              <TableBody>
                {r.done.slice(0, 12).map((e) => { const mg = Math.round(((e.budget - e.spent) / e.budget) * 100); return (
                  <TableRow key={e.id} hover>
                    <TableCell><Typography fontSize={13.5} fontWeight={600} noWrap sx={{ maxWidth: 280 }}>{e.title}</Typography></TableCell>
                    <TableCell align="right">{fmtINR(e.budget, true)}</TableCell>
                    <TableCell align="right">{fmtINR(e.spent, true)}</TableCell>
                    <TableCell align="right"><Typography fontSize={13.5} fontWeight={700} color={mg < 0 ? 'error.main' : 'success.main'}>{mg}%</Typography></TableCell>
                    <TableCell><Chip size="small" label={mg < 0 ? 'Over budget' : mg < 8 ? 'Thin margin' : 'Healthy'} color={mg < 0 ? 'error' : mg < 8 ? 'warning' : 'success'} variant="outlined" /></TableCell>
                  </TableRow>
                ); })}
              </TableBody>
            </Table>
          </SectionCard>
        </Grid>
      </Grid>
    </Box>
  );
}
