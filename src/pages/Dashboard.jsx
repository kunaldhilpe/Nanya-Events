import React, { useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box, Button, Card, CardContent, Chip, Grid, List, ListItemButton, ListItemText, Stack, Typography, Divider, alpha,
} from '@mui/material';
import { BarChart, PieChart, LineChart } from '@mui/x-charts';
import EventIcon from '@mui/icons-material/EventRounded';
import PaymentsIcon from '@mui/icons-material/PaymentsRounded';
import TaskAltIcon from '@mui/icons-material/TaskAltRounded';
import SquareFootIcon from '@mui/icons-material/SquareFootRounded';
import AddIcon from '@mui/icons-material/AddRounded';
import WarningAmberIcon from '@mui/icons-material/WarningAmberRounded';
import dayjs from 'dayjs';
import { useTheme } from '@mui/material/styles';
import { useApp } from '../store/AppContext.jsx';
import { PageHeader, StatCard, StatusChip, SectionCard, ProgressBar, TeamAvatars, PersonAvatar } from '../components/common.jsx';
import { fmtINR, fmtRange, TODAY, daysUntil, sum, fromNow, groupBy } from '../utils/format';
import { statusColors } from '../theme/theme';

export default function Dashboard() {
  const brandPrimary = useTheme().palette.primary.main;
  const { state, clientById, venueById, teamById, eventById } = useApp();
  const navigate = useNavigate();
  const { events, tasks, expenses } = state;
  const user = state.auth.user;

  const m = useMemo(() => {
    const active = events.filter((e) => !['Completed', 'Cancelled'].includes(e.status));
    const live = events.filter((e) => e.status === 'Live');
    const upcoming = events
      .filter((e) => dayjs(e.startDate).isAfter(TODAY))
      .sort((a, b) => a.startDate.localeCompare(b.startDate))
      .slice(0, 6);
    const pipelineValue = sum(active, 'budget');
    const openTasks = tasks.filter((t) => t.status !== 'Done');
    const overdue = openTasks.filter((t) => dayjs(t.dueDate).isBefore(TODAY));
    const sqmThisYear = sum(events.filter((e) => e.startDate.startsWith('2026')), 'stallSizeSqm');
    const pendingPayments = sum(expenses.filter((x) => x.status !== 'Paid'), 'amount');

    // revenue (budget) by month for last 12 months
    const months = Array.from({ length: 12 }, (_, i) => TODAY.subtract(11 - i, 'month').format('YYYY-MM'));
    const revenue = months.map((mo) => sum(events.filter((e) => e.startDate.startsWith(mo)), 'budget'));
    const spentByMonth = months.map((mo) => sum(expenses.filter((x) => x.date.startsWith(mo)), 'amount'));

    const byStatus = Object.entries(groupBy(events, 'status')).map(([label, arr]) => ({ id: label, label, value: arr.length, color: statusColors[label] }));
    const byType = Object.entries(groupBy(events, 'stallType')).map(([t, arr]) => ({ type: t, sqm: sum(arr, 'stallSizeSqm') }));

    const atRisk = active
      .map((e) => {
        const et = tasks.filter((t) => t.eventId === e.id);
        const od = et.filter((t) => t.status !== 'Done' && dayjs(t.dueDate).isBefore(TODAY)).length;
        const over = e.spent > e.budget;
        return { e, od, over, score: od * 2 + (over ? 5 : 0) };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    const myTasks = user ? openTasks.filter((t) => t.assigneeId === user.id).sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 6) : [];

    return { active, live, upcoming, pipelineValue, openTasks, overdue, sqmThisYear, pendingPayments, months, revenue, spentByMonth, byStatus, byType, atRisk, myTasks };
  }, [events, tasks, expenses, user]);

  return (
    <Box>
      <PageHeader
        title={`Good ${TODAY.hour() < 12 ? 'morning' : 'afternoon'}, ${user?.name?.split(' ')[0] || 'there'}`}
        subtitle={`${TODAY.format('dddd, DD MMMM YYYY')} · ${m.live.length} stall${m.live.length === 1 ? '' : 's'} live on the floor right now`}
        actions={
          <>
            <Button variant="outlined" component={Link} to="/calendar">View calendar</Button>
            <Button variant="contained" startIcon={<AddIcon />} component={Link} to="/events/new">New event</Button>
          </>
        }
      />

      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard title="Active projects" value={m.active.length} sub={`${m.live.length} live · ${events.filter((e) => e.status === 'Fabrication').length} in fabrication`} icon={<EventIcon />} onClick={() => navigate('/events')} />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard title="Active pipeline value" value={fmtINR(m.pipelineValue, true)} sub={`${fmtINR(m.pendingPayments, true)} vendor payments pending`} icon={<PaymentsIcon />} color="secondary" trend={12} onClick={() => navigate('/finance')} />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard title="Open tasks" value={m.openTasks.length} sub={`${m.overdue.length} overdue`} icon={<TaskAltIcon />} color={m.overdue.length > 20 ? 'error' : 'info'} onClick={() => navigate('/tasks')} />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard title="Sqm built in 2026" value={`${m.sqmThisYear.toLocaleString('en-IN')} m²`} sub={`${events.filter((e) => e.startDate.startsWith('2026')).length} stalls this year`} icon={<SquareFootIcon />} color="success" trend={8} onClick={() => navigate('/reports')} />
        </Grid>

        <Grid item xs={12} lg={8}>
          <SectionCard title="Project value vs. spend (last 12 months)">
            <LineChart
              height={280}
              series={[
                { data: m.revenue, label: 'Project value', color: brandPrimary, area: true, showMark: false, curve: 'monotoneX' },
                { data: m.spentByMonth, label: 'Vendor spend', color: '#c9a24a', showMark: false, curve: 'monotoneX' },
              ]}
              xAxis={[{ scaleType: 'point', data: m.months.map((x) => dayjs(x).format('MMM')) }]}
              yAxis={[{ valueFormatter: (v) => fmtINR(v, true) }]}
              margin={{ left: 70, right: 20, top: 30, bottom: 30 }}
              sx={{ '.MuiAreaElement-root': { fillOpacity: 0.12 } }}
              slotProps={{ legend: { position: { vertical: 'top', horizontal: 'right' }, itemMarkWidth: 10, itemMarkHeight: 10 } }}
            />
          </SectionCard>
        </Grid>
        <Grid item xs={12} lg={4}>
          <SectionCard title="Projects by status">
            <PieChart
              height={280}
              series={[{ data: m.byStatus, innerRadius: 60, outerRadius: 100, paddingAngle: 2, cornerRadius: 4 }]}
              margin={{ left: 0, right: 0, top: 10, bottom: 60 }}
              slotProps={{ legend: { direction: 'row', position: { vertical: 'bottom', horizontal: 'middle' }, itemMarkWidth: 10, itemMarkHeight: 10, labelStyle: { fontSize: 12 } } }}
            />
          </SectionCard>
        </Grid>

        <Grid item xs={12} lg={7}>
          <SectionCard title="Upcoming shows" action={<Button size="small" component={Link} to="/events">All events</Button>} noPadding>
            <List disablePadding>
              {m.upcoming.map((e, i) => {
                const d = daysUntil(e.startDate);
                return (
                  <React.Fragment key={e.id}>
                    {i > 0 && <Divider component="li" />}
                    <ListItemButton onClick={() => navigate(`/events/${e.id}`)} sx={{ px: 2.5, py: 1.5, gap: 2 }}>
                      <Box sx={{ textAlign: 'center', minWidth: 52, borderRadius: 2, p: 0.75, bgcolor: (t) => alpha(t.palette.primary.main, 0.08) }}>
                        <Typography variant="h6" lineHeight={1}>{dayjs(e.startDate).format('DD')}</Typography>
                        <Typography variant="caption" fontWeight={700}>{dayjs(e.startDate).format('MMM')}</Typography>
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography fontWeight={600} noWrap>{e.title}</Typography>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {venueById[e.venueId]?.name} · {e.hall} · {e.stallSizeSqm} m² {e.stallType}
                        </Typography>
                        <Box sx={{ mt: 0.75, maxWidth: 260 }}><ProgressBar value={e.progress} height={5} color={statusColors[e.status]} /></Box>
                      </Box>
                      <Stack alignItems="flex-end" gap={0.5}>
                        <StatusChip status={e.status} />
                        <Typography variant="caption" color={d <= 7 ? 'error.main' : 'text.secondary'} fontWeight={600}>in {d} days</Typography>
                      </Stack>
                    </ListItemButton>
                  </React.Fragment>
                );
              })}
            </List>
          </SectionCard>
        </Grid>

        <Grid item xs={12} lg={5}>
          <Stack gap={2.5} sx={{ height: '100%' }}>
            <SectionCard title="Needs attention" action={<WarningAmberIcon color="warning" fontSize="small" />}>
              <Stack gap={1.25}>
                {m.atRisk.length === 0 && <Typography color="text.secondary">All active projects are on track.</Typography>}
                {m.atRisk.map(({ e, od, over }) => (
                  <Box key={e.id} component={Link} to={`/events/${e.id}`} sx={{ textDecoration: 'none', color: 'inherit', p: 1.25, borderRadius: 2, border: 1, borderColor: 'divider', '&:hover': { bgcolor: 'action.hover' } }}>
                    <Typography fontWeight={600} fontSize={14} noWrap>{e.title}</Typography>
                    <Stack direction="row" gap={0.75} sx={{ mt: 0.5 }} flexWrap="wrap">
                      {od > 0 && <Chip size="small" color="error" variant="outlined" label={`${od} overdue task${od > 1 ? 's' : ''}`} />}
                      {over && <Chip size="small" color="warning" variant="outlined" label={`Over budget by ${fmtINR(e.spent - e.budget, true)}`} />}
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </SectionCard>
            <SectionCard title="My open tasks" action={<Button size="small" component={Link} to="/tasks">Board</Button>}>
              <Stack gap={1}>
                {m.myTasks.length === 0 && <Typography color="text.secondary">Nothing assigned to you. Enjoy the quiet.</Typography>}
                {m.myTasks.map((t) => (
                  <Stack key={t.id} direction="row" alignItems="center" gap={1.5} component={Link} to={`/events/${t.eventId}?tab=tasks`} sx={{ textDecoration: 'none', color: 'inherit' }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: 4, bgcolor: dayjs(t.dueDate).isBefore(TODAY) ? 'error.main' : 'info.main' }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography fontSize={14} fontWeight={500} noWrap>{t.title}</Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>{eventById[t.eventId]?.title}</Typography>
                    </Box>
                    <Typography variant="caption" color={dayjs(t.dueDate).isBefore(TODAY) ? 'error.main' : 'text.secondary'}>{fromNow(t.dueDate)}</Typography>
                  </Stack>
                ))}
              </Stack>
            </SectionCard>
          </Stack>
        </Grid>

        <Grid item xs={12} lg={6}>
          <SectionCard title="Area built by stall type (m²)">
            <BarChart
              height={240}
              dataset={m.byType}
              xAxis={[{ scaleType: 'band', dataKey: 'type' }]}
              series={[{ dataKey: 'sqm', label: 'Sqm', color: '#1f6f5c' }]}
              margin={{ left: 60, right: 10, top: 10, bottom: 30 }}
              slotProps={{ legend: { hidden: true } }}
            />
          </SectionCard>
        </Grid>
        <Grid item xs={12} lg={6}>
          <SectionCard title="Recent activity">
            <Stack gap={1.25}>
              {state.notifications.slice(0, 7).map((n) => (
                <Stack key={n.id} direction="row" gap={1.5} alignItems="flex-start">
                  <PersonAvatar person={teamById[n.userId]} size={28} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography fontSize={13.5}>{n.message}</Typography>
                    <Typography variant="caption" color="text.secondary">{fromNow(n.timestamp)}</Typography>
                  </Box>
                </Stack>
              ))}
            </Stack>
          </SectionCard>
        </Grid>
      </Grid>
    </Box>
  );
}
