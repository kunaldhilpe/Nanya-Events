import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Grid, MenuItem, Stack, TextField, Typography, Tabs, Tab, LinearProgress } from '@mui/material';
import AddIcon from '@mui/icons-material/AddRounded';
import dayjs from 'dayjs';
import { useApp } from '../../store/AppContext.jsx';
import { useToast } from '../../components/SnackbarProvider.jsx';
import { PageHeader, PersonAvatar, ProgressBar } from '../../components/common.jsx';
import { TODAY } from '../../utils/format';

const DEPTS = ['Leadership', 'Project Management', 'Design', 'Production', 'Procurement', 'Finance', 'Client Servicing'];
const COLORS = ['#0b2e24', '#c9a24a', '#1f6f5c', '#8e44ad', '#2980b9', '#e67e22', '#16a085', '#c0392b', '#34495e', '#d35400'];

export default function TeamPage() {
  const { state, dispatch } = useApp();
  const notify = useToast();
  const [dept, setDept] = useState('All');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', role: '', department: 'Production', email: '', phone: '', location: 'Noida', skills: '' });

  const rows = useMemo(() =>
    state.team
      .filter((t) => dept === 'All' || t.department === dept)
      .map((t) => {
        const mine = state.tasks.filter((x) => x.assigneeId === t.id);
        const open = mine.filter((x) => x.status !== 'Done');
        const overdue = open.filter((x) => dayjs(x.dueDate).isBefore(TODAY)).length;
        const projects = state.events.filter((e) => e.teamIds.includes(t.id) && !['Completed', 'Cancelled'].includes(e.status)).length;
        return { ...t, open: open.length, overdue, projects, load: Math.min(100, Math.round((open.length / 12) * 100)) };
      }), [state.team, state.tasks, state.events, dept]);

  const save = () => {
    if (!form.name.trim() || !form.role.trim()) return notify('Name and role are required', 'error');
    dispatch({ type: 'ADD', entity: 'team', item: { ...form, skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean), color: COLORS[state.team.length % COLORS.length], joined: TODAY.format('YYYY-MM-DD'), availability: 'Available' } });
    notify('Team member added'); setOpen(false);
  };

  return (
    <Box>
      <PageHeader title="Team" subtitle={`${state.team.length} people · workload based on open tasks`} 
      // actions={<Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>Add member</Button>} 
      />
      <Tabs value={dept} onChange={(e, v) => setDept(v)} variant="scrollable" scrollButtons="auto" sx={{ mb: 2.5, borderBottom: 1, borderColor: 'divider' }}>
        <Tab value="All" label="Everyone" />
        {DEPTS.map((d) => <Tab key={d} value={d} label={d} />)}
      </Tabs>
      <Grid container spacing={2.5}>
        {rows.map((t) => (
          <Grid item xs={12} sm={6} lg={4} xl={3} key={t.id}>
            <Card component={Link} to={`/team/${t.id}`} sx={{ display: 'block', textDecoration: 'none', color: 'inherit', height: '100%', '&:hover': { boxShadow: 5, transform: 'translateY(-2px)' } }}>
              <CardContent>
                <Stack direction="row" gap={1.5} alignItems="center">
                  <PersonAvatar person={t} size={52} />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography fontWeight={700} noWrap>{t.name}</Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>{t.role}</Typography>
                  </Box>
                </Stack>
                <Stack direction="row" gap={0.75} sx={{ mt: 1.5 }} flexWrap="wrap">
                  <Chip size="small" label={t.department} variant="outlined" />
                  <Chip size="small" label={t.availability} color={t.availability === 'Available' ? 'success' : t.availability === 'On Site' ? 'info' : 'default'} />
                </Stack>
                <Box sx={{ mt: 2 }}>
                  <ProgressBar value={t.load} label={`Workload · ${t.open} open tasks`} height={6} color={t.load > 80 ? '#dc2626' : t.load > 50 ? '#d97706' : '#059669'} />
                </Box>
                <Stack direction="row" justifyContent="space-between" sx={{ mt: 1.5 }}>
                  <Typography variant="caption" color="text.secondary">{t.projects} active project{t.projects === 1 ? '' : 's'}</Typography>
                  {t.overdue > 0 && <Typography variant="caption" color="error.main" fontWeight={700}>{t.overdue} overdue</Typography>}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add team member</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            {[['name', 'Full name', 6], ['role', 'Role / title', 6], ['email', 'Email', 6], ['phone', 'Phone', 6], ['location', 'Location', 6]].map(([k, l, w]) => (
              <Grid item xs={12} sm={w} key={k}><TextField label={l} value={form[k]} onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))} fullWidth /></Grid>
            ))}
            <Grid item xs={12} sm={6}><TextField select label="Department" value={form.department} onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))} fullWidth>{DEPTS.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}</TextField></Grid>
            <Grid item xs={12}><TextField label="Skills (comma separated)" value={form.skills} onChange={(e) => setForm((f) => ({ ...f, skills: e.target.value }))} fullWidth /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions><Button onClick={() => setOpen(false)}>Cancel</Button><Button variant="contained" onClick={save}>Add</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
