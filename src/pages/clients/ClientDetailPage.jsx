import React, { useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Avatar, Box, Button, Card, CardContent, Chip, Divider, Grid, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography, MenuItem } from '@mui/material';
import { BarChart } from '@mui/x-charts';
import AddIcon from '@mui/icons-material/AddRounded';
import EditIcon from '@mui/icons-material/EditRounded';
import DeleteIcon from '@mui/icons-material/DeleteRounded';
import { useTheme } from '@mui/material/styles';
import { useApp } from '../../store/AppContext.jsx';
import { useToast } from '../../components/SnackbarProvider.jsx';
import { PageHeader, StatusChip, KeyValue, SectionCard, ConfirmDialog, EmptyState } from '../../components/common.jsx';
import { fmtINR, fmtRange, sum, initials, groupBy } from '../../utils/format';

export default function ClientDetailPage() {
  const brandPrimary = useTheme().palette.primary.main;
  const { id } = useParams();
  const navigate = useNavigate();
  const notify = useToast();
  const { state, dispatch, venueById } = useApp();
  const client = state.clients.find((c) => c.id === id);
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState(client || {});
  const [confirm, setConfirm] = useState(false);

  const events = useMemo(() => state.events.filter((e) => e.clientId === id).sort((a, b) => b.startDate.localeCompare(a.startDate)), [state.events, id]);
  if (!client) return <EmptyState icon="🏢" title="Client not found" message="" action={<Button component={Link} to="/clients">Back to clients</Button>} />;

  const byYear = Object.entries(groupBy(events, (e) => e.startDate.slice(0, 4))).sort().map(([y, arr]) => ({ year: y, value: sum(arr, 'budget'), sqm: sum(arr, 'stallSizeSqm') }));
  const save = () => { dispatch({ type: 'UPDATE', entity: 'clients', id, patch: form }); notify('Client updated'); setEdit(false); };

  return (
    <Box>
      <PageHeader
        title={client.name}
        subtitle={`${client.industry} · ${client.city} · Client since ${client.since}`}
        crumbs={[{ label: 'Clients', to: '/clients' }, { label: client.name }]}
        actions={
          <>
            <Button variant="outlined" startIcon={<EditIcon />} onClick={() => { setForm(client); setEdit((v) => !v); }}>{edit ? 'Cancel' : 'Edit'}</Button>
            <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={() => setConfirm(true)} disabled={events.length > 0}>Delete</Button>
            <Button variant="contained" startIcon={<AddIcon />} component={Link} to="/events/new">New project</Button>
          </>
        }
      />
      <Grid container spacing={2.5}>
        <Grid item xs={12} md={4}>
          <Stack gap={2.5}>
            <Card>
              <CardContent>
                <Stack direction="row" gap={2} alignItems="center" sx={{ mb: 2 }}>
                  <Avatar sx={{ bgcolor: client.color, width: 64, height: 64, fontSize: 22, fontWeight: 700 }}>{initials(client.name)}</Avatar>
                  <Box><Chip size="small" label={client.tier} color={client.tier === 'Key Account' ? 'secondary' : 'default'} /><Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>{client.id}</Typography></Box>
                </Stack>
                {edit ? (
                  <Stack gap={1.5}>
                    {[['contactPerson', 'Contact person'], ['email', 'Email'], ['phone', 'Phone'], ['city', 'City'], ['industry', 'Industry'], ['gstin', 'GSTIN']].map(([k, l]) => (
                      <TextField key={k} label={l} value={form[k] || ''} onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))} fullWidth />
                    ))}
                    <TextField select label="Tier" value={form.tier} onChange={(e) => setForm((f) => ({ ...f, tier: e.target.value }))} fullWidth>{['Key Account', 'Growth', 'Standard'].map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}</TextField>
                    <TextField label="Notes" value={form.notes || ''} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} fullWidth multiline minRows={2} />
                    <Button variant="contained" onClick={save}>Save</Button>
                  </Stack>
                ) : (
                  <Stack gap={1.5}>
                    <KeyValue label="Primary contact" value={client.contactPerson} />
                    <KeyValue label="Email" value={client.email} />
                    <KeyValue label="Phone" value={client.phone} />
                    <KeyValue label="GSTIN" value={client.gstin} />
                    <Divider />
                    <KeyValue label="Account notes" value={client.notes} />
                  </Stack>
                )}
              </CardContent>
            </Card>
            <Card><CardContent>
              <Grid container spacing={2}>
                {[['Projects', events.length], ['Lifetime value', fmtINR(sum(events, 'budget'), true)], ['Total sqm', sum(events, 'stallSizeSqm').toLocaleString('en-IN')], ['Avg. stall', `${Math.round(sum(events, 'stallSizeSqm') / (events.length || 1))} m²`]].map(([l, v]) => (
                  <Grid item xs={6} key={l}><Typography variant="caption" color="text.secondary">{l}</Typography><Typography variant="h6">{v}</Typography></Grid>
                ))}
              </Grid>
            </CardContent></Card>
          </Stack>
        </Grid>
        <Grid item xs={12} md={8}>
          <Stack gap={2.5}>
            <SectionCard title="Project value by year">
              {byYear.length ? (
                <BarChart height={220} dataset={byYear} xAxis={[{ scaleType: 'band', dataKey: 'year' }]} series={[{ dataKey: 'value', label: 'Value', color: brandPrimary, valueFormatter: (v) => fmtINR(v, true) }]} yAxis={[{ valueFormatter: (v) => fmtINR(v, true) }]} margin={{ left: 70, right: 10, top: 10, bottom: 30 }} slotProps={{ legend: { hidden: true } }} />
              ) : <Typography color="text.secondary">No projects yet.</Typography>}
            </SectionCard>
            <SectionCard title="Project history" noPadding>
              <Table size="small">
                <TableHead><TableRow><TableCell>Project</TableCell><TableCell>Venue</TableCell><TableCell>Dates</TableCell><TableCell align="right">Sqm</TableCell><TableCell align="right">Budget</TableCell><TableCell>Status</TableCell></TableRow></TableHead>
                <TableBody>
                  {events.map((e) => (
                    <TableRow key={e.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/events/${e.id}`)}>
                      <TableCell><Typography fontWeight={600} fontSize={14}>{e.title}</Typography><Typography variant="caption" color="text.secondary">{e.exhibition}</Typography></TableCell>
                      <TableCell><Typography fontSize={13}>{venueById[e.venueId]?.name}</Typography></TableCell>
                      <TableCell><Typography fontSize={13}>{fmtRange(e.startDate, e.endDate)}</Typography></TableCell>
                      <TableCell align="right">{e.stallSizeSqm}</TableCell>
                      <TableCell align="right">{fmtINR(e.budget, true)}</TableCell>
                      <TableCell><StatusChip status={e.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </SectionCard>
          </Stack>
        </Grid>
      </Grid>
      <ConfirmDialog open={confirm} title="Delete client?" message="This client has no projects and will be removed." onCancel={() => setConfirm(false)} onConfirm={() => { dispatch({ type: 'REMOVE', entity: 'clients', id }); navigate('/clients'); notify('Client deleted', 'info'); }} />
    </Box>
  );
}
