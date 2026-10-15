import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Box, Button, Card, Chip, Grid, IconButton, MenuItem, Stack, TextField, Typography, Tabs, Tab, Table, TableBody, TableCell, TableHead, TableRow, LinearProgress } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { BarChart, PieChart } from '@mui/x-charts';
import AddIcon from '@mui/icons-material/AddRounded';
import EditIcon from '@mui/icons-material/EditRounded';
import DeleteIcon from '@mui/icons-material/DeleteRounded';
import DownloadIcon from '@mui/icons-material/DownloadRounded';
import dayjs from 'dayjs';
import { useTheme } from '@mui/material/styles';
import { useApp } from '../store/AppContext.jsx';
import { useToast } from '../components/SnackbarProvider.jsx';
import { PageHeader, StatCard, SectionCard, ProgressBar, StatusChip, ConfirmDialog } from '../components/common.jsx';
import ExpenseDialog from '../components/ExpenseDialog.jsx';
import { fmtINR, fmtDate, sum, groupBy, pct, downloadCSV, TODAY, EXPENSE_CATEGORIES } from '../utils/format';

export default function FinancePage() {
  const brandPrimary = useTheme().palette.primary.main;
  const { state, dispatch, eventById, vendorById, clientById } = useApp();
  const notify = useToast();
  const [tab, setTab] = useState('ledger');
  const [status, setStatus] = useState('All');
  const [cat, setCat] = useState('All');
  const [eventId, setEventId] = useState('All');
  const [dlg, setDlg] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const m = useMemo(() => {
    const totalBudget = sum(state.events, 'budget');
    const totalSpent = sum(state.expenses, 'amount');
    const paid = sum(state.expenses.filter((x) => x.status === 'Paid'), 'amount');
    const pending = sum(state.expenses.filter((x) => x.status === 'Pending'), 'amount');
    const overdue = sum(state.expenses.filter((x) => x.status === 'Overdue'), 'amount');
    const byCat = Object.entries(groupBy(state.expenses, 'category')).map(([label, arr]) => ({ id: label, label, value: sum(arr, 'amount') })).sort((a, b) => b.value - a.value);
    const months = Array.from({ length: 12 }, (_, i) => TODAY.subtract(11 - i, 'month').format('YYYY-MM'));
    const cash = months.map((mo) => ({ month: dayjs(mo).format('MMM YY'), paid: sum(state.expenses.filter((x) => x.date.startsWith(mo) && x.status === 'Paid'), 'amount'), unpaid: sum(state.expenses.filter((x) => x.date.startsWith(mo) && x.status !== 'Paid'), 'amount') }));
    const projects = state.events.map((e) => {
      const xs = state.expenses.filter((x) => x.eventId === e.id);
      const committed = sum(xs, 'amount');
      return { ...e, committed, paid: sum(xs.filter((x) => x.status === 'Paid'), 'amount'), variance: e.budget - committed, usage: pct(committed, e.budget), margin: e.budget ? Math.round(((e.budget - committed) / e.budget) * 100) : 0 };
    }).sort((a, b) => a.variance - b.variance);
    return { totalBudget, totalSpent, paid, pending, overdue, byCat, cash, projects };
  }, [state.events, state.expenses]);

  const rows = useMemo(() => state.expenses
    .filter((x) => (status === 'All' || x.status === status) && (cat === 'All' || x.category === cat) && (eventId === 'All' || x.eventId === eventId))
    .map((x) => ({ ...x, project: eventById[x.eventId]?.title || '—', vendor: vendorById[x.vendorId]?.name || '—' }))
    .sort((a, b) => b.date.localeCompare(a.date)), [state.expenses, status, cat, eventId, eventById, vendorById]);

  const columns = [
    { field: 'date', headerName: 'Date', width: 110, valueFormatter: (v) => fmtDate(v, 'DD MMM YY') },
    { field: 'project', headerName: 'Project', flex: 1.3, minWidth: 220, renderCell: (p) => <Typography fontSize={13.5} component={Link} to={`/events/${p.row.eventId}?tab=budget`} sx={{ color: 'inherit', textDecoration: 'none', '&:hover': { color: 'primary.main' } }} noWrap>{p.value}</Typography> },
    { field: 'description', headerName: 'Description', flex: 1, minWidth: 200 },
    { field: 'category', headerName: 'Category', width: 150, renderCell: (p) => <Chip size="small" variant="outlined" label={p.value} /> },
    { field: 'vendor', headerName: 'Vendor', width: 180 },
    { field: 'invoiceNo', headerName: 'Invoice', width: 130 },
    { field: 'amount', headerName: 'Amount', width: 130, type: 'number', valueFormatter: (v) => fmtINR(v), cellClassName: 'amt' },
    { field: 'status', headerName: 'Status', width: 110, renderCell: (p) => <Chip size="small" label={p.value} color={p.value === 'Paid' ? 'success' : p.value === 'Overdue' ? 'error' : 'warning'} variant="outlined" /> },
    { field: 'actions', headerName: '', width: 90, sortable: false, renderCell: (p) => <><IconButton size="small" onClick={() => setDlg(p.row)}><EditIcon fontSize="small" /></IconButton><IconButton size="small" onClick={() => setConfirm(p.row)}><DeleteIcon fontSize="small" /></IconButton></> },
  ];

  const markPaid = (ids) => { ids.forEach((i) => dispatch({ type: 'UPDATE', entity: 'expenses', id: i, patch: { status: 'Paid' } })); notify(`${ids.length} marked as paid`); };

  return (
    <Box>
      <PageHeader title="Finance" subtitle="Budgets, vendor payments and project margins"
        actions={<><Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => downloadCSV('nanya-expenses.csv', rows.map(({ project, vendor, ...r }) => ({ ...r, project, vendor })))}>Export CSV</Button><Button variant="contained" startIcon={<AddIcon />} onClick={() => setDlg({})}>Record expense</Button></>} />
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid item xs={6} lg={3}><StatCard title="Total project budgets" value={fmtINR(m.totalBudget, true)} sub={`${state.events.length} projects`} /></Grid>
        <Grid item xs={6} lg={3}><StatCard title="Committed spend" value={fmtINR(m.totalSpent, true)} sub={`${pct(m.totalSpent, m.totalBudget)}% of budgets`} color="secondary" /></Grid>
        <Grid item xs={6} lg={3}><StatCard title="Pending vendor payments" value={fmtINR(m.pending, true)} sub={`${state.expenses.filter((x) => x.status === 'Pending').length} invoices`} color="warning" /></Grid>
        <Grid item xs={6} lg={3}><StatCard title="Overdue" value={fmtINR(m.overdue, true)} sub={`${state.expenses.filter((x) => x.status === 'Overdue').length} invoices need action`} color="error" onClick={() => { setTab('ledger'); setStatus('Overdue'); }} /></Grid>
      </Grid>

      <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 2.5, borderBottom: 1, borderColor: 'divider' }}>
        <Tab value="ledger" label="Expense ledger" /><Tab value="projects" label="Project budgets" /><Tab value="analysis" label="Analysis" />
      </Tabs>

      {tab === 'ledger' && (
        <Card>
          <Stack direction={{ xs: 'column', md: 'row' }} gap={1.5} sx={{ p: 1.5 }} alignItems={{ md: 'center' }}>
            <TextField select label="Status" value={status} onChange={(e) => setStatus(e.target.value)} sx={{ minWidth: 130 }}>{['All', 'Paid', 'Pending', 'Overdue'].map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField>
            <TextField select label="Category" value={cat} onChange={(e) => setCat(e.target.value)} sx={{ minWidth: 170 }}><MenuItem value="All">All</MenuItem>{EXPENSE_CATEGORIES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField>
            <TextField select label="Project" value={eventId} onChange={(e) => setEventId(e.target.value)} sx={{ minWidth: 240 }}><MenuItem value="All">All projects</MenuItem>{state.events.map((e) => <MenuItem key={e.id} value={e.id}>{e.title}</MenuItem>)}</TextField>
            <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>{rows.length} entries · {fmtINR(sum(rows, 'amount'))}</Typography>
            {status !== 'Paid' && rows.some((r) => r.status !== 'Paid') && <Button size="small" variant="outlined" onClick={() => markPaid(rows.filter((r) => r.status !== 'Paid').map((r) => r.id))}>Mark all visible as paid</Button>}
          </Stack>
          <DataGrid rows={rows} columns={columns} autoHeight rowHeight={48} disableRowSelectionOnClick initialState={{ pagination: { paginationModel: { pageSize: 20 } } }} pageSizeOptions={[20, 50, 100]} sx={{ border: 0, '& .amt': { fontWeight: 700 } }} />
        </Card>
      )}

      {tab === 'projects' && (
        <Card>
          <Table size="small">
            <TableHead><TableRow><TableCell>Project</TableCell><TableCell>Status</TableCell><TableCell align="right">Budget</TableCell><TableCell align="right">Committed</TableCell><TableCell align="right">Paid</TableCell><TableCell sx={{ minWidth: 180 }}>Budget usage</TableCell><TableCell align="right">Variance</TableCell><TableCell align="right">Margin</TableCell></TableRow></TableHead>
            <TableBody>
              {m.projects.map((p) => (
                <TableRow key={p.id} hover>
                  <TableCell><Typography fontSize={14} fontWeight={600} component={Link} to={`/events/${p.id}?tab=budget`} sx={{ color: 'inherit', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}>{p.title}</Typography><Typography variant="caption" color="text.secondary">{clientById[p.clientId]?.name}</Typography></TableCell>
                  <TableCell><StatusChip status={p.status} /></TableCell>
                  <TableCell align="right">{fmtINR(p.budget, true)}</TableCell>
                  <TableCell align="right">{fmtINR(p.committed, true)}</TableCell>
                  <TableCell align="right">{fmtINR(p.paid, true)}</TableCell>
                  <TableCell><ProgressBar value={p.usage} height={6} color={p.usage > 100 ? '#dc2626' : p.usage > 90 ? '#d97706' : '#059669'} /><Typography variant="caption" color="text.secondary">{p.usage}%</Typography></TableCell>
                  <TableCell align="right"><Typography fontSize={13.5} fontWeight={700} color={p.variance < 0 ? 'error.main' : 'success.main'}>{p.variance < 0 ? '−' : '+'}{fmtINR(Math.abs(p.variance), true)}</Typography></TableCell>
                  <TableCell align="right"><Chip size="small" label={`${p.margin}%`} color={p.margin < 0 ? 'error' : p.margin < 10 ? 'warning' : 'success'} variant="outlined" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {tab === 'analysis' && (
        <Grid container spacing={2.5}>
          <Grid item xs={12} lg={7}>
            <SectionCard title="Monthly cash out (paid vs. unpaid)">
              <BarChart height={300} dataset={m.cash} xAxis={[{ scaleType: 'band', dataKey: 'month' }]} series={[{ dataKey: 'paid', label: 'Paid', stack: 'a', color: brandPrimary }, { dataKey: 'unpaid', label: 'Unpaid', stack: 'a', color: '#c9a24a' }]} yAxis={[{ valueFormatter: (v) => fmtINR(v, true) }]} margin={{ left: 70, right: 10, top: 30, bottom: 30 }} />
            </SectionCard>
          </Grid>
          <Grid item xs={12} lg={5}>
            <SectionCard title="Spend by category">
              <PieChart height={240} series={[{ data: m.byCat, innerRadius: 50, outerRadius: 95, paddingAngle: 1.5, cornerRadius: 3, valueFormatter: (v) => fmtINR(v.value, true) }]} margin={{ left: 0, right: 0, top: 10, bottom: 10 }} slotProps={{ legend: { hidden: true } }} />
              <Stack gap={0.75}>
                {m.byCat.slice(0, 7).map((c) => (
                  <Box key={c.id}>
                    <Stack direction="row" justifyContent="space-between"><Typography fontSize={13}>{c.label}</Typography><Typography fontSize={13} fontWeight={700}>{fmtINR(c.value, true)} · {pct(c.value, m.totalSpent)}%</Typography></Stack>
                    <LinearProgress variant="determinate" value={pct(c.value, m.byCat[0].value)} sx={{ height: 4, borderRadius: 2, mt: 0.25 }} />
                  </Box>
                ))}
              </Stack>
            </SectionCard>
          </Grid>
        </Grid>
      )}

      <ExpenseDialog open={!!dlg} onClose={() => setDlg(null)} expense={dlg?.id ? dlg : null} />
      <ConfirmDialog open={!!confirm} title="Delete expense?" message={`${confirm?.description} (${fmtINR(confirm?.amount)}) will be removed.`} onCancel={() => setConfirm(null)} onConfirm={() => { dispatch({ type: 'REMOVE', entity: 'expenses', id: confirm.id }); notify('Expense deleted', 'info'); setConfirm(null); }} />
    </Box>
  );
}
