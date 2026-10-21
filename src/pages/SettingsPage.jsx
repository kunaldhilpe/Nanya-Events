import React, { useRef, useState } from 'react';
import { Alert, Box, Button, Card, CardContent, Divider, FormControlLabel, Grid, MenuItem, Stack, Switch, TextField, Typography, Chip } from '@mui/material';
import DownloadIcon from '@mui/icons-material/DownloadRounded';
import UploadIcon from '@mui/icons-material/UploadRounded';
import RestartAltIcon from '@mui/icons-material/RestartAltRounded';
import { useApp, seedState } from '../store/AppContext.jsx';
import { useToast } from '../components/SnackbarProvider.jsx';
import { PageHeader, SectionCard, ConfirmDialog } from '../components/common.jsx';
import { downloadJSON, TODAY } from '../utils/format';

export default function SettingsPage() {
  const { state, dispatch } = useApp();
  const notify = useToast();
  const [confirm, setConfirm] = useState(false);
  const fileRef = useRef();
  const s = state.settings;
  const set = (key) => (e) => dispatch({ type: 'SET_SETTING', key, value: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const exportAll = () => downloadJSON(`nanya-backup-${TODAY.format('YYYY-MM-DD')}.json`, { clients: state.clients, venues: state.venues, vendors: state.vendors, team: state.team, events: state.events, tasks: state.tasks, expenses: state.expenses, inventory: state.inventory, leads: state.leads });
  const importAll = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        const entities = ['clients', 'venues', 'vendors', 'team', 'events', 'tasks', 'expenses', 'inventory', 'leads'];
        const found = entities.filter((k) => Array.isArray(data[k]));
        if (!found.length) throw new Error('No recognised collections in file');
        found.forEach((k) => {
          // replace collection wholesale: remove existing then add
          state[k].forEach((x) => dispatch({ type: 'REMOVE', entity: k, id: x.id }));
          [...data[k]].reverse().forEach((x) => dispatch({ type: 'ADD', entity: k, item: x }));
        });
        notify(`Imported ${found.join(', ')}`);
      } catch (err) {
        notify(`Import failed: ${err.message}`, 'error');
      }
    };
    reader.readAsText(f);
    e.target.value = '';
  };

  const counts = [['Events', state.events.length], ['Tasks', state.tasks.length], ['Expenses', state.expenses.length], ['Clients', state.clients.length], ['Venues', state.venues.length], ['Vendors', state.vendors.length], ['Team', state.team.length], ['Inventory', state.inventory.length], ['Leads', state.leads.length]];

  return (
    <Box>
      <PageHeader title="Settings" subtitle="Workspace preferences and data management" />
      <Grid container spacing={2.5}>
        <Grid item xs={12} md={6}>
          <SectionCard title="Appearance & workspace">
            <Stack gap={2}>
              <TextField label="Company name" value={s.companyName} onChange={set('companyName')} fullWidth />
              <TextField select label="Theme" value={s.themeMode} onChange={set('themeMode')} fullWidth><MenuItem value="light">Light</MenuItem><MenuItem value="dark">Dark</MenuItem></TextField>
              <TextField select label="Currency display" value={s.currency} onChange={set('currency')} fullWidth><MenuItem value="INR">Indian Rupee (₹)</MenuItem></TextField>
              <FormControlLabel control={<Switch checked={s.sidebarCollapsed} onChange={set('sidebarCollapsed')} />} label="Collapse sidebar by default" />
              <FormControlLabel control={<Switch checked={s.notificationsEnabled} onChange={set('notificationsEnabled')} />} label="Show activity notifications" />
            </Stack>
          </SectionCard>
        </Grid>
        <Grid item xs={12} md={6}>
          <Stack gap={2.5}>
            <SectionCard title="Signed in as">
              <Typography fontWeight={700}>{state.auth.user?.name}</Typography>
              <Typography color="text.secondary" variant="body2">{state.auth.user?.role} · {state.auth.user?.email}</Typography>
            </SectionCard>
            <SectionCard title="Data">
              <Alert severity="info" sx={{ mb: 2 }}>This is a frontend-only app. All changes are stored in your browser's localStorage under one key. Export a backup before clearing browser data.</Alert>
              <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mb: 2 }}>
                {counts.map(([l, v]) => <Chip key={l} label={`${l}: ${v}`} size="small" variant="outlined" />)}
              </Stack>
              <Divider sx={{ mb: 2 }} />
              <Stack direction="row" gap={1} flexWrap="wrap">
                <Button variant="outlined" startIcon={<DownloadIcon />} onClick={exportAll}>Export backup (JSON)</Button>
                <Button variant="outlined" startIcon={<UploadIcon />} onClick={() => fileRef.current.click()}>Import JSON</Button>
                <input ref={fileRef} type="file" accept="application/json" hidden onChange={importAll} />
                <Button variant="outlined" color="error" startIcon={<RestartAltIcon />} onClick={() => setConfirm(true)}>Reset to seed data</Button>
              </Stack>
            </SectionCard>
            <SectionCard title="About">
              <Typography variant="body2" color="text.secondary">
                JD EVENTS Event Manager v1.0 · React 18 · Material UI 6 · MUI X Data Grid & Charts · React Router 6 · Vite. Seed data: {seedState.events.length} projects including the credentials portfolio (Okaya, Kobelco, Grundfos, Adani, Tops, Hershey's, Eaton, Avery Dennison, Summit Sports, Delta, Rehlko, Canara Bank, CG Power).
              </Typography>
            </SectionCard>
          </Stack>
        </Grid>
      </Grid>
      <ConfirmDialog open={confirm} title="Reset all data?" message="Every change you've made will be discarded and the original seed data restored." confirmText="Reset" onCancel={() => setConfirm(false)} onConfirm={() => { dispatch({ type: 'RESET_DATA' }); setConfirm(false); notify('Seed data restored', 'info'); }} />
    </Box>
  );
}
