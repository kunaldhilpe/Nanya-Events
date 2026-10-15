import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box, Button, Card, CardContent, CardMedia, Chip, Grid, IconButton, MenuItem, Stack, TextField, ToggleButton,
  ToggleButtonGroup, Tooltip, Typography, InputAdornment, Menu, ListItemIcon,
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/AddRounded';
import ViewListIcon from '@mui/icons-material/ViewListRounded';
import GridViewIcon from '@mui/icons-material/GridViewRounded';
import SearchIcon from '@mui/icons-material/SearchRounded';
import MoreVertIcon from '@mui/icons-material/MoreVertRounded';
import EditIcon from '@mui/icons-material/EditRounded';
import DeleteIcon from '@mui/icons-material/DeleteRounded';
import ContentCopyIcon from '@mui/icons-material/ContentCopyRounded';
import DownloadIcon from '@mui/icons-material/DownloadRounded';
import { useApp } from '../../store/AppContext.jsx';
import { useToast } from '../../components/SnackbarProvider.jsx';
import { PageHeader, StatusChip, PriorityChip, TeamAvatars, ProgressBar, ConfirmDialog, EventPlaceholder } from '../../components/common.jsx';
import { fmtINR, fmtRange, EVENT_STATUSES, STALL_TYPES, downloadCSV, daysUntil } from '../../utils/format';
import { statusColors } from '../../theme/theme';

export default function EventsPage() {
  const { state, dispatch, clientById, venueById, teamById } = useApp();
  const navigate = useNavigate();
  const notify = useToast();
  const [params, setParams] = useSearchParams();
  const [view, setView] = useState('grid');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState(params.get('status') || 'All');
  const [type, setType] = useState('All');
  const [client, setClient] = useState(params.get('client') || 'All');
  const [year, setYear] = useState('All');
  const [sort, setSort] = useState('startDate-desc');
  const [menu, setMenu] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const years = useMemo(() => [...new Set(state.events.map((e) => e.startDate.slice(0, 4)))].sort().reverse(), [state.events]);

  const rows = useMemo(() => {
    let list = state.events.map((e) => ({
      ...e,
      clientName: clientById[e.clientId]?.name || '',
      venueName: venueById[e.venueId]?.name || '',
      pmName: teamById[e.projectManagerId]?.name || '',
      variance: e.budget - e.spent,
    }));
    const s = q.trim().toLowerCase();
    if (s) list = list.filter((e) => [e.title, e.clientName, e.venueName, e.exhibition, e.hall, e.stallNo].join(' ').toLowerCase().includes(s));
    if (status !== 'All') list = list.filter((e) => e.status === status);
    if (type !== 'All') list = list.filter((e) => e.stallType === type);
    if (client !== 'All') list = list.filter((e) => e.clientId === client);
    if (year !== 'All') list = list.filter((e) => e.startDate.startsWith(year));
    const [key, dir] = sort.split('-');
    list.sort((a, b) => {
      const va = a[key], vb = b[key];
      const c = typeof va === 'number' ? va - vb : String(va).localeCompare(String(vb));
      return dir === 'asc' ? c : -c;
    });
    return list;
  }, [state.events, q, status, type, client, year, sort, clientById, venueById, teamById]);

  const columns = [
    { field: 'id', headerName: 'ID', width: 90 },
    {
      field: 'title', headerName: 'Project', flex: 1.6, minWidth: 240,
      renderCell: (p) => (
        <Box sx={{ py: 0.5, lineHeight: 1.3 }}>
          <Typography fontWeight={600} fontSize={14} component={Link} to={`/events/${p.row.id}`} sx={{ color: 'inherit', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}>{p.value}</Typography>
          <Typography variant="caption" color="text.secondary" display="block">{p.row.exhibition}</Typography>
        </Box>
      ),
    },
    { field: 'clientName', headerName: 'Client', flex: 1, minWidth: 160 },
    { field: 'venueName', headerName: 'Venue', flex: 1, minWidth: 180, valueGetter: (v, row) => `${row.venueName} · ${row.hall}` },
    { field: 'startDate', headerName: 'Show dates', width: 150, valueGetter: (v, row) => fmtRange(row.startDate, row.endDate) },
    { field: 'stallSizeSqm', headerName: 'Sqm', width: 80, type: 'number' },
    { field: 'stallType', headerName: 'Type', width: 130 },
    { field: 'status', headerName: 'Status', width: 130, renderCell: (p) => <StatusChip status={p.value} /> },
    { field: 'priority', headerName: 'Priority', width: 100, renderCell: (p) => <PriorityChip priority={p.value} /> },
    { field: 'progress', headerName: 'Progress', width: 140, renderCell: (p) => <Box sx={{ width: '100%', pr: 1 }}><ProgressBar value={p.value} height={6} color={statusColors[p.row.status]} /></Box> },
    { field: 'budget', headerName: 'Budget', width: 120, type: 'number', valueFormatter: (v) => fmtINR(v, true) },
    { field: 'spent', headerName: 'Spent', width: 120, type: 'number', valueFormatter: (v) => fmtINR(v, true) },
    { field: 'pmName', headerName: 'PM', width: 150 },
    {
      field: 'actions', headerName: '', width: 56, sortable: false, filterable: false,
      renderCell: (p) => <IconButton size="small" onClick={(e) => setMenu({ anchor: e.currentTarget, row: p.row })}><MoreVertIcon fontSize="small" /></IconButton>,
    },
  ];

  const duplicate = (e) => {
    const { id, ...rest } = e;
    dispatch({ type: 'ADD', entity: 'events', item: { ...rest, title: `${e.title} (copy)`, status: 'Planning', progress: 0, spent: 0, images: [], milestones: e.milestones.map((m) => ({ ...m, done: false })) } });
    notify('Event duplicated');
  };
  const remove = (id) => {
    dispatch({ type: 'REMOVE', entity: 'events', id });
    notify('Event deleted', 'info');
    setConfirm(null);
  };

  const exportCSV = () => downloadCSV('nanya-events.csv', rows.map(({ milestones, images, teamIds, vendorIds, deliverables, description, ...r }) => r));

  return (
    <Box>
      <PageHeader
        title="Events & Stalls"
        subtitle={`${rows.length} of ${state.events.length} projects`}
        actions={
          <>
            <Button variant="outlined" startIcon={<DownloadIcon />} onClick={exportCSV}>Export CSV</Button>
            <Button variant="contained" startIcon={<AddIcon />} component={Link} to="/events/new">New event</Button>
          </>
        }
      />

      <Card sx={{ mb: 2.5 }}>
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Stack direction={{ xs: 'column', lg: 'row' }} gap={1.5} alignItems={{ lg: 'center' }}>
            <TextField
              placeholder="Search projects…" value={q} onChange={(e) => setQ(e.target.value)} sx={{ minWidth: 240, flex: 1 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
            />
            <TextField select label="Status" value={status} onChange={(e) => { setStatus(e.target.value); setParams(e.target.value === 'All' ? {} : { status: e.target.value }); }} sx={{ minWidth: 140 }}>
              <MenuItem value="All">All statuses</MenuItem>
              {EVENT_STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
            <TextField select label="Stall type" value={type} onChange={(e) => setType(e.target.value)} sx={{ minWidth: 150 }}>
              <MenuItem value="All">All types</MenuItem>
              {STALL_TYPES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
            <TextField select label="Client" value={client} onChange={(e) => setClient(e.target.value)} sx={{ minWidth: 180 }}>
              <MenuItem value="All">All clients</MenuItem>
              {state.clients.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </TextField>
            <TextField select label="Year" value={year} onChange={(e) => setYear(e.target.value)} sx={{ minWidth: 110 }}>
              <MenuItem value="All">All</MenuItem>
              {years.map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
            </TextField>
            <TextField select label="Sort" value={sort} onChange={(e) => setSort(e.target.value)} sx={{ minWidth: 160 }}>
              <MenuItem value="startDate-desc">Newest first</MenuItem>
              <MenuItem value="startDate-asc">Oldest first</MenuItem>
              <MenuItem value="budget-desc">Budget: high → low</MenuItem>
              <MenuItem value="stallSizeSqm-desc">Size: large → small</MenuItem>
              <MenuItem value="progress-asc">Progress: low → high</MenuItem>
              <MenuItem value="title-asc">Title A → Z</MenuItem>
            </TextField>
            <ToggleButtonGroup exclusive size="small" value={view} onChange={(e, v) => v && setView(v)}>
              <ToggleButton value="grid"><GridViewIcon fontSize="small" /></ToggleButton>
              <ToggleButton value="table"><ViewListIcon fontSize="small" /></ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        </CardContent>
      </Card>

      {view === 'table' ? (
        <Card>
          <DataGrid
            rows={rows}
            columns={columns}
            autoHeight
            rowHeight={60}
            disableRowSelectionOnClick
            initialState={{ pagination: { paginationModel: { pageSize: 15 } } }}
            pageSizeOptions={[10, 15, 25, 50]}
            slots={{ toolbar: GridToolbar }}
            slotProps={{ toolbar: { showQuickFilter: false } }}
            sx={{ border: 0, '& .MuiDataGrid-cell': { display: 'flex', alignItems: 'center' } }}
          />
        </Card>
      ) : (
        <Grid container spacing={2.5}>
          {rows.map((e) => {
            const d = daysUntil(e.startDate);
            return (
              <Grid item xs={12} sm={6} lg={4} xl={3} key={e.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', '&:hover': { boxShadow: 6, transform: 'translateY(-3px)' } }}>
                  <Box sx={{ position: 'relative', cursor: 'pointer' }} onClick={() => navigate(`/events/${e.id}`)}>
                    {e.images[0] ? (
                      <CardMedia component="img" height="160" image={e.images[0]} alt={e.title} />
                    ) : (
                      <EventPlaceholder event={e} client={clientById[e.clientId]} />
                    )}
                    <Box sx={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 0.75 }}>
                      <StatusChip status={e.status} onLight />
                    </Box>
                    <Box sx={{ position: 'absolute', top: 6, right: 6 }}>
                      <IconButton size="small" sx={{ bgcolor: 'rgba(255,255,255,0.85)', '&:hover': { bgcolor: '#fff' } }} onClick={(ev) => { ev.stopPropagation(); setMenu({ anchor: ev.currentTarget, row: e }); }}><MoreVertIcon fontSize="small" /></IconButton>
                    </Box>
                  </Box>
                  <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box>
                      <Typography fontWeight={700} component={Link} to={`/events/${e.id}`} sx={{ color: 'inherit', textDecoration: 'none', display: 'block', lineHeight: 1.3 }}>{e.title}</Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>{e.venueName} · {e.hall} · Stall {e.stallNo}</Typography>
                    </Box>
                    <Stack direction="row" gap={0.75} flexWrap="wrap">
                      <Chip size="small" variant="outlined" label={`${e.stallSizeSqm} m²`} />
                      <Chip size="small" variant="outlined" label={e.stallType} />
                      <PriorityChip priority={e.priority} />
                    </Stack>
                    <Typography variant="body2" fontWeight={600}>{fmtRange(e.startDate, e.endDate)} <Typography component="span" variant="caption" color={d < 0 ? 'text.secondary' : d <= 7 ? 'error.main' : 'text.secondary'}>· {d < 0 ? `${-d}d ago` : `in ${d}d`}</Typography></Typography>
                    <ProgressBar value={e.progress} label="Progress" height={6} color={statusColors[e.status]} />
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 'auto', pt: 1 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Budget</Typography>
                        <Typography fontWeight={700} fontSize={14}>{fmtINR(e.budget, true)} <Typography component="span" variant="caption" color={e.spent > e.budget ? 'error.main' : 'text.secondary'}>/ {fmtINR(e.spent, true)} spent</Typography></Typography>
                      </Box>
                      <TeamAvatars ids={e.teamIds} teamById={teamById} max={3} size={26} />
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
          {rows.length === 0 && (
            <Grid item xs={12}><Typography color="text.secondary" textAlign="center" py={6}>No projects match these filters.</Typography></Grid>
          )}
        </Grid>
      )}

      <Menu open={!!menu} anchorEl={menu?.anchor} onClose={() => setMenu(null)}>
        <MenuItem onClick={() => { navigate(`/events/${menu.row.id}`); setMenu(null); }}><ListItemIcon><ViewListIcon fontSize="small" /></ListItemIcon>Open</MenuItem>
        <MenuItem onClick={() => { navigate(`/events/${menu.row.id}/edit`); setMenu(null); }}><ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>Edit</MenuItem>
        <MenuItem onClick={() => { duplicate(menu.row); setMenu(null); }}><ListItemIcon><ContentCopyIcon fontSize="small" /></ListItemIcon>Duplicate</MenuItem>
        <MenuItem onClick={() => { setConfirm(menu.row); setMenu(null); }} sx={{ color: 'error.main' }}><ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>Delete</MenuItem>
      </Menu>
      <ConfirmDialog open={!!confirm} title="Delete project?" message={`"${confirm?.title}" and all its tasks and expenses will be removed.`} onCancel={() => setConfirm(null)} onConfirm={() => remove(confirm.id)} />
    </Box>
  );
}
