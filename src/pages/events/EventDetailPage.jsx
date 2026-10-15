import React, { useMemo, useState } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box, Button, Card, CardContent, Chip, Divider, Grid, IconButton, ImageList, ImageListItem, LinearProgress, List, ListItem,
  ListItemAvatar, ListItemText, MenuItem, Stack, Tab, Tabs, Table, TableBody, TableCell, TableHead, TableRow, TextField, Tooltip,
  Typography, alpha, Checkbox, Dialog, Rating, Slider,
} from '@mui/material';
import { PieChart, BarChart } from '@mui/x-charts';
import EditIcon from '@mui/icons-material/EditRounded';
import DeleteIcon from '@mui/icons-material/DeleteRounded';
import AddIcon from '@mui/icons-material/AddRounded';
import CheckCircleIcon from '@mui/icons-material/CheckCircleRounded';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUncheckedRounded';
import PlaceIcon from '@mui/icons-material/PlaceRounded';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonthRounded';
import SquareFootIcon from '@mui/icons-material/SquareFootRounded';
import ArrowBackIcon from '@mui/icons-material/ArrowBackRounded';
import dayjs from 'dayjs';
import { useApp } from '../../store/AppContext.jsx';
import { useToast } from '../../components/SnackbarProvider.jsx';
import { PageHeader, StatusChip, PriorityChip, PersonAvatar, ProgressBar, SectionCard, KeyValue, ConfirmDialog, EmptyState } from '../../components/common.jsx';
import TaskDialog from '../../components/TaskDialog.jsx';
import ExpenseDialog from '../../components/ExpenseDialog.jsx';
import { fmtINR, fmtDate, fmtRange, EVENT_STATUSES, TODAY, daysUntil, sum, groupBy, pct } from '../../utils/format';
import { statusColors, taskStatusColors } from '../../theme/theme';

const TABS = ['overview', 'tasks', 'budget', 'team', 'timeline', 'gallery'];

export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const notify = useToast();
  const [params, setParams] = useSearchParams();
  const { state, dispatch, clientById, venueById, teamById, vendorById } = useApp();
  const event = state.events.find((e) => e.id === id);
  const tab = TABS.includes(params.get('tab')) ? params.get('tab') : 'overview';
  const [taskDlg, setTaskDlg] = useState(null);
  const [expDlg, setExpDlg] = useState(null);
  const [confirm, setConfirm] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [taskFilter, setTaskFilter] = useState('All');

  const tasks = useMemo(() => state.tasks.filter((t) => t.eventId === id), [state.tasks, id]);
  const expenses = useMemo(() => state.expenses.filter((x) => x.eventId === id).sort((a, b) => b.date.localeCompare(a.date)), [state.expenses, id]);

  if (!event) return <EmptyState icon="🧭" title="Project not found" message="It may have been deleted." action={<Button component={Link} to="/events">Back to events</Button>} />;

  const client = clientById[event.clientId];
  const venue = venueById[event.venueId];
  const pm = teamById[event.projectManagerId];
  const done = tasks.filter((t) => t.status === 'Done').length;
  const overdue = tasks.filter((t) => t.status !== 'Done' && dayjs(t.dueDate).isBefore(TODAY));
  const spentPct = pct(event.spent, event.budget);
  const d = daysUntil(event.startDate);
  const byCat = Object.entries(groupBy(expenses, 'category')).map(([label, arr]) => ({ id: label, label, value: sum(arr, 'amount') })).sort((a, b) => b.value - a.value);
  const paid = sum(expenses.filter((x) => x.status === 'Paid'), 'amount');

  const patch = (p) => dispatch({ type: 'UPDATE', entity: 'events', id, patch: p });
  const toggleMilestone = (i) => patch({ milestones: event.milestones.map((m, j) => (j === i ? { ...m, done: !m.done } : m)) });
  const setTaskStatus = (t, status) => dispatch({ type: 'UPDATE', entity: 'tasks', id: t.id, patch: { status } });

  const filteredTasks = taskFilter === 'All' ? tasks : tasks.filter((t) => t.status === taskFilter);

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} size="small" onClick={() => navigate(-1)} sx={{ mb: 1 }}>Back</Button>
      <Box
        sx={{
          position: 'relative', borderRadius: 3, overflow: 'hidden', mb: 3, minHeight: 220, display: 'flex', alignItems: 'flex-end',
          backgroundImage: event.images[0]
            ? `linear-gradient(to top, rgba(11,46,36,0.92), rgba(11,46,36,0.35)), url(${event.images[0]})`
            : `linear-gradient(135deg, ${client?.color || '#1f6f5c'} 0%, #0b2e24 100%)`,
          backgroundSize: 'cover', backgroundPosition: 'center', color: '#fff', p: { xs: 2, md: 3 },
        }}
      >
        <Box sx={{ width: '100%' }}>
          <Stack direction="row" gap={1} sx={{ mb: 1 }} flexWrap="wrap">
            <StatusChip status={event.status} onLight />
            <PriorityChip priority={event.priority} onLight />
            {event.tags.map((t) => <Chip key={t} size="small" label={t} sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: '#fff' }} />)}
          </Stack>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'flex-end' }} gap={2}>
            <Box>
              <Typography variant="h4" sx={{ color: '#fff' }}>{event.title}</Typography>
              <Typography sx={{ opacity: 0.85, mt: 0.5 }}>
                {event.exhibition} · <Link to={`/clients/${client?.id}`} style={{ color: '#c9a24a' }}>{client?.name}</Link>
              </Typography>
              <Stack direction="row" gap={2.5} sx={{ mt: 1.5, opacity: 0.9, fontSize: 14 }} flexWrap="wrap">
                <Stack direction="row" gap={0.5} alignItems="center"><PlaceIcon fontSize="small" />{venue?.name}, {event.hall} · Stall {event.stallNo}</Stack>
                <Stack direction="row" gap={0.5} alignItems="center"><CalendarMonthIcon fontSize="small" />{fmtRange(event.startDate, event.endDate)} {d >= 0 ? `(in ${d} days)` : ''}</Stack>
                <Stack direction="row" gap={0.5} alignItems="center"><SquareFootIcon fontSize="small" />{event.stallSizeSqm} m² · {event.stallType} · {event.openSides}-side open · {event.heightM} m</Stack>
              </Stack>
            </Box>
            <Stack direction="row" gap={1}>
              <TextField select size="small" value={event.status} onChange={(e) => { patch({ status: e.target.value, progress: e.target.value === 'Completed' ? 100 : event.progress }); notify(`Status changed to ${e.target.value}`); }}
                sx={{ minWidth: 150, '& .MuiInputBase-root': { bgcolor: 'rgba(255,255,255,0.95)' } }}>
                {EVENT_STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField>
              <Button variant="contained" color="secondary" startIcon={<EditIcon />} component={Link} to={`/events/${id}/edit`}>Edit</Button>
              <Tooltip title="Delete project"><IconButton sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,0.12)' }} onClick={() => setConfirm(true)}><DeleteIcon /></IconButton></Tooltip>
            </Stack>
          </Stack>
        </Box>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { l: 'Progress', v: `${event.progress}%`, extra: <Slider size="small" value={event.progress} onChange={(e, v) => patch({ progress: v })} sx={{ mt: 0.5, color: statusColors[event.status] }} /> },
          { l: 'Budget', v: fmtINR(event.budget, true), extra: <ProgressBar value={spentPct} height={6} color={spentPct > 100 ? '#dc2626' : '#c9a24a'} label={`${fmtINR(event.spent, true)} spent (${spentPct}%)`} /> },
          { l: 'Tasks', v: `${done} / ${tasks.length}`, extra: <ProgressBar value={pct(done, tasks.length)} height={6} color="#2563eb" label={overdue.length ? `${overdue.length} overdue` : 'None overdue'} /> },
          { l: 'Project manager', v: pm?.name, extra: <Typography variant="caption" color="text.secondary">{pm?.phone} · {event.teamIds.length} team members · {event.vendorIds.length} vendors</Typography> },
        ].map((k) => (
          <Grid item xs={12} sm={6} lg={3} key={k.l}>
            <Card><CardContent sx={{ py: 1.75, '&:last-child': { pb: 1.75 } }}>
              <Typography variant="overline" color="text.secondary">{k.l}</Typography>
              <Typography variant="h5">{k.v}</Typography>
              {k.extra}
            </CardContent></Card>
          </Grid>
        ))}
      </Grid>

      <Tabs value={tab} onChange={(e, v) => setParams({ tab: v })} sx={{ mb: 2.5, borderBottom: 1, borderColor: 'divider' }} variant="scrollable" allowScrollButtonsMobile>
        <Tab value="overview" label="Overview" />
        <Tab value="tasks" label={`Tasks (${tasks.length})`} />
        <Tab value="budget" label="Budget & Expenses" />
        <Tab value="team" label="Team & Vendors" />
        <Tab value="timeline" label="Timeline" />
        <Tab value="gallery" label={`Gallery (${event.images.length})`} />
      </Tabs>

      {tab === 'overview' && (
        <Grid container spacing={2.5}>
          <Grid item xs={12} lg={8}>
            <Stack gap={2.5}>
              <SectionCard title="Project brief">
                <Typography sx={{ mb: 2 }}>{event.description}</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} md={3}><KeyValue label="Exhibition" value={event.exhibition} /></Grid>
                  <Grid item xs={6} md={3}><KeyValue label="Setup from" value={fmtDate(event.setupDate)} /></Grid>
                  <Grid item xs={6} md={3}><KeyValue label="Dismantle by" value={fmtDate(event.dismantleDate)} /></Grid>
                  <Grid item xs={6} md={3}><KeyValue label="Created" value={fmtDate(event.createdAt)} /></Grid>
                  <Grid item xs={6} md={3}><KeyValue label="Client contact" value={client?.contactPerson} /></Grid>
                  <Grid item xs={6} md={3}><KeyValue label="Contact phone" value={client?.phone} /></Grid>
                  <Grid item xs={6} md={3}><KeyValue label="Venue city" value={venue?.city} /></Grid>
                  <Grid item xs={6} md={3}><KeyValue label="Rate / m²" value={fmtINR(Math.round(event.budget / event.stallSizeSqm))} /></Grid>
                </Grid>
              </SectionCard>
              <SectionCard title="Deliverables & scope">
                <Grid container spacing={1}>
                  {event.deliverables.map((dl) => (
                    <Grid item xs={12} sm={6} md={4} key={dl}>
                      <Stack direction="row" gap={1} alignItems="center" sx={{ p: 1, borderRadius: 2, bgcolor: (t) => alpha(t.palette.primary.main, 0.05) }}>
                        <CheckCircleIcon fontSize="small" color="primary" /><Typography fontSize={14}>{dl}</Typography>
                      </Stack>
                    </Grid>
                  ))}
                </Grid>
              </SectionCard>
            </Stack>
          </Grid>
          <Grid item xs={12} lg={4}>
            <Stack gap={2.5}>
              <SectionCard title="Milestones">
                <Stack gap={0}>
                  {event.milestones.map((m, i) => (
                    <Stack key={i} direction="row" gap={1.5} alignItems="center" sx={{ py: 0.75, cursor: 'pointer' }} onClick={() => toggleMilestone(i)}>
                      {m.done ? <CheckCircleIcon color="success" fontSize="small" /> : <RadioButtonUncheckedIcon fontSize="small" color={dayjs(m.date).isBefore(TODAY) ? 'error' : 'disabled'} />}
                      <Box sx={{ flex: 1 }}>
                        <Typography fontSize={14} sx={{ textDecoration: m.done ? 'line-through' : 'none', color: m.done ? 'text.secondary' : 'text.primary' }}>{m.name}</Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">{fmtDate(m.date, 'DD MMM')}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </SectionCard>
              <SectionCard title="Quick links">
                <Stack gap={1}>
                  <Button variant="outlined" component={Link} to={`/clients/${client?.id}`} fullWidth>Client profile</Button>
                  <Button variant="outlined" component={Link} to={`/venues/${venue?.id}`} fullWidth>Venue details</Button>
                  <Button variant="outlined" component={Link} to={`/calendar?month=${event.startDate.slice(0, 7)}`} fullWidth>Show on calendar</Button>
                </Stack>
              </SectionCard>
            </Stack>
          </Grid>
        </Grid>
      )}

      {tab === 'tasks' && (
        <Card>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 2 }} flexWrap="wrap" gap={1}>
            <Stack direction="row" gap={0.75} flexWrap="wrap">
              {['All', 'To Do', 'In Progress', 'Review', 'Done'].map((s) => (
                <Chip key={s} label={s === 'All' ? `All (${tasks.length})` : `${s} (${tasks.filter((t) => t.status === s).length})`} onClick={() => setTaskFilter(s)} color={taskFilter === s ? 'primary' : 'default'} variant={taskFilter === s ? 'filled' : 'outlined'} />
              ))}
            </Stack>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setTaskDlg({})}>Add task</Button>
          </Stack>
          <Divider />
          <Table size="small">
            <TableHead><TableRow><TableCell padding="checkbox" /><TableCell>Task</TableCell><TableCell>Category</TableCell><TableCell>Assignee</TableCell><TableCell>Priority</TableCell><TableCell>Due</TableCell><TableCell>Status</TableCell><TableCell /></TableRow></TableHead>
            <TableBody>
              {filteredTasks.sort((a, b) => a.dueDate.localeCompare(b.dueDate)).map((t) => {
                const late = t.status !== 'Done' && dayjs(t.dueDate).isBefore(TODAY);
                return (
                  <TableRow key={t.id} hover sx={{ '& td': { py: 1 } }}>
                    <TableCell padding="checkbox"><Checkbox size="small" checked={t.status === 'Done'} onChange={(e) => setTaskStatus(t, e.target.checked ? 'Done' : 'To Do')} /></TableCell>
                    <TableCell><Typography fontSize={14} fontWeight={500} sx={{ textDecoration: t.status === 'Done' ? 'line-through' : 'none' }}>{t.title}</Typography><Typography variant="caption" color="text.secondary">{t.id} · {t.estimateHours}h</Typography></TableCell>
                    <TableCell><Chip size="small" variant="outlined" label={t.category} /></TableCell>
                    <TableCell><Stack direction="row" gap={1} alignItems="center"><PersonAvatar person={teamById[t.assigneeId]} size={24} /><Typography fontSize={13}>{teamById[t.assigneeId]?.name}</Typography></Stack></TableCell>
                    <TableCell><PriorityChip priority={t.priority} /></TableCell>
                    <TableCell><Typography fontSize={13} color={late ? 'error.main' : 'text.primary'} fontWeight={late ? 700 : 400}>{fmtDate(t.dueDate, 'DD MMM')}</Typography></TableCell>
                    <TableCell>
                      <TextField select size="small" value={t.status} onChange={(e) => setTaskStatus(t, e.target.value)} variant="standard" InputProps={{ disableUnderline: true }} sx={{ '& .MuiSelect-select': { py: 0.25, fontSize: 13, color: taskStatusColors[t.status], fontWeight: 700 } }}>
                        {['To Do', 'In Progress', 'Review', 'Done'].map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                      </TextField>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => setTaskDlg(t)}><EditIcon fontSize="small" /></IconButton>
                      <IconButton size="small" onClick={() => { dispatch({ type: 'REMOVE', entity: 'tasks', id: t.id }); notify('Task removed', 'info'); }}><DeleteIcon fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredTasks.length === 0 && <TableRow><TableCell colSpan={8}><Typography color="text.secondary" textAlign="center" py={3}>No tasks here.</Typography></TableCell></TableRow>}
            </TableBody>
          </Table>
        </Card>
      )}

      {tab === 'budget' && (
        <Grid container spacing={2.5}>
          <Grid item xs={12} md={4}>
            <SectionCard title="Spend breakdown">
              {byCat.length ? (
                <PieChart height={260} series={[{ data: byCat, innerRadius: 55, outerRadius: 95, paddingAngle: 1.5, cornerRadius: 3, valueFormatter: (v) => fmtINR(v.value, true) }]} margin={{ left: 0, right: 0, top: 10, bottom: 10 }} slotProps={{ legend: { hidden: true } }} />
              ) : <Typography color="text.secondary">No expenses yet.</Typography>}
              <Stack gap={0.75} sx={{ mt: 1 }}>
                {byCat.slice(0, 6).map((c) => (
                  <Stack key={c.id} direction="row" justifyContent="space-between"><Typography fontSize={13}>{c.label}</Typography><Typography fontSize={13} fontWeight={700}>{fmtINR(c.value, true)}</Typography></Stack>
                ))}
              </Stack>
              <Divider sx={{ my: 1.5 }} />
              <Stack gap={0.5}>
                <Stack direction="row" justifyContent="space-between"><Typography fontSize={13}>Budget</Typography><Typography fontSize={13} fontWeight={700}>{fmtINR(event.budget)}</Typography></Stack>
                <Stack direction="row" justifyContent="space-between"><Typography fontSize={13}>Committed</Typography><Typography fontSize={13} fontWeight={700}>{fmtINR(sum(expenses, 'amount'))}</Typography></Stack>
                <Stack direction="row" justifyContent="space-between"><Typography fontSize={13}>Paid</Typography><Typography fontSize={13} fontWeight={700} color="success.main">{fmtINR(paid)}</Typography></Stack>
                <Stack direction="row" justifyContent="space-between"><Typography fontSize={13}>Remaining budget</Typography><Typography fontSize={13} fontWeight={700} color={event.budget - sum(expenses, 'amount') < 0 ? 'error.main' : 'primary.main'}>{fmtINR(event.budget - sum(expenses, 'amount'))}</Typography></Stack>
              </Stack>
            </SectionCard>
          </Grid>
          <Grid item xs={12} md={8}>
            <Card>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 2 }}>
                <Typography variant="h6" fontSize={16}>Expense ledger</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setExpDlg({})}>Record expense</Button>
              </Stack>
              <Divider />
              <Table size="small">
                <TableHead><TableRow><TableCell>Date</TableCell><TableCell>Description</TableCell><TableCell>Vendor</TableCell><TableCell align="right">Amount</TableCell><TableCell>Status</TableCell><TableCell /></TableRow></TableHead>
                <TableBody>
                  {expenses.map((x) => (
                    <TableRow key={x.id} hover>
                      <TableCell>{fmtDate(x.date, 'DD MMM YY')}</TableCell>
                      <TableCell><Typography fontSize={13.5}>{x.description}</Typography><Typography variant="caption" color="text.secondary">{x.invoiceNo} · {x.paymentMode}</Typography></TableCell>
                      <TableCell><Typography fontSize={13}>{vendorById[x.vendorId]?.name || '—'}</Typography></TableCell>
                      <TableCell align="right"><Typography fontWeight={700} fontSize={13.5}>{fmtINR(x.amount)}</Typography></TableCell>
                      <TableCell><Chip size="small" label={x.status} color={x.status === 'Paid' ? 'success' : x.status === 'Overdue' ? 'error' : 'warning'} variant="outlined" /></TableCell>
                      <TableCell align="right"><IconButton size="small" onClick={() => setExpDlg(x)}><EditIcon fontSize="small" /></IconButton></TableCell>
                    </TableRow>
                  ))}
                  {expenses.length === 0 && <TableRow><TableCell colSpan={6}><Typography color="text.secondary" textAlign="center" py={3}>No expenses recorded.</Typography></TableCell></TableRow>}
                </TableBody>
              </Table>
            </Card>
          </Grid>
        </Grid>
      )}

      {tab === 'team' && (
        <Grid container spacing={2.5}>
          <Grid item xs={12} md={5}>
            <SectionCard title="Project team" noPadding>
              <List>
                {event.teamIds.map((tid) => {
                  const p = teamById[tid];
                  const load = tasks.filter((t) => t.assigneeId === tid && t.status !== 'Done').length;
                  return (
                    <ListItem key={tid} component={Link} to={`/team/${tid}`} sx={{ color: 'inherit', textDecoration: 'none', '&:hover': { bgcolor: 'action.hover' } }}
                      secondaryAction={<Chip size="small" label={`${load} open`} variant="outlined" />}>
                      <ListItemAvatar><PersonAvatar person={p} size={40} /></ListItemAvatar>
                      <ListItemText primary={<>{p?.name} {tid === event.projectManagerId && <Chip size="small" label="PM" color="secondary" sx={{ ml: 1, height: 18 }} />}</>} secondary={`${p?.role} · ${p?.department}`} />
                    </ListItem>
                  );
                })}
              </List>
            </SectionCard>
          </Grid>
          <Grid item xs={12} md={7}>
            <SectionCard title="Vendors on this project" noPadding>
              <Table size="small">
                <TableHead><TableRow><TableCell>Vendor</TableCell><TableCell>Category</TableCell><TableCell>Contact</TableCell><TableCell>Rating</TableCell><TableCell align="right">Billed</TableCell></TableRow></TableHead>
                <TableBody>
                  {event.vendorIds.map((vid) => {
                    const v = vendorById[vid];
                    if (!v) return null;
                    const billed = sum(expenses.filter((x) => x.vendorId === vid), 'amount');
                    return (
                      <TableRow key={vid} hover>
                        <TableCell><Typography fontWeight={600} fontSize={14}>{v.name}</Typography><Typography variant="caption" color="text.secondary">{v.paymentTerms}</Typography></TableCell>
                        <TableCell><Chip size="small" variant="outlined" label={v.category} /></TableCell>
                        <TableCell><Typography fontSize={13}>{v.contactPerson}</Typography><Typography variant="caption" color="text.secondary">{v.phone}</Typography></TableCell>
                        <TableCell><Rating value={v.rating} precision={0.1} size="small" readOnly /></TableCell>
                        <TableCell align="right"><Typography fontWeight={700} fontSize={13.5}>{fmtINR(billed, true)}</Typography></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </SectionCard>
          </Grid>
        </Grid>
      )}

      {tab === 'timeline' && (
        <Grid container spacing={2.5}>
          <Grid item xs={12} md={7}>
            <SectionCard title="Project timeline">
              <Box sx={{ position: 'relative', pl: 3, '&:before': { content: '""', position: 'absolute', left: 9, top: 8, bottom: 8, width: 2, bgcolor: 'divider' } }}>
                {event.milestones.map((m, i) => {
                  const past = dayjs(m.date).isBefore(TODAY);
                  return (
                    <Box key={i} sx={{ position: 'relative', pb: 3 }}>
                      <Box sx={{ position: 'absolute', left: -21, top: 4, width: 14, height: 14, borderRadius: 7, bgcolor: m.done ? 'success.main' : past ? 'error.main' : 'background.paper', border: 2, borderColor: m.done ? 'success.main' : past ? 'error.main' : 'divider' }} />
                      <Typography fontWeight={600}>{m.name}</Typography>
                      <Typography variant="body2" color="text.secondary">{fmtDate(m.date, 'dddd, DD MMM YYYY')} · {m.done ? 'Completed' : past ? 'Overdue' : `in ${daysUntil(m.date)} days`}</Typography>
                    </Box>
                  );
                })}
              </Box>
            </SectionCard>
          </Grid>
          <Grid item xs={12} md={5}>
            <SectionCard title="Task completion by category">
              <BarChart
                height={300}
                dataset={Object.entries(groupBy(tasks, 'category')).map(([c, arr]) => ({ category: c, done: arr.filter((t) => t.status === 'Done').length, open: arr.filter((t) => t.status !== 'Done').length }))}
                yAxis={[{ scaleType: 'band', dataKey: 'category' }]}
                series={[{ dataKey: 'done', label: 'Done', stack: 'a', color: '#059669' }, { dataKey: 'open', label: 'Open', stack: 'a', color: '#d1d5db' }]}
                layout="horizontal"
                margin={{ left: 110, right: 10, top: 10, bottom: 30 }}
                slotProps={{ legend: { hidden: true } }}
              />
            </SectionCard>
          </Grid>
        </Grid>
      )}

      {tab === 'gallery' && (
        <Card sx={{ p: 2 }}>
          {event.images.length === 0 ? (
            <EmptyState icon="🖼️" title="No site photos yet" message="Photos appear here once the stall is built. Renders can be attached from the edit page." />
          ) : (
            <ImageList variant="masonry" cols={3} gap={12}>
              {event.images.map((src) => (
                <ImageListItem key={src} sx={{ cursor: 'zoom-in', borderRadius: 2, overflow: 'hidden' }} onClick={() => setLightbox(src)}>
                  <img src={src} alt={event.title} loading="lazy" style={{ borderRadius: 8 }} />
                </ImageListItem>
              ))}
            </ImageList>
          )}
          <Dialog open={!!lightbox} onClose={() => setLightbox(null)} maxWidth="lg">
            {lightbox && <img src={lightbox} alt="" style={{ maxWidth: '90vw', maxHeight: '85vh', display: 'block' }} />}
          </Dialog>
        </Card>
      )}

      <TaskDialog open={!!taskDlg} onClose={() => setTaskDlg(null)} task={taskDlg?.id ? taskDlg : null} defaultEventId={id} />
      <ExpenseDialog open={!!expDlg} onClose={() => setExpDlg(null)} expense={expDlg?.id ? expDlg : null} defaultEventId={id} />
      <ConfirmDialog open={confirm} title="Delete project?" message="This removes the project with all of its tasks and expenses." onCancel={() => setConfirm(false)} onConfirm={() => { dispatch({ type: 'REMOVE', entity: 'events', id }); notify('Project deleted', 'info'); navigate('/events'); }} />
    </Box>
  );
}
