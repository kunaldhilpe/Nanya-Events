import React, { useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Box, Button, Card, CardContent, Chip, Divider, Grid, MenuItem, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { PieChart } from '@mui/x-charts';
import dayjs from 'dayjs';
import { useApp } from '../../store/AppContext.jsx';
import { useToast } from '../../components/SnackbarProvider.jsx';
import { PageHeader, PersonAvatar, KeyValue, SectionCard, StatusChip, PriorityChip, EmptyState } from '../../components/common.jsx';
import { fmtDate, fmtRange, TODAY, groupBy } from '../../utils/format';
import { taskStatusColors } from '../../theme/theme';

export default function TeamMemberPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const notify = useToast();
  const { state, dispatch, eventById } = useApp();
  const person = state.team.find((t) => t.id === id);
  const tasks = useMemo(() => state.tasks.filter((t) => t.assigneeId === id).sort((a, b) => a.dueDate.localeCompare(b.dueDate)), [state.tasks, id]);
  const events = useMemo(() => state.events.filter((e) => e.teamIds.includes(id)).sort((a, b) => b.startDate.localeCompare(a.startDate)), [state.events, id]);
  if (!person) return <EmptyState icon="👤" title="Team member not found" message="" action={<Button component={Link} to="/team">Back to team</Button>} />;

  const byStatus = Object.entries(groupBy(tasks, 'status')).map(([label, arr]) => ({ id: label, label, value: arr.length, color: taskStatusColors[label] }));
  const open = tasks.filter((t) => t.status !== 'Done');

  return (
    <Box>
      <PageHeader title={person.name} subtitle={`${person.role} · ${person.department}`} crumbs={[{ label: 'Team', to: '/team' }, { label: person.name }]} />
      <Grid container spacing={2.5}>
        <Grid item xs={12} md={4}>
          <Stack gap={2.5}>
            <Card><CardContent>
              <Stack alignItems="center" sx={{ mb: 2 }}>
                <PersonAvatar person={person} size={88} />
                <TextField select size="small" value={person.availability} onChange={(e) => { dispatch({ type: 'UPDATE', entity: 'team', id, patch: { availability: e.target.value } }); notify('Availability updated'); }} sx={{ mt: 1.5, minWidth: 160 }}>
                  {['Available', 'On Site', 'Leave'].map((a) => <MenuItem key={a} value={a}>{a}</MenuItem>)}
                </TextField>
              </Stack>
              <Stack gap={1.5}>
                <KeyValue label="Email" value={person.email} />
                <KeyValue label="Phone" value={person.phone} />
                <KeyValue label="Location" value={person.location} />
                <KeyValue label="Joined" value={fmtDate(person.joined, 'MMM YYYY')} />
                <Divider />
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>Skills</Typography>
                  <Stack direction="row" gap={0.5} flexWrap="wrap" sx={{ mt: 0.5 }}>{person.skills.map((s) => <Chip key={s} size="small" label={s} />)}</Stack>
                </Box>
              </Stack>
            </CardContent></Card>
            <SectionCard title="Task mix">
              {tasks.length ? <PieChart height={200} series={[{ data: byStatus, innerRadius: 45, outerRadius: 80, paddingAngle: 2, cornerRadius: 3 }]} margin={{ left: 0, right: 0, top: 10, bottom: 10 }} slotProps={{ legend: { hidden: true } }} /> : <Typography color="text.secondary">No tasks assigned.</Typography>}
              <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mt: 1 }}>{byStatus.map((s) => <Chip key={s.id} size="small" label={`${s.label}: ${s.value}`} sx={{ color: s.color, fontWeight: 700 }} variant="outlined" />)}</Stack>
            </SectionCard>
          </Stack>
        </Grid>
        <Grid item xs={12} md={8}>
          <Stack gap={2.5}>
            <SectionCard title={`Open tasks (${open.length})`} noPadding>
              <Table size="small">
                <TableHead><TableRow><TableCell>Task</TableCell><TableCell>Project</TableCell><TableCell>Priority</TableCell><TableCell>Due</TableCell><TableCell>Status</TableCell></TableRow></TableHead>
                <TableBody>
                  {open.slice(0, 25).map((t) => {
                    const late = dayjs(t.dueDate).isBefore(TODAY);
                    return (
                      <TableRow key={t.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/events/${t.eventId}?tab=tasks`)}>
                        <TableCell><Typography fontSize={14} fontWeight={500}>{t.title}</Typography></TableCell>
                        <TableCell><Typography fontSize={13} color="text.secondary" noWrap sx={{ maxWidth: 220 }}>{eventById[t.eventId]?.title}</Typography></TableCell>
                        <TableCell><PriorityChip priority={t.priority} /></TableCell>
                        <TableCell><Typography fontSize={13} color={late ? 'error.main' : 'text.primary'} fontWeight={late ? 700 : 400}>{fmtDate(t.dueDate, 'DD MMM')}</Typography></TableCell>
                        <TableCell><StatusChip status={t.status} /></TableCell>
                      </TableRow>
                    );
                  })}
                  {open.length === 0 && <TableRow><TableCell colSpan={5}><Typography color="text.secondary" textAlign="center" py={3}>All caught up.</Typography></TableCell></TableRow>}
                </TableBody>
              </Table>
            </SectionCard>
            <SectionCard title={`Projects (${events.length})`} noPadding>
              <Table size="small">
                <TableHead><TableRow><TableCell>Project</TableCell><TableCell>Role</TableCell><TableCell>Dates</TableCell><TableCell>Status</TableCell></TableRow></TableHead>
                <TableBody>
                  {events.map((e) => (
                    <TableRow key={e.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/events/${e.id}`)}>
                      <TableCell><Typography fontSize={14} fontWeight={600}>{e.title}</Typography></TableCell>
                      <TableCell>{e.projectManagerId === id ? <Chip size="small" label="Project Manager" color="secondary" /> : <Chip size="small" label="Team member" variant="outlined" />}</TableCell>
                      <TableCell>{fmtRange(e.startDate, e.endDate)}</TableCell>
                      <TableCell><StatusChip status={e.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </SectionCard>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
