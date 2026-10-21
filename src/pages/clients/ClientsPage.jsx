import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Grid, InputAdornment, MenuItem, Stack, TextField, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/AddRounded';
import SearchIcon from '@mui/icons-material/SearchRounded';
import { useApp } from '../../store/AppContext.jsx';
import { useToast } from '../../components/SnackbarProvider.jsx';
import { PageHeader } from '../../components/common.jsx';
import { fmtINR, sum, initials } from '../../utils/format';

const blank = { name: '', industry: '', contactPerson: '', email: '', phone: '', city: '', color: '#0b2e24', since: 2026, tier: 'Standard', gstin: '', notes: '' };

export default function ClientsPage() {
  const { state, dispatch } = useApp();
  const notify = useToast();
  const [q, setQ] = useState('');
  const [tier, setTier] = useState('All');
  const [sort, setSort] = useState('value');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blank);

  const rows = useMemo(() => {
    const s = q.toLowerCase();
    return state.clients
      .map((c) => {
        const evs = state.events.filter((e) => e.clientId === c.id);
        return { ...c, projects: evs.length, active: evs.filter((e) => !['Completed', 'Cancelled'].includes(e.status)).length, value: sum(evs, 'budget'), sqm: sum(evs, 'stallSizeSqm') };
      })
      .filter((c) => (tier === 'All' || c.tier === tier) && (!s || c.name.toLowerCase().includes(s) || c.industry.toLowerCase().includes(s) || c.city.toLowerCase().includes(s)))
      .sort((a, b) => (sort === 'value' ? b.value - a.value : sort === 'projects' ? b.projects - a.projects : a.name.localeCompare(b.name)));
  }, [state.clients, state.events, q, tier, sort]);

  const save = () => {
    if (!form.name.trim()) return notify('Client name is required', 'error');
    dispatch({ type: 'ADD', entity: 'clients', item: { ...form, since: Number(form.since) } });
    notify('Client added');
    setOpen(false); setForm(blank);
  };

  return (
    <Box>
      <PageHeader title="Clients" subtitle={`${state.clients.length} accounts · ${fmtINR(sum(rows, 'value'), true)} lifetime project value`} 
      // actions={<Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>Add client</Button>}
       />
      <Card sx={{ p: 1.5, mb: 2.5 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} gap={1.5}>
          <TextField placeholder="Search clients…" value={q} onChange={(e) => setQ(e.target.value)} sx={{ flex: 1 }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} />
          <TextField select label="Tier" value={tier} onChange={(e) => setTier(e.target.value)} sx={{ minWidth: 150 }}>
            {['All', 'Key Account', 'Growth', 'Standard'].map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </TextField>
          <TextField select label="Sort by" value={sort} onChange={(e) => setSort(e.target.value)} sx={{ minWidth: 150 }}>
            <MenuItem value="value">Project value</MenuItem><MenuItem value="projects">No. of projects</MenuItem><MenuItem value="name">Name</MenuItem>
          </TextField>
        </Stack>
      </Card>
      <Grid container spacing={2.5}>
        {rows.map((c) => (
          <Grid item xs={12} sm={6} lg={4} xl={3} key={c.id}>
            <Card component={Link} to={`/clients/${c.id}`} sx={{ display: 'block', textDecoration: 'none', color: 'inherit', height: '100%', '&:hover': { boxShadow: 5, transform: 'translateY(-2px)' } }}>
              <CardContent>
                <Stack direction="row" gap={1.5} alignItems="center">
                  <Avatar sx={{ bgcolor: c.color, width: 48, height: 48, fontWeight: 700 }}>{initials(c.name)}</Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography fontWeight={700} noWrap>{c.name}</Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>{c.industry} · {c.city}</Typography>
                  </Box>
                </Stack>
                <Stack direction="row" gap={0.75} sx={{ mt: 1.5 }}>
                  <Chip size="small" label={c.tier} color={c.tier === 'Key Account' ? 'secondary' : 'default'} />
                  <Chip size="small" variant="outlined" label={`Since ${c.since}`} />
                </Stack>
                <Grid container sx={{ mt: 1.5 }}>
                  {[['Projects', c.projects], ['Active', c.active], ['Value', fmtINR(c.value, true)], ['Sqm', c.sqm.toLocaleString('en-IN')]].map(([l, v]) => (
                    <Grid item xs={3} key={l}><Typography variant="caption" color="text.secondary">{l}</Typography><Typography fontWeight={700} fontSize={14}>{v}</Typography></Grid>
                  ))}
                </Grid>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>{c.contactPerson} · {c.phone}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add client</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            {[['name', 'Company name', 12], ['industry', 'Industry', 6], ['city', 'City', 6], ['contactPerson', 'Contact person', 6], ['phone', 'Phone', 6], ['email', 'Email', 12], ['gstin', 'GSTIN', 6], ['since', 'Client since (year)', 6]].map(([k, l, w]) => (
              <Grid item xs={12} sm={w} key={k}><TextField label={l} value={form[k]} onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))} fullWidth /></Grid>
            ))}
            <Grid item xs={6}><TextField select label="Tier" value={form.tier} onChange={(e) => setForm((f) => ({ ...f, tier: e.target.value }))} fullWidth>{['Key Account', 'Growth', 'Standard'].map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}</TextField></Grid>
            <Grid item xs={6}><TextField label="Brand colour" type="color" value={form.color} onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))} fullWidth /></Grid>
            <Grid item xs={12}><TextField label="Notes" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} fullWidth multiline minRows={2} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions><Button onClick={() => setOpen(false)}>Cancel</Button><Button variant="contained" onClick={save}>Add</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
