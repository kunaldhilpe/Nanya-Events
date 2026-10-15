import React, { useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Box, Button, Card, CardContent, Chip, Grid, Rating, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography, Divider } from '@mui/material';
import { BarChart } from '@mui/x-charts';
import { useApp } from '../../store/AppContext.jsx';
import { PageHeader, StatusChip, KeyValue, SectionCard, EmptyState } from '../../components/common.jsx';
import { fmtRange, sum, groupBy, fmtINR } from '../../utils/format';

export default function VenueDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, clientById } = useApp();
  const venue = state.venues.find((v) => v.id === id);
  const events = useMemo(() => state.events.filter((e) => e.venueId === id).sort((a, b) => b.startDate.localeCompare(a.startDate)), [state.events, id]);
  if (!venue) return <EmptyState icon="📍" title="Venue not found" message="" action={<Button component={Link} to="/venues">Back to venues</Button>} />;

  const byHall = Object.entries(groupBy(events, 'hall')).map(([hall, arr]) => ({ hall, count: arr.length, sqm: sum(arr, 'stallSizeSqm') })).sort((a, b) => b.count - a.count);
  const exhibitions = [...new Set(events.map((e) => e.exhibition))];

  return (
    <Box>
      <PageHeader title={venue.name} subtitle={venue.address} crumbs={[{ label: 'Venues', to: '/venues' }, { label: venue.name }]}
        actions={<Button variant="contained" component={Link} to={`/calendar`}>Open calendar</Button>} />
      <Grid container spacing={2.5}>
        <Grid item xs={12} md={4}>
          <Stack gap={2.5}>
            <Card><CardContent>
              <Rating value={venue.rating} precision={0.1} readOnly sx={{ mb: 1.5 }} />
              <Stack gap={1.5}>
                <KeyValue label="City" value={`${venue.city}, ${venue.state}`} />
                <KeyValue label="Indoor exhibition area" value={`${venue.indoorAreaSqm.toLocaleString('en-IN')} m²`} />
                <KeyValue label="Venue contact" value={`${venue.contact?.name} · ${venue.contact?.phone}`} />
                <Divider />
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>Halls</Typography>
                  <Stack direction="row" gap={0.5} flexWrap="wrap" sx={{ mt: 0.5 }}>{venue.halls.map((h) => <Chip key={h} size="small" label={h} />)}</Stack>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>Facilities</Typography>
                  <Stack direction="row" gap={0.5} flexWrap="wrap" sx={{ mt: 0.5 }}>{venue.facilities.map((h) => <Chip key={h} size="small" variant="outlined" label={h} />)}</Stack>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>Exhibitions hosted</Typography>
                  <Stack direction="row" gap={0.5} flexWrap="wrap" sx={{ mt: 0.5 }}>{exhibitions.map((h) => <Chip key={h} size="small" color="primary" variant="outlined" label={h} />)}</Stack>
                </Box>
              </Stack>
            </CardContent></Card>
            <Card><CardContent>
              <Grid container spacing={2}>
                {[['Projects', events.length], ['Total sqm built', sum(events, 'stallSizeSqm').toLocaleString('en-IN')], ['Project value', fmtINR(sum(events, 'budget'), true)], ['Halls used', byHall.length]].map(([l, v]) => (
                  <Grid item xs={6} key={l}><Typography variant="caption" color="text.secondary">{l}</Typography><Typography variant="h6">{v}</Typography></Grid>
                ))}
              </Grid>
            </CardContent></Card>
          </Stack>
        </Grid>
        <Grid item xs={12} md={8}>
          <Stack gap={2.5}>
            <SectionCard title="Stalls built by hall">
              {byHall.length ? <BarChart height={200} dataset={byHall} xAxis={[{ scaleType: 'band', dataKey: 'hall' }]} series={[{ dataKey: 'sqm', label: 'Sqm', color: '#1f6f5c' }]} margin={{ left: 50, right: 10, top: 10, bottom: 30 }} slotProps={{ legend: { hidden: true } }} /> : <Typography color="text.secondary">No projects at this venue yet.</Typography>}
            </SectionCard>
            <SectionCard title="Projects at this venue" noPadding>
              <Table size="small">
                <TableHead><TableRow><TableCell>Project</TableCell><TableCell>Client</TableCell><TableCell>Hall / stall</TableCell><TableCell>Dates</TableCell><TableCell align="right">Sqm</TableCell><TableCell>Status</TableCell></TableRow></TableHead>
                <TableBody>
                  {events.map((e) => (
                    <TableRow key={e.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/events/${e.id}`)}>
                      <TableCell><Typography fontWeight={600} fontSize={14}>{e.title}</Typography></TableCell>
                      <TableCell>{clientById[e.clientId]?.name}</TableCell>
                      <TableCell>{e.hall} · {e.stallNo}</TableCell>
                      <TableCell>{fmtRange(e.startDate, e.endDate)}</TableCell>
                      <TableCell align="right">{e.stallSizeSqm}</TableCell>
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
