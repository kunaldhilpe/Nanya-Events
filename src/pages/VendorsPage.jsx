import React, { useMemo, useState } from 'react';
import { Box, Button, Card, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Grid, IconButton, InputAdornment, MenuItem, Rating, Stack, TextField, Typography, Tabs, Tab } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/AddRounded';
import SearchIcon from '@mui/icons-material/SearchRounded';
import EditIcon from '@mui/icons-material/EditRounded';
import DeleteIcon from '@mui/icons-material/DeleteRounded';
import { useApp } from '../store/AppContext.jsx';
import { useToast } from '../components/SnackbarProvider.jsx';
import { PageHeader, ConfirmDialog, StatCard } from '../components/common.jsx';
import { fmtINR, sum } from '../utils/format';

const CATS = ['Fabrication', 'Electrical', 'Audio Visual', 'Printing & Graphics', 'Furniture & Decor', 'Logistics', 'Flooring & Carpet', 'Rigging & Truss', 'Landscaping', 'Hostess & Manpower', 'Catering', 'Security'];
const blank = { name: '', category: 'Fabrication', contactPerson: '', phone: '', email: '', city: '', rating: 4, jobsCompleted: 0, paymentTerms: 'Net 30', gstRegistered: true, status: 'Active' };

export default function VendorsPage() {
  const { state, dispatch } = useApp();
  const notify = useToast();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');
  const [dlg, setDlg] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const rows = useMemo(() => {
    const s = q.toLowerCase();
    return state.vendors
      .map((v) => {
        const xs = state.expenses.filter((x) => x.vendorId === v.id);
        return { ...v, billed: sum(xs, 'amount'), pending: sum(xs.filter((x) => x.status !== 'Paid'), 'amount'), projects: new Set(state.events.filter((e) => e.vendorIds.includes(v.id)).map((e) => e.id)).size };
      })
      .filter((v) => (cat === 'All' || v.category === cat) && (!s || v.name.toLowerCase().includes(s) || v.contactPerson.toLowerCase().includes(s) || v.city.toLowerCase().includes(s)));
  }, [state.vendors, state.expenses, state.events, q, cat]);

  const columns = [
    { field: 'name', headerName: 'Vendor', flex: 1.4, minWidth: 200, renderCell: (p) => <Box sx={{ lineHeight: 1.3, py: 0.5 }}><Typography fontWeight={600} fontSize={14}>{p.value}</Typography><Typography variant="caption" color="text.secondary">{p.row.city} · {p.row.paymentTerms}</Typography></Box> },
    { field: 'category', headerName: 'Category', width: 160, renderCell: (p) => <Chip size="small" variant="outlined" label={p.value} /> },
    { field: 'contactPerson', headerName: 'Contact', width: 170, renderCell: (p) => <Box sx={{ lineHeight: 1.3 }}><Typography fontSize={13}>{p.value}</Typography><Typography variant="caption" color="text.secondary">{p.row.phone}</Typography></Box> },
    { field: 'rating', headerName: 'Rating', width: 130, renderCell: (p) => <Rating value={p.value} precision={0.1} size="small" readOnly /> },
    { field: 'jobsCompleted', headerName: 'Jobs', width: 70, type: 'number' },
    { field: 'projects', headerName: 'Active on', width: 90, type: 'number' },
    { field: 'billed', headerName: 'Billed', width: 110, type: 'number', valueFormatter: (v) => fmtINR(v, true) },
    { field: 'pending', headerName: 'Pending', width: 110, type: 'number', valueFormatter: (v) => fmtINR(v, true), cellClassName: (p) => (p.value > 0 ? 'pending' : '') },
    { field: 'status', headerName: 'Status', width: 110, renderCell: (p) => <Chip size="small" label={p.value} color={p.value === 'Preferred' ? 'secondary' : p.value === 'On Hold' ? 'warning' : 'success'} variant={p.value === 'Preferred' ? 'filled' : 'outlined'} /> },
    { field: 'actions', headerName: '', width: 90, sortable: false, renderCell: (p) => <><IconButton size="small" onClick={() => setDlg(p.row)}><EditIcon fontSize="small" /></IconButton><IconButton size="small" onClick={() => setConfirm(p.row)}><DeleteIcon fontSize="small" /></IconButton></> },
  ];

  const save = () => {
    if (!dlg.name.trim()) return notify('Vendor name is required', 'error');
    const { billed, pending, projects, ...item } = dlg;
    if (item.id) { dispatch({ type: 'UPDATE', entity: 'vendors', id: item.id, patch: { ...item, rating: Number(item.rating) } }); notify('Vendor updated'); }
    else { dispatch({ type: 'ADD', entity: 'vendors', item: { ...item, rating: Number(item.rating), jobsCompleted: Number(item.jobsCompleted) } }); notify('Vendor added'); }
    setDlg(null);
  };

  return (
    <Box>
      <PageHeader title="Vendors" subtitle={`${state.vendors.length} partners across ${CATS.length} categories`} actions={<Button variant="contained" startIcon={<AddIcon />} onClick={() => setDlg({ ...blank })}>Add vendor</Button>} />
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid item xs={12} sm={4}><StatCard title="Preferred vendors" value={state.vendors.filter((v) => v.status === 'Preferred').length} sub="Go-to partners for flagship builds" /></Grid>
        <Grid item xs={12} sm={4}><StatCard title="Total billed" value={fmtINR(sum(rows, 'billed'), true)} sub="Across all recorded expenses" color="secondary" /></Grid>
        <Grid item xs={12} sm={4}><StatCard title="Pending payouts" value={fmtINR(sum(rows, 'pending'), true)} sub={`${rows.filter((v) => v.pending > 0).length} vendors awaiting payment`} color="warning" /></Grid>
      </Grid>
      <Card>
        <Stack direction={{ xs: 'column', md: 'row' }} gap={1.5} sx={{ p: 1.5 }} alignItems={{ md: 'center' }}>
          <TextField placeholder="Search vendors…" value={q} onChange={(e) => setQ(e.target.value)} sx={{ minWidth: 240 }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} />
          <Tabs value={cat} onChange={(e, v) => setCat(v)} variant="scrollable" scrollButtons="auto" sx={{ minHeight: 36, '& .MuiTab-root': { minHeight: 36, py: 0 } }}>
            <Tab value="All" label="All" />
            {CATS.map((c) => <Tab key={c} value={c} label={c} />)}
          </Tabs>
        </Stack>
        <DataGrid rows={rows} columns={columns} autoHeight rowHeight={56} disableRowSelectionOnClick initialState={{ pagination: { paginationModel: { pageSize: 15 } } }} pageSizeOptions={[15, 30, 50]}
          sx={{ border: 0, '& .MuiDataGrid-cell': { display: 'flex', alignItems: 'center' }, '& .pending': { color: 'warning.main', fontWeight: 700 } }} />
      </Card>

      <Dialog open={!!dlg} onClose={() => setDlg(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{dlg?.id ? 'Edit vendor' : 'Add vendor'}</DialogTitle>
        <DialogContent>
          {dlg && (
            <Grid container spacing={2} sx={{ mt: 0 }}>
              <Grid item xs={12}><TextField label="Vendor name" value={dlg.name} onChange={(e) => setDlg({ ...dlg, name: e.target.value })} fullWidth /></Grid>
              <Grid item xs={6}><TextField select label="Category" value={dlg.category} onChange={(e) => setDlg({ ...dlg, category: e.target.value })} fullWidth>{CATS.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}</TextField></Grid>
              <Grid item xs={6}><TextField select label="Status" value={dlg.status} onChange={(e) => setDlg({ ...dlg, status: e.target.value })} fullWidth>{['Active', 'Preferred', 'On Hold'].map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}</TextField></Grid>
              {[['contactPerson', 'Contact person', 6], ['phone', 'Phone', 6], ['email', 'Email', 6], ['city', 'City', 6], ['paymentTerms', 'Payment terms', 8], ['rating', 'Rating (1–5)', 4]].map(([k, l, w]) => (
                <Grid item xs={w} key={k}><TextField label={l} value={dlg[k] ?? ''} onChange={(e) => setDlg({ ...dlg, [k]: e.target.value })} fullWidth /></Grid>
              ))}
            </Grid>
          )}
        </DialogContent>
        <DialogActions><Button onClick={() => setDlg(null)}>Cancel</Button><Button variant="contained" onClick={save}>Save</Button></DialogActions>
      </Dialog>
      <ConfirmDialog open={!!confirm} title="Remove vendor?" message={`${confirm?.name} will be removed from the directory.`} onCancel={() => setConfirm(null)} onConfirm={() => { dispatch({ type: 'REMOVE', entity: 'vendors', id: confirm.id }); notify('Vendor removed', 'info'); setConfirm(null); }} />
    </Box>
  );
}
