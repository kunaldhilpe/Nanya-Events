import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Grid, InputAdornment, Rating, Stack, TextField, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/AddRounded';
import SearchIcon from '@mui/icons-material/SearchRounded';
import PlaceIcon from '@mui/icons-material/PlaceRounded';
import { useApp } from '../../store/AppContext.jsx';
import { useToast } from '../../components/SnackbarProvider.jsx';
import { PageHeader } from '../../components/common.jsx';
import { sum } from '../../utils/format';

export default function VenuesPage() {
  const { state, dispatch } = useApp();
  const notify = useToast();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', city: '', state: '', address: '', halls: 'Hall 1, Hall 2', indoorAreaSqm: 10000, facilities: '' });

  const rows = useMemo(() => {
    const s = q.toLowerCase();
    return state.venues
      .map((v) => {
        const evs = state.events.filter((e) => e.venueId === v.id);
        return { ...v, projects: evs.length, upcoming: evs.filter((e) => ['Planning', 'Design', 'Fabrication', 'Installation', 'Live'].includes(e.status)).length, sqm: sum(evs, 'stallSizeSqm') };
      })
      .filter((v) => !s || v.name.toLowerCase().includes(s) || v.city.toLowerCase().includes(s))
      .sort((a, b) => b.projects - a.projects);
  }, [state.venues, state.events, q]);

  const save = () => {
    if (!form.name.trim()) return notify('Venue name is required', 'error');
    dispatch({ type: 'ADD', entity: 'venues', item: { ...form, halls: form.halls.split(',').map((h) => h.trim()).filter(Boolean), facilities: form.facilities.split(',').map((h) => h.trim()).filter(Boolean), indoorAreaSqm: Number(form.indoorAreaSqm), rating: 4.0, contact: { name: 'Exhibitor Services', phone: '' }, lat: 0, lng: 0 } });
    notify('Venue added'); setOpen(false);
  };

  return (
    <Box>
      <PageHeader title="Venues" subtitle={`${state.venues.length} exhibition venues across India`} 
      // actions={<Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>Add venue</Button>} 
      />
      <TextField placeholder="Search venues or cities…" value={q} onChange={(e) => setQ(e.target.value)} fullWidth sx={{ mb: 2.5 }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} />
      <Grid container spacing={2.5}>
        {rows.map((v) => (
          <Grid item xs={12} md={6} lg={4} key={v.id}>
            <Card component={Link} to={`/venues/${v.id}`} sx={{ display: 'block', textDecoration: 'none', color: 'inherit', height: '100%', '&:hover': { boxShadow: 5, transform: 'translateY(-2px)' } }}>
              <Box sx={{ height: 90, background: 'linear-gradient(135deg, #0b2e24, #1f6f5c)', display: 'flex', alignItems: 'flex-end', p: 2, color: '#fff' }}>
                <Stack direction="row" gap={1} alignItems="center"><PlaceIcon sx={{ color: '#c9a24a' }} /><Typography fontWeight={700}>{v.city}, {v.state}</Typography></Stack>
              </Box>
              <CardContent>
                <Typography variant="h6" fontSize={17}>{v.name}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }} noWrap>{v.address}</Typography>
                <Rating value={v.rating} precision={0.1} size="small" readOnly />
                <Grid container sx={{ mt: 1 }}>
                  {[['Halls', v.halls.length], ['Indoor m²', v.indoorAreaSqm.toLocaleString('en-IN')], ['Projects', v.projects], ['Upcoming', v.upcoming]].map(([l, val]) => (
                    <Grid item xs={3} key={l}><Typography variant="caption" color="text.secondary">{l}</Typography><Typography fontWeight={700} fontSize={14}>{val}</Typography></Grid>
                  ))}
                </Grid>
                <Stack direction="row" gap={0.5} flexWrap="wrap" sx={{ mt: 1.5 }}>
                  {v.facilities.slice(0, 4).map((f) => <Chip key={f} size="small" variant="outlined" label={f} sx={{ height: 22, fontSize: 11 }} />)}
                  {v.facilities.length > 4 && <Chip size="small" label={`+${v.facilities.length - 4}`} sx={{ height: 22, fontSize: 11 }} />}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add venue</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            {[['name', 'Venue name', 12], ['city', 'City', 6], ['state', 'State', 6], ['address', 'Address', 12], ['halls', 'Halls (comma separated)', 12], ['indoorAreaSqm', 'Indoor area (m²)', 6], ['facilities', 'Facilities (comma separated)', 12]].map(([k, l, w]) => (
              <Grid item xs={12} sm={w} key={k}><TextField label={l} value={form[k]} onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))} fullWidth /></Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions><Button onClick={() => setOpen(false)}>Cancel</Button><Button variant="contained" onClick={save}>Add</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
