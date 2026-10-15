import React, { useMemo, useState } from 'react';
import { Box, Button, Card, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Grid, IconButton, InputAdornment, MenuItem, Stack, TextField, Typography, Alert } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/AddRounded';
import SearchIcon from '@mui/icons-material/SearchRounded';
import EditIcon from '@mui/icons-material/EditRounded';
import DeleteIcon from '@mui/icons-material/DeleteRounded';
import RemoveIcon from '@mui/icons-material/RemoveRounded';
import { useApp } from '../store/AppContext.jsx';
import { useToast } from '../components/SnackbarProvider.jsx';
import { PageHeader, StatCard, ConfirmDialog } from '../components/common.jsx';
import { fmtINR, sum, TODAY } from '../utils/format';

const CATS = ['Modular System', 'Rigging', 'Lighting', 'Electrical', 'Flooring', 'Furniture', 'Display', 'AV', 'Decor', 'Safety', 'Graphics'];
const blank = { name: '', category: 'Modular System', qty: 0, unit: 'pcs', location: 'Warehouse A – Noida', reorderLevel: 10, condition: 'Good', unitCost: 1000 };

export default function InventoryPage() {
  const { state, dispatch } = useApp();
  const notify = useToast();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');
  const [lowOnly, setLowOnly] = useState(false);
  const [dlg, setDlg] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const rows = useMemo(() => {
    const s = q.toLowerCase();
    return state.inventory.map((i) => ({ ...i, value: i.qty * i.unitCost, low: i.qty <= i.reorderLevel }))
      .filter((i) => (cat === 'All' || i.category === cat) && (!lowOnly || i.low) && (!s || i.name.toLowerCase().includes(s) || i.location.toLowerCase().includes(s)));
  }, [state.inventory, q, cat, lowOnly]);

  const low = state.inventory.filter((i) => i.qty <= i.reorderLevel);
  const adjust = (row, delta) => dispatch({ type: 'UPDATE', entity: 'inventory', id: row.id, patch: { qty: Math.max(0, row.qty + delta), lastAudit: TODAY.format('YYYY-MM-DD') } });

  const columns = [
    { field: 'name', headerName: 'Item', flex: 1.4, minWidth: 220, renderCell: (p) => <Box sx={{ lineHeight: 1.3, py: 0.5 }}><Typography fontWeight={600} fontSize={14}>{p.value}</Typography><Typography variant="caption" color="text.secondary">{p.row.id} · {p.row.location}</Typography></Box> },
    { field: 'category', headerName: 'Category', width: 140, renderCell: (p) => <Chip size="small" variant="outlined" label={p.value} /> },
    { field: 'qty', headerName: 'In stock', width: 170, renderCell: (p) => (
      <Stack direction="row" alignItems="center" gap={0.5}>
        <IconButton size="small" onClick={() => adjust(p.row, -1)}><RemoveIcon fontSize="small" /></IconButton>
        <Typography fontWeight={700} sx={{ minWidth: 56, textAlign: 'center', color: p.row.low ? 'error.main' : 'text.primary' }}>{p.value} {p.row.unit}</Typography>
        <IconButton size="small" onClick={() => adjust(p.row, 1)}><AddIcon fontSize="small" /></IconButton>
      </Stack>
    ) },
    { field: 'reorderLevel', headerName: 'Reorder at', width: 100, type: 'number' },
    { field: 'condition', headerName: 'Condition', width: 120, renderCell: (p) => <Chip size="small" label={p.value} color={p.value === 'Good' ? 'success' : p.value === 'Fair' ? 'warning' : 'error'} variant="outlined" /> },
    { field: 'unitCost', headerName: 'Unit cost', width: 110, type: 'number', valueFormatter: (v) => fmtINR(v) },
    { field: 'value', headerName: 'Stock value', width: 130, type: 'number', valueFormatter: (v) => fmtINR(v, true) },
    { field: 'lastAudit', headerName: 'Last audit', width: 110 },
    { field: 'actions', headerName: '', width: 90, sortable: false, renderCell: (p) => <><IconButton size="small" onClick={() => setDlg(p.row)}><EditIcon fontSize="small" /></IconButton><IconButton size="small" onClick={() => setConfirm(p.row)}><DeleteIcon fontSize="small" /></IconButton></> },
  ];

  const save = () => {
    if (!dlg.name.trim()) return notify('Item name is required', 'error');
    const { value, low, ...item } = dlg;
    const num = { ...item, qty: Number(item.qty), reorderLevel: Number(item.reorderLevel), unitCost: Number(item.unitCost) };
    if (item.id) { dispatch({ type: 'UPDATE', entity: 'inventory', id: item.id, patch: num }); notify('Item updated'); }
    else { dispatch({ type: 'ADD', entity: 'inventory', item: { ...num, lastAudit: TODAY.format('YYYY-MM-DD') } }); notify('Item added'); }
    setDlg(null);
  };

  return (
    <Box>
      <PageHeader title="Inventory" subtitle="Reusable stock across warehouses — system panels, truss, lighting, furniture and AV" actions={<Button variant="contained" startIcon={<AddIcon />} onClick={() => setDlg({ ...blank })}>Add item</Button>} />
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid item xs={12} sm={4}><StatCard title="SKUs tracked" value={state.inventory.length} sub={`${CATS.length} categories`} /></Grid>
        <Grid item xs={12} sm={4}><StatCard title="Stock value" value={fmtINR(sum(state.inventory, (i) => i.qty * i.unitCost), true)} sub="At recorded unit cost" color="secondary" /></Grid>
        <Grid item xs={12} sm={4}><StatCard title="Below reorder level" value={low.length} sub={low.slice(0, 2).map((i) => i.name).join(', ') || 'All stocked'} color={low.length ? 'error' : 'success'} onClick={() => setLowOnly((v) => !v)} /></Grid>
      </Grid>
      {low.length > 0 && !lowOnly && <Alert severity="warning" sx={{ mb: 2.5 }} action={<Button size="small" color="inherit" onClick={() => setLowOnly(true)}>Show</Button>}>{low.length} item{low.length > 1 ? 's are' : ' is'} at or below reorder level.</Alert>}
      <Card>
        <Stack direction={{ xs: 'column', md: 'row' }} gap={1.5} sx={{ p: 1.5 }} alignItems={{ md: 'center' }}>
          <TextField placeholder="Search items…" value={q} onChange={(e) => setQ(e.target.value)} sx={{ minWidth: 240, flex: 1 }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} />
          <TextField select label="Category" value={cat} onChange={(e) => setCat(e.target.value)} sx={{ minWidth: 170 }}><MenuItem value="All">All</MenuItem>{CATS.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}</TextField>
          <Chip label="Low stock only" onClick={() => setLowOnly((v) => !v)} color={lowOnly ? 'error' : 'default'} variant={lowOnly ? 'filled' : 'outlined'} />
        </Stack>
        <DataGrid rows={rows} columns={columns} autoHeight rowHeight={56} disableRowSelectionOnClick initialState={{ pagination: { paginationModel: { pageSize: 15 } } }} pageSizeOptions={[15, 30]} getRowClassName={(p) => (p.row.low ? 'low' : '')}
          sx={{ border: 0, '& .MuiDataGrid-cell': { display: 'flex', alignItems: 'center' }, '& .low': { bgcolor: 'rgba(220,38,38,0.04)' } }} />
      </Card>
      <Dialog open={!!dlg} onClose={() => setDlg(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{dlg?.id ? 'Edit item' : 'Add item'}</DialogTitle>
        <DialogContent>
          {dlg && (
            <Grid container spacing={2} sx={{ mt: 0 }}>
              <Grid item xs={12}><TextField label="Item name" value={dlg.name} onChange={(e) => setDlg({ ...dlg, name: e.target.value })} fullWidth /></Grid>
              <Grid item xs={6}><TextField select label="Category" value={dlg.category} onChange={(e) => setDlg({ ...dlg, category: e.target.value })} fullWidth>{CATS.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}</TextField></Grid>
              <Grid item xs={6}><TextField select label="Condition" value={dlg.condition} onChange={(e) => setDlg({ ...dlg, condition: e.target.value })} fullWidth>{['Good', 'Fair', 'Needs Repair'].map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}</TextField></Grid>
              {[['qty', 'Quantity', 4], ['unit', 'Unit', 4], ['reorderLevel', 'Reorder level', 4], ['unitCost', 'Unit cost (₹)', 6], ['location', 'Location', 6]].map(([k, l, w]) => (
                <Grid item xs={w} key={k}><TextField label={l} value={dlg[k] ?? ''} onChange={(e) => setDlg({ ...dlg, [k]: e.target.value })} fullWidth /></Grid>
              ))}
            </Grid>
          )}
        </DialogContent>
        <DialogActions><Button onClick={() => setDlg(null)}>Cancel</Button><Button variant="contained" onClick={save}>Save</Button></DialogActions>
      </Dialog>
      <ConfirmDialog open={!!confirm} title="Remove item?" message={`${confirm?.name} will be removed from inventory.`} onCancel={() => setConfirm(null)} onConfirm={() => { dispatch({ type: 'REMOVE', entity: 'inventory', id: confirm.id }); notify('Item removed', 'info'); setConfirm(null); }} />
    </Box>
  );
}
