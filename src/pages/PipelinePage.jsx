import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Card, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Grid, IconButton, MenuItem, Stack, TextField, Typography, alpha } from '@mui/material';
import AddIcon from '@mui/icons-material/AddRounded';
import EditIcon from '@mui/icons-material/EditRounded';
import DeleteIcon from '@mui/icons-material/DeleteRounded';
import ArrowForwardIcon from '@mui/icons-material/ArrowForwardRounded';
import { useApp } from '../store/AppContext.jsx';
import { useToast } from '../components/SnackbarProvider.jsx';
import { PageHeader, StatCard, PersonAvatar } from '../components/common.jsx';
import { fmtINR, fmtDate, sum, TODAY } from '../utils/format';

const STAGES = [
  { key: 'New', color: '#6b7280', p: 10 }, { key: 'Qualified', color: '#2563eb', p: 30 }, { key: 'Proposal Sent', color: '#7c3aed', p: 50 },
  { key: 'Negotiation', color: '#d97706', p: 70 }, { key: 'Won', color: '#059669', p: 100 }, { key: 'Lost', color: '#b91c1c', p: 0 },
];
const blank = { company: '', exhibition: '', stallSizeSqm: 100, stage: 'New', estimatedValue: 950000, ownerId: 'TM-014', expectedClose: TODAY.add(30, 'day').format('YYYY-MM-DD'), contact: 'Brand Manager' };

export default function PipelinePage() {
  const { state, dispatch, teamById } = useApp();
  const notify = useToast();
  const navigate = useNavigate();
  const [dlg, setDlg] = useState(null);
  const [dragging, setDragging] = useState(null);

  const openLeads = state.leads.filter((l) => !['Won', 'Lost'].includes(l.stage));
  const weighted = sum(openLeads, (l) => (l.estimatedValue * l.probability) / 100);

  const move = (lead, stage) => {
    const p = STAGES.find((s) => s.key === stage).p;
    dispatch({ type: 'UPDATE', entity: 'leads', id: lead.id, patch: { stage, probability: p } });
    notify(`${lead.company} → ${stage}`, 'info');
  };
  const convert = (lead) => {
    const client = state.clients.find((c) => c.name.toLowerCase() === lead.company.toLowerCase());
    const clientId = client ? client.id : null;
    if (!clientId) dispatch({ type: 'ADD', entity: 'clients', item: { name: lead.company, industry: 'New account', contactPerson: lead.contact, email: '', phone: '', city: '', color: '#1f6f5c', since: 2026, tier: 'Standard', gstin: '', notes: `Converted from lead ${lead.id}` } });
    notify(`${lead.company} converted – set up the project now`);
    navigate('/events/new');
  };
  const save = () => {
    if (!dlg.company.trim()) return notify('Company is required', 'error');
    const p = STAGES.find((s) => s.key === dlg.stage).p;
    const item = { ...dlg, stallSizeSqm: Number(dlg.stallSizeSqm), estimatedValue: Number(dlg.estimatedValue), probability: p };
    if (dlg.id) { dispatch({ type: 'UPDATE', entity: 'leads', id: dlg.id, patch: item }); notify('Lead updated'); }
    else { dispatch({ type: 'ADD', entity: 'leads', item }); notify('Lead added'); }
    setDlg(null);
  };

  return (
    <Box>
      <PageHeader title="Sales pipeline" subtitle="Enquiries and proposals before they become projects. Drag cards to change stage." actions={<Button variant="contained" startIcon={<AddIcon />} onClick={() => setDlg({ ...blank })}>New lead</Button>} />
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid item xs={6} md={3}><StatCard title="Open leads" value={openLeads.length} sub={`${sum(openLeads, 'stallSizeSqm').toLocaleString('en-IN')} m² potential`} /></Grid>
        <Grid item xs={6} md={3}><StatCard title="Pipeline value" value={fmtINR(sum(openLeads, 'estimatedValue'), true)} sub="Unweighted" color="secondary" /></Grid>
        <Grid item xs={6} md={3}><StatCard title="Weighted forecast" value={fmtINR(weighted, true)} sub="Value × probability" color="info" /></Grid>
        <Grid item xs={6} md={3}><StatCard title="Win rate" value={`${Math.round((state.leads.filter((l) => l.stage === 'Won').length / Math.max(1, state.leads.filter((l) => ['Won', 'Lost'].includes(l.stage)).length)) * 100)}%`} sub={`${state.leads.filter((l) => l.stage === 'Won').length} won · ${state.leads.filter((l) => l.stage === 'Lost').length} lost`} color="success" /></Grid>
      </Grid>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))', xl: 'repeat(6, minmax(0, 1fr))' }, gap: 2, alignItems: 'start' }}>
        {STAGES.map((s) => {
          const items = state.leads.filter((l) => l.stage === s.key);
          return (
            <Box key={s.key} onDragOver={(e) => e.preventDefault()} onDrop={() => { if (dragging) move(dragging, s.key); setDragging(null); }}
              sx={{ minWidth: 0, borderRadius: 3, p: 1.25, bgcolor: (t) => alpha(t.palette.text.primary, 0.035), minHeight: 240, borderTop: `4px solid ${s.color}` }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1, px: 0.5 }}>
                <Typography fontWeight={700} fontSize={14}>{s.key}</Typography>
                <Typography variant="caption" color="text.secondary">{items.length} · {fmtINR(sum(items, 'estimatedValue'), true)}</Typography>
              </Stack>
              <Stack gap={1.25}>
                {items.map((l) => (
                  <Card key={l.id} draggable onDragStart={() => setDragging(l)} sx={{ p: 1.5, cursor: 'grab' }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Typography fontWeight={700} fontSize={14}>{l.company}</Typography>
                      <Stack direction="row"><IconButton size="small" onClick={() => setDlg(l)}><EditIcon sx={{ fontSize: 15 }} /></IconButton><IconButton size="small" onClick={() => { dispatch({ type: 'REMOVE', entity: 'leads', id: l.id }); notify('Lead removed', 'info'); }}><DeleteIcon sx={{ fontSize: 15 }} /></IconButton></Stack>
                    </Stack>
                    <Typography variant="caption" color="text.secondary" display="block">{l.exhibition}</Typography>
                    <Stack direction="row" gap={0.5} sx={{ mt: 1 }} flexWrap="wrap">
                      <Chip size="small" label={`${l.stallSizeSqm} m²`} sx={{ height: 20, fontSize: 11 }} />
                      <Chip size="small" label={fmtINR(l.estimatedValue, true)} color="secondary" sx={{ height: 20, fontSize: 11 }} />
                      <Chip size="small" label={`${l.probability}%`} variant="outlined" sx={{ height: 20, fontSize: 11 }} />
                    </Stack>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1.25 }}>
                      <Stack direction="row" gap={0.75} alignItems="center"><PersonAvatar person={teamById[l.ownerId]} size={22} /><Typography variant="caption" color="text.secondary">{fmtDate(l.expectedClose, 'DD MMM')}</Typography></Stack>
                      {s.key === 'Won' && <Button size="small" endIcon={<ArrowForwardIcon />} onClick={() => convert(l)} sx={{ fontSize: 11, py: 0 }}>Project</Button>}
                    </Stack>
                  </Card>
                ))}
              </Stack>
            </Box>
          );
        })}
      </Box>
      <Dialog open={!!dlg} onClose={() => setDlg(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{dlg?.id ? 'Edit lead' : 'New lead'}</DialogTitle>
        <DialogContent>
          {dlg && (
            <Grid container spacing={2} sx={{ mt: 0 }}>
              <Grid item xs={12} sm={6}><TextField label="Company" value={dlg.company} onChange={(e) => setDlg({ ...dlg, company: e.target.value })} fullWidth /></Grid>
              <Grid item xs={12} sm={6}><TextField label="Exhibition" value={dlg.exhibition} onChange={(e) => setDlg({ ...dlg, exhibition: e.target.value })} fullWidth /></Grid>
              <Grid item xs={6} sm={4}><TextField label="Stall size (m²)" type="number" value={dlg.stallSizeSqm} onChange={(e) => setDlg({ ...dlg, stallSizeSqm: e.target.value })} fullWidth /></Grid>
              <Grid item xs={6} sm={4}><TextField label="Est. value (₹)" type="number" value={dlg.estimatedValue} onChange={(e) => setDlg({ ...dlg, estimatedValue: e.target.value })} fullWidth /></Grid>
              <Grid item xs={12} sm={4}><TextField select label="Stage" value={dlg.stage} onChange={(e) => setDlg({ ...dlg, stage: e.target.value })} fullWidth>{STAGES.map((s) => <MenuItem key={s.key} value={s.key}>{s.key}</MenuItem>)}</TextField></Grid>
              <Grid item xs={12} sm={6}><TextField select label="Owner" value={dlg.ownerId} onChange={(e) => setDlg({ ...dlg, ownerId: e.target.value })} fullWidth>{state.team.map((t) => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}</TextField></Grid>
              <Grid item xs={6} sm={3}><TextField label="Expected close" type="date" value={dlg.expectedClose} onChange={(e) => setDlg({ ...dlg, expectedClose: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} /></Grid>
              <Grid item xs={6} sm={3}><TextField label="Contact role" value={dlg.contact} onChange={(e) => setDlg({ ...dlg, contact: e.target.value })} fullWidth /></Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions><Button onClick={() => setDlg(null)}>Cancel</Button><Button variant="contained" onClick={save}>Save</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
