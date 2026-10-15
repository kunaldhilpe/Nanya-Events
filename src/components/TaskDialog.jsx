import React, { useEffect, useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, MenuItem, TextField } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { useApp } from '../store/AppContext.jsx';
import { useToast } from './SnackbarProvider.jsx';
import { TASK_STATUSES, PRIORITIES, TODAY } from '../utils/format';

const CATEGORIES = ['Design', 'Procurement', 'Production', 'Client Servicing', 'Compliance', 'Finance'];

export default function TaskDialog({ open, onClose, task, defaultEventId }) {
  const { state, dispatch } = useApp();
  const notify = useToast();
  const blank = {
    title: '', eventId: defaultEventId || state.events[0]?.id || '', category: 'Production', status: 'To Do', priority: 'Medium',
    assigneeId: state.team[0]?.id || '', dueDate: TODAY.add(7, 'day').format('YYYY-MM-DD'), estimateHours: 4, description: '',
  };
  const [form, setForm] = useState(blank);
  useEffect(() => { setForm(task ? { ...blank, ...task } : blank); }, [task, open]); // eslint-disable-line

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const save = () => {
    if (!form.title.trim()) return notify('Task title is required', 'error');
    if (task?.id) {
      dispatch({ type: 'UPDATE', entity: 'tasks', id: task.id, patch: form });
      notify('Task updated');
    } else {
      dispatch({ type: 'ADD', entity: 'tasks', item: { ...form, createdAt: TODAY.format('YYYY-MM-DD'), checklist: [], comments: 0 } });
      notify('Task created');
    }
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{task?.id ? 'Edit task' : 'New task'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0 }}>
          <Grid item xs={12}><TextField label="Title" value={form.title} onChange={set('title')} fullWidth autoFocus /></Grid>
          <Grid item xs={12}>
            <TextField select label="Project" value={form.eventId} onChange={set('eventId')} fullWidth disabled={!!defaultEventId}>
              {state.events.map((e) => <MenuItem key={e.id} value={e.id}>{e.title}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={6}>
            <TextField select label="Category" value={form.category} onChange={set('category')} fullWidth>
              {CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={6}>
            <TextField select label="Assignee" value={form.assigneeId} onChange={set('assigneeId')} fullWidth>
              {state.team.map((t) => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={6}>
            <TextField select label="Status" value={form.status} onChange={set('status')} fullWidth>
              {TASK_STATUSES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={6}>
            <TextField select label="Priority" value={form.priority} onChange={set('priority')} fullWidth>
              {PRIORITIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={6}>
            <DatePicker label="Due date" value={dayjs(form.dueDate)} onChange={(v) => v && setForm((f) => ({ ...f, dueDate: v.format('YYYY-MM-DD') }))} slotProps={{ textField: { fullWidth: true, size: 'small' } }} />
          </Grid>
          <Grid item xs={6}><TextField label="Estimate (hours)" type="number" value={form.estimateHours} onChange={set('estimateHours')} fullWidth /></Grid>
          <Grid item xs={12}><TextField label="Description" value={form.description || ''} onChange={set('description')} fullWidth multiline minRows={2} /></Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={save}>{task?.id ? 'Save' : 'Create'}</Button>
      </DialogActions>
    </Dialog>
  );
}
