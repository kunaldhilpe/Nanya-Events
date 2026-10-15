import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Button, Card, Chip, Divider, IconButton, MenuItem, Stack, TextField, ToggleButton, ToggleButtonGroup, Tooltip, Typography, alpha, Popover } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightIcon from '@mui/icons-material/ChevronRightRounded';
import dayjs from 'dayjs';
import { useApp } from '../store/AppContext.jsx';
import { PageHeader, StatusChip } from '../components/common.jsx';
import { TODAY, fmtRange, EVENT_STATUSES } from '../utils/format';
import { statusColors } from '../theme/theme';

const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function CalendarPage() {
  const { state, venueById, clientById } = useApp();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const initial = params.get('month') ? dayjs(params.get('month') + '-01') : TODAY;
  const [month, setMonth] = useState(initial.startOf('month'));
  const [mode, setMode] = useState('shows'); // shows | setup
  const [status, setStatus] = useState('All');
  const [pop, setPop] = useState(null);

  const setM = (m) => { setMonth(m); setParams({ month: m.format('YYYY-MM') }); };

  const days = useMemo(() => {
    const start = month.startOf('month');
    const offset = (start.day() + 6) % 7; // monday first
    const first = start.subtract(offset, 'day');
    return Array.from({ length: 42 }, (_, i) => first.add(i, 'day'));
  }, [month]);

  const events = useMemo(() => state.events.filter((e) => status === 'All' || e.status === status), [state.events, status]);

  const eventsOn = (d) =>
    events.filter((e) => {
      const s = dayjs(mode === 'setup' ? e.setupDate : e.startDate), en = dayjs(mode === 'setup' ? e.dismantleDate : e.endDate);
      return !d.isBefore(s, 'day') && !d.isAfter(en, 'day');
    });

  const monthEvents = events.filter((e) => dayjs(e.startDate).isSame(month, 'month') || dayjs(e.endDate).isSame(month, 'month')).sort((a, b) => a.startDate.localeCompare(b.startDate));

  return (
    <Box>
      <PageHeader
        title="Show calendar"
        subtitle="Exhibition dates across all projects. Switch to setup view to see install and dismantle windows."
        actions={
          <>
            <TextField select size="small" value={status} onChange={(e) => setStatus(e.target.value)} sx={{ minWidth: 140 }}>
              <MenuItem value="All">All statuses</MenuItem>
              {EVENT_STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
            <ToggleButtonGroup exclusive size="small" value={mode} onChange={(e, v) => v && setMode(v)}>
              <ToggleButton value="shows">Show days</ToggleButton>
              <ToggleButton value="setup">Setup → dismantle</ToggleButton>
            </ToggleButtonGroup>
          </>
        }
      />

      <Stack direction={{ xs: 'column', lg: 'row' }} gap={2.5} alignItems="flex-start">
        <Card sx={{ flex: 1, width: '100%', overflow: 'hidden' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 2 }}>
            <Stack direction="row" alignItems="center" gap={1}>
              <IconButton onClick={() => setM(month.subtract(1, 'month'))}><ChevronLeftIcon /></IconButton>
              <Typography variant="h5" sx={{ minWidth: 190, textAlign: 'center' }}>{month.format('MMMM YYYY')}</Typography>
              <IconButton onClick={() => setM(month.add(1, 'month'))}><ChevronRightIcon /></IconButton>
            </Stack>
            <Button size="small" variant="outlined" onClick={() => setM(TODAY.startOf('month'))}>Today</Button>
          </Stack>
          <Divider />
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', bgcolor: 'action.hover' }}>
            {DOW.map((d) => <Typography key={d} variant="caption" sx={{ p: 1, textAlign: 'center', fontWeight: 700, color: 'text.secondary' }}>{d}</Typography>)}
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', borderTop: 1, borderColor: 'divider' }}>
            {days.map((d) => {
              const list = eventsOn(d);
              const inMonth = d.isSame(month, 'month');
              const isToday = d.isSame(TODAY, 'day');
              return (
                <Box key={d.format()} sx={{ minWidth: 0, minHeight: 108, p: 0.75, borderRight: 1, borderBottom: 1, borderColor: 'divider', bgcolor: inMonth ? 'transparent' : 'action.hover', opacity: inMonth ? 1 : 0.6 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, display: 'inline-grid', placeItems: 'center', width: 24, height: 24, borderRadius: 12, bgcolor: isToday ? 'secondary.main' : 'transparent', color: isToday ? '#1a1a1a' : 'text.secondary' }}>{d.date()}</Typography>
                  <Stack gap={0.4} sx={{ mt: 0.5 }}>
                    {list.slice(0, 3).map((e) => {
                      const c = statusColors[e.status];
                      const isStart = d.isSame(mode === 'setup' ? e.setupDate : e.startDate, 'day');
                      return (
                        <Tooltip key={e.id} title={`${e.title} · ${fmtRange(e.startDate, e.endDate)}`}>
                          <Box onClick={(ev) => setPop({ anchor: ev.currentTarget, e })} sx={{ fontSize: 11, fontWeight: 600, px: 0.75, py: 0.25, borderRadius: 1, cursor: 'pointer', bgcolor: alpha(c, 0.15), color: c, borderLeft: `3px solid ${c}`, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {isStart ? e.title : '· ' + e.title.split(' – ')[0]}
                          </Box>
                        </Tooltip>
                      );
                    })}
                    {list.length > 3 && <Typography variant="caption" color="text.secondary">+{list.length - 3} more</Typography>}
                  </Stack>
                </Box>
              );
            })}
          </Box>
        </Card>

        <Card sx={{ width: { xs: '100%', lg: 340 }, flexShrink: 0 }}>
          <Typography variant="h6" fontSize={16} sx={{ p: 2, pb: 1 }}>Shows in {month.format('MMMM')}</Typography>
          <Divider />
          <Stack divider={<Divider />}>
            {monthEvents.length === 0 && <Typography color="text.secondary" sx={{ p: 2 }}>No shows scheduled this month.</Typography>}
            {monthEvents.map((e) => (
              <Box key={e.id} sx={{ p: 2, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }} onClick={() => navigate(`/events/${e.id}`)}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography fontWeight={600} fontSize={14} noWrap>{e.title}</Typography>
                    <Typography variant="caption" color="text.secondary" display="block">{fmtRange(e.startDate, e.endDate)}</Typography>
                    <Typography variant="caption" color="text.secondary" noWrap display="block">{venueById[e.venueId]?.name} · {e.hall}</Typography>
                  </Box>
                  <StatusChip status={e.status} />
                </Stack>
              </Box>
            ))}
          </Stack>
        </Card>
      </Stack>

      <Popover open={!!pop} anchorEl={pop?.anchor} onClose={() => setPop(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}>
        {pop && (
          <Box sx={{ p: 2, width: 300 }}>
            <StatusChip status={pop.e.status} />
            <Typography fontWeight={700} sx={{ mt: 1 }}>{pop.e.title}</Typography>
            <Typography variant="body2" color="text.secondary">{clientById[pop.e.clientId]?.name}</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>Show: {fmtRange(pop.e.startDate, pop.e.endDate)}</Typography>
            <Typography variant="body2">Setup: {dayjs(pop.e.setupDate).format('DD MMM')} · Dismantle: {dayjs(pop.e.dismantleDate).format('DD MMM')}</Typography>
            <Typography variant="body2">{venueById[pop.e.venueId]?.name}, {pop.e.hall} · {pop.e.stallSizeSqm} m²</Typography>
            <Button size="small" variant="contained" sx={{ mt: 1.5 }} fullWidth onClick={() => navigate(`/events/${pop.e.id}`)}>Open project</Button>
          </Box>
        )}
      </Popover>
    </Box>
  );
}
