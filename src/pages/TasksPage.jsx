import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Box, Button, Card, Chip, IconButton, MenuItem, Stack, TextField, Typography, alpha, InputAdornment, Badge } from '@mui/material';
import AddIcon from '@mui/icons-material/AddRounded';
import SearchIcon from '@mui/icons-material/SearchRounded';
import EditIcon from '@mui/icons-material/EditRounded';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import dayjs from 'dayjs';
import { useApp } from '../store/AppContext.jsx';
import { useToast } from '../components/SnackbarProvider.jsx';
import { PageHeader, PersonAvatar, PriorityChip } from '../components/common.jsx';
import TaskDialog from '../components/TaskDialog.jsx';
import { TASK_STATUSES, TODAY, fmtDate } from '../utils/format';
import { taskStatusColors } from '../theme/theme';

export default function TasksPage() {
  const { state, dispatch, teamById, eventById } = useApp();
  const notify = useToast();
  const [q, setQ] = useState('');
  const [eventId, setEventId] = useState('All');
  const [assignee, setAssignee] = useState('All');
  const [priority, setPriority] = useState('All');
  const [onlyActive, setOnlyActive] = useState(true);
  const [dlg, setDlg] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [over, setOver] = useState(null);

  const activeEventIds = useMemo(() => new Set(state.events.filter((e) => !['Completed', 'Cancelled'].includes(e.status)).map((e) => e.id)), [state.events]);

  const tasks = useMemo(() => {
    const s = q.trim().toLowerCase();
    return state.tasks.filter((t) =>
      (!onlyActive || activeEventIds.has(t.eventId)) &&
      (eventId === 'All' || t.eventId === eventId) &&
      (assignee === 'All' || t.assigneeId === assignee) &&
      (priority === 'All' || t.priority === priority) &&
      (!s || t.title.toLowerCase().includes(s) || eventById[t.eventId]?.title.toLowerCase().includes(s))
    );
  }, [state.tasks, q, eventId, assignee, priority, onlyActive, activeEventIds, eventById]);

  const columns = TASK_STATUSES.map((s) => ({ status: s, items: tasks.filter((t) => t.status === s).sort((a, b) => a.dueDate.localeCompare(b.dueDate)) }));

  const drop = (status) => {
    if (dragging && dragging.status !== status) {
      dispatch({ type: 'UPDATE', entity: 'tasks', id: dragging.id, patch: { status } });
      notify(`Moved to ${status}`, 'info');
    }
    setDragging(null); setOver(null);
  };

  return (
    <Box>
      <PageHeader
        title="Task board"
        subtitle={`${tasks.length} tasks · drag cards between columns to update status`}
        actions={<Button variant="contained" startIcon={<AddIcon />} onClick={() => setDlg({})}>New task</Button>}
      />
      <Card sx={{ p: 1.5, mb: 2.5 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} gap={1.5} alignItems={{ md: 'center' }}>
          <TextField placeholder="Search tasks…" value={q} onChange={(e) => setQ(e.target.value)} sx={{ flex: 1, minWidth: 200 }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} />
          <TextField select label="Project" value={eventId} onChange={(e) => setEventId(e.target.value)} sx={{ minWidth: 220 }}>
            <MenuItem value="All">All projects</MenuItem>
            {state.events.filter((e) => !onlyActive || activeEventIds.has(e.id)).map((e) => <MenuItem key={e.id} value={e.id}>{e.title}</MenuItem>)}
          </TextField>
          <TextField select label="Assignee" value={assignee} onChange={(e) => setAssignee(e.target.value)} sx={{ minWidth: 170 }}>
            <MenuItem value="All">Everyone</MenuItem>
            {state.team.map((t) => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
          </TextField>
          <TextField select label="Priority" value={priority} onChange={(e) => setPriority(e.target.value)} sx={{ minWidth: 130 }}>
            <MenuItem value="All">Any</MenuItem>
            {['Critical', 'High', 'Medium', 'Low'].map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
          </TextField>
          <Chip label={onlyActive ? 'Active projects only' : 'All projects'} onClick={() => setOnlyActive((v) => !v)} color={onlyActive ? 'primary' : 'default'} variant={onlyActive ? 'filled' : 'outlined'} />
        </Stack>
      </Card>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, minmax(0, 1fr))' }, gap: 2, alignItems: 'start' }}>
        {columns.map((col) => {
          const c = taskStatusColors[col.status];
          return (
            <Box
              key={col.status}
              onDragOver={(e) => { e.preventDefault(); setOver(col.status); }}
              onDragLeave={() => setOver(null)}
              onDrop={() => drop(col.status)}
              sx={{ minWidth: 0, borderRadius: 3, p: 1.25, bgcolor: over === col.status ? alpha(c, 0.12) : (t) => alpha(t.palette.text.primary, 0.035), minHeight: 300, transition: 'background .15s', border: over === col.status ? `2px dashed ${c}` : '2px solid transparent' }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 0.5, mb: 1.25 }}>
                <Stack direction="row" alignItems="center" gap={1}>
                  <Box sx={{ width: 10, height: 10, borderRadius: 5, bgcolor: c }} />
                  <Typography fontWeight={700}>{col.status}</Typography>
                  <Chip size="small" label={col.items.length} sx={{ height: 20 }} />
                </Stack>
                <IconButton size="small" onClick={() => setDlg({ status: col.status })}><AddIcon fontSize="small" /></IconButton>
              </Stack>
              <Stack gap={1.25}>
                {col.items.slice(0, 60).map((t) => {
                  const late = t.status !== 'Done' && dayjs(t.dueDate).isBefore(TODAY);
                  const ev = eventById[t.eventId];
                  return (
                    <Card
                      key={t.id}
                      draggable
                      onDragStart={() => setDragging(t)}
                      onDragEnd={() => { setDragging(null); setOver(null); }}
                      sx={{ p: 1.5, cursor: 'grab', opacity: dragging?.id === t.id ? 0.4 : 1, '&:hover': { boxShadow: 3 }, '&:active': { cursor: 'grabbing' } }}
                    >
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
                        <PriorityChip priority={t.priority} />
                        <IconButton size="small" sx={{ mt: -0.5, mr: -0.5 }} onClick={() => setDlg(t)}><EditIcon sx={{ fontSize: 16 }} /></IconButton>
                      </Stack>
                      <Typography fontWeight={600} fontSize={14} sx={{ mt: 0.75, lineHeight: 1.3 }}>{t.title}</Typography>
                      <Typography variant="caption" color="text.secondary" component={Link} to={`/events/${t.eventId}`} sx={{ display: 'block', textDecoration: 'none', mt: 0.25, '&:hover': { color: 'primary.main' } }} noWrap>{ev?.title}</Typography>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1.25 }}>
                        <Stack direction="row" gap={0.75} alignItems="center">
                          <Chip size="small" label={t.category} variant="outlined" sx={{ height: 20, fontSize: 11 }} />
                          {t.comments > 0 && <Stack direction="row" alignItems="center" gap={0.25} sx={{ color: 'text.secondary' }}><ChatBubbleOutlineIcon sx={{ fontSize: 14 }} /><Typography variant="caption">{t.comments}</Typography></Stack>}
                        </Stack>
                        <Stack direction="row" gap={0.75} alignItems="center">
                          <Typography variant="caption" fontWeight={late ? 700 : 500} color={late ? 'error.main' : 'text.secondary'}>{fmtDate(t.dueDate, 'DD MMM')}</Typography>
                          <PersonAvatar person={teamById[t.assigneeId]} size={24} />
                        </Stack>
                      </Stack>
                    </Card>
                  );
                })}
                {col.items.length > 60 && <Typography variant="caption" color="text.secondary" textAlign="center">+{col.items.length - 60} more — narrow the filters</Typography>}
                {col.items.length === 0 && <Typography variant="caption" color="text.secondary" textAlign="center" sx={{ py: 3 }}>Drop tasks here</Typography>}
              </Stack>
            </Box>
          );
        })}
      </Box>
      <TaskDialog open={!!dlg} onClose={() => setDlg(null)} task={dlg?.id ? dlg : dlg?.status ? { status: dlg.status } : null} />
    </Box>
  );
}
