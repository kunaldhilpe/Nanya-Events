import React, { useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  Alert, Autocomplete, Box, Button, Card, CardContent, Chip, Divider, FormControlLabel, Grid, MenuItem, Stack, Step, StepLabel, Stepper,
  Switch, TextField, Typography, Checkbox, ListItemText,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { useApp } from '../../store/AppContext.jsx';
import { useToast } from '../../components/SnackbarProvider.jsx';
import { PageHeader, PersonAvatar } from '../../components/common.jsx';
import { EVENT_STATUSES, STALL_TYPES, PRIORITIES, fmtINR, TODAY } from '../../utils/format';

const RATE = { 'Custom Build': 9500, 'Double Decker': 14500, Modular: 5200, 'Outdoor Pavilion': 7800, 'Design Only': 2500 };
const DELIVERABLES = ['Reception counter', 'Product display podiums', 'LED video wall', 'Meeting room', 'Storage room', 'Hospitality lounge', 'Hanging banner', 'Demo zone', 'VIP area', 'Pantry', 'Mezzanine floor', 'Interactive kiosk'];
const TAGS = ['Flagship', 'Product Launch', 'Double Decker', 'LED Wall', 'Hospitality Lounge', 'Live Demo', 'Heavy Machinery', 'Meeting Rooms', 'Sustainability', 'Interactive Kiosk', 'Branding Heavy', 'Repeat Client'];
const STEPS = ['Basics', 'Venue & dates', 'Stall specification', 'Team & vendors', 'Review'];

function defaultMilestones(start, end) {
  const s = dayjs(start), e = dayjs(end);
  const m = [
    ['Brief received', s.subtract(110, 'day')], ['Concept & 3D render approved', s.subtract(70, 'day')], ['Budget sign-off', s.subtract(50, 'day')],
    ['Fabrication start', s.subtract(30, 'day')], ['Graphics to print', s.subtract(15, 'day')], ['Material dispatch', s.subtract(6, 'day')],
    ['Setup begins', s.subtract(3, 'day')], ['Handover to client', s.subtract(1, 'day')], ['Show opens', s], ['Dismantle complete', e.add(1, 'day')],
  ];
  return m.map(([name, d]) => ({ name, date: d.format('YYYY-MM-DD'), done: d.isBefore(TODAY) }));
}

export default function EventFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const notify = useToast();
  const { state, dispatch, teamById } = useApp();
  const existing = id ? state.events.find((e) => e.id === id) : null;
  const isEdit = !!existing;

  const [step, setStep] = useState(0);
  const [autoBudget, setAutoBudget] = useState(!isEdit);
  const [form, setForm] = useState(() =>
    existing
      ? { ...existing }
      : {
          title: '', clientId: '', exhibition: '', venueId: '', hall: '', stallNo: '', startDate: TODAY.add(60, 'day').format('YYYY-MM-DD'),
          endDate: TODAY.add(63, 'day').format('YYYY-MM-DD'), setupDate: TODAY.add(57, 'day').format('YYYY-MM-DD'), dismantleDate: TODAY.add(64, 'day').format('YYYY-MM-DD'),
          stallSizeSqm: 100, stallType: 'Custom Build', status: 'Planning', priority: 'Medium', progress: 0, budget: 950000, spent: 0,
          projectManagerId: 'TM-002', teamIds: ['TM-002'], vendorIds: [], tags: [], images: [], description: '', openSides: 2, heightM: 4.5, deliverables: [],
        }
  );
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setE = (k) => (e) => set(k, e.target.value);

  const venue = state.venues.find((v) => v.id === form.venueId);
  const client = state.clients.find((c) => c.id === form.clientId);

  const estBudget = useMemo(() => Math.round((Number(form.stallSizeSqm) || 0) * (RATE[form.stallType] || 0) / 1000) * 1000, [form.stallSizeSqm, form.stallType]);
  React.useEffect(() => { if (autoBudget) set('budget', estBudget); }, [estBudget, autoBudget]);

  const errors = useMemo(() => {
    const e = {};
    if (!form.title.trim()) e.title = 'Project title is required';
    if (!form.clientId) e.clientId = 'Pick a client';
    if (!form.exhibition.trim()) e.exhibition = 'Exhibition name is required';
    if (!form.venueId) e.venueId = 'Pick a venue';
    if (!form.hall) e.hall = 'Pick a hall';
    if (dayjs(form.endDate).isBefore(form.startDate)) e.endDate = 'End date must be after start date';
    if (!(Number(form.stallSizeSqm) > 0)) e.stallSizeSqm = 'Stall size must be positive';
    if (!(Number(form.budget) > 0)) e.budget = 'Budget must be positive';
    if (!form.projectManagerId) e.projectManagerId = 'Assign a project manager';
    return e;
  }, [form]);

  const stepErrors = [
    ['title', 'clientId', 'exhibition'], ['venueId', 'hall', 'endDate'], ['stallSizeSqm', 'budget'], ['projectManagerId'], [],
  ];
  const stepHasErrors = (i) => stepErrors[i].some((k) => errors[k]);

  const save = () => {
    if (Object.keys(errors).length) {
      notify('Fix the highlighted fields before saving', 'error');
      setStep(stepErrors.findIndex((ks) => ks.some((k) => errors[k])));
      return;
    }
    const teamIds = [...new Set([form.projectManagerId, ...form.teamIds])];
    const item = { ...form, teamIds, stallSizeSqm: Number(form.stallSizeSqm), budget: Number(form.budget), heightM: Number(form.heightM), openSides: Number(form.openSides) };
    if (isEdit) {
      dispatch({ type: 'UPDATE', entity: 'events', id, patch: item });
      notify('Project updated');
      navigate(`/events/${id}`);
    } else {
      const milestones = defaultMilestones(form.startDate, form.endDate);
      dispatch({ type: 'ADD', entity: 'events', item: { ...item, milestones, createdAt: TODAY.format('YYYY-MM-DD') } });
      notify('Project created');
      navigate('/events');
    }
  };

  const field = (k, props = {}) => ({ value: form[k] ?? '', onChange: setE(k), error: !!errors[k], helperText: errors[k], fullWidth: true, ...props });

  return (
    <Box>
      <PageHeader
        title={isEdit ? `Edit · ${existing.title}` : 'New exhibition project'}
        subtitle={isEdit ? 'Update project details. Changes save to your browser.' : 'Capture the brief and set up the project in five short steps.'}
        crumbs={[{ label: 'Events', to: '/events' }, { label: isEdit ? existing.title : 'New' }]}
      />
      <Grid container spacing={2.5}>
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <Stepper activeStep={step} alternativeLabel sx={{ mb: 4 }}>
                {STEPS.map((s, i) => (
                  <Step key={s} completed={i < step && !stepHasErrors(i)}>
                    <StepLabel error={i < step && stepHasErrors(i)} onClick={() => setStep(i)} sx={{ cursor: 'pointer' }}>{s}</StepLabel>
                  </Step>
                ))}
              </Stepper>

              {step === 0 && (
                <Grid container spacing={2}>
                  <Grid item xs={12}><TextField label="Project title" placeholder="e.g. Okaya EV – EV India Expo 2027" {...field('title')} autoFocus /></Grid>
                  <Grid item xs={12} md={6}>
                    <TextField select label="Client" {...field('clientId')}>
                      {state.clients.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={6}><TextField label="Exhibition / show" placeholder="e.g. ELECRAMA 2027" {...field('exhibition')} /></Grid>
                  <Grid item xs={12} md={4}>
                    <TextField select label="Status" {...field('status')}>{EVENT_STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField select label="Priority" {...field('priority')}>{PRIORITIES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField>
                  </Grid>
                  <Grid item xs={12} md={4}><TextField label="Progress %" type="number" inputProps={{ min: 0, max: 100 }} {...field('progress')} /></Grid>
                  <Grid item xs={12}>
                    <Autocomplete multiple options={TAGS} value={form.tags} onChange={(e, v) => set('tags', v)} renderInput={(p) => <TextField {...p} label="Tags" />} renderTags={(v, getTagProps) => v.map((o, i) => <Chip size="small" label={o} {...getTagProps({ index: i })} key={o} />)} />
                  </Grid>
                  <Grid item xs={12}><TextField label="Brief / description" multiline minRows={3} {...field('description')} /></Grid>
                </Grid>
              )}

              {step === 1 && (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={7}>
                    <TextField select label="Venue" {...field('venueId')} onChange={(e) => { set('venueId', e.target.value); set('hall', ''); }}>
                      {state.venues.map((v) => <MenuItem key={v.id} value={v.id}>{v.name} — {v.city}</MenuItem>)}
                    </TextField>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <TextField select label="Hall" {...field('hall')} disabled={!venue}>
                      {(venue?.halls || []).map((h) => <MenuItem key={h} value={h}>{h}</MenuItem>)}
                    </TextField>
                  </Grid>
                  <Grid item xs={6} md={2}><TextField label="Stall no." {...field('stallNo')} /></Grid>
                  {[['setupDate', 'Setup starts'], ['startDate', 'Show opens'], ['endDate', 'Show closes'], ['dismantleDate', 'Dismantle by']].map(([k, l]) => (
                    <Grid item xs={6} md={3} key={k}>
                      <DatePicker label={l} value={dayjs(form[k])} onChange={(v) => v && set(k, v.format('YYYY-MM-DD'))} slotProps={{ textField: { fullWidth: true, size: 'small', error: !!errors[k], helperText: errors[k] } }} />
                    </Grid>
                  ))}
                  {venue && (
                    <Grid item xs={12}>
                      <Alert severity="info" variant="outlined">{venue.name}, {venue.address}. Facilities: {venue.facilities.join(', ')}.</Alert>
                    </Grid>
                  )}
                </Grid>
              )}

              {step === 2 && (
                <Grid container spacing={2}>
                  <Grid item xs={6} md={3}><TextField label="Stall size (m²)" type="number" {...field('stallSizeSqm')} /></Grid>
                  <Grid item xs={6} md={3}>
                    <TextField select label="Stall type" {...field('stallType')}>{STALL_TYPES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <TextField select label="Open sides" {...field('openSides')}>{[1, 2, 3, 4].map((s) => <MenuItem key={s} value={s}>{s} side{s > 1 ? 's' : ''}</MenuItem>)}</TextField>
                  </Grid>
                  <Grid item xs={6} md={3}><TextField label="Max height (m)" type="number" {...field('heightM')} /></Grid>
                  <Grid item xs={12} md={6}>
                    <TextField label="Budget (₹)" type="number" {...field('budget')} disabled={autoBudget} />
                    <FormControlLabel control={<Switch size="small" checked={autoBudget} onChange={(e) => setAutoBudget(e.target.checked)} />} label={<Typography variant="caption">Auto-estimate from size × type rate ({fmtINR(RATE[form.stallType])}/m²)</Typography>} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'action.hover' }}>
                      <Typography variant="caption" color="text.secondary">ESTIMATE</Typography>
                      <Typography variant="h5">{fmtINR(estBudget)}</Typography>
                      <Typography variant="caption" color="text.secondary">{form.stallSizeSqm} m² × {fmtINR(RATE[form.stallType])}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField select label="Deliverables" SelectProps={{ multiple: true, renderValue: (v) => v.join(', ') }} value={form.deliverables} onChange={(e) => set('deliverables', e.target.value)} fullWidth>
                      {DELIVERABLES.map((d) => (
                        <MenuItem key={d} value={d}><Checkbox size="small" checked={form.deliverables.includes(d)} /><ListItemText primary={d} /></MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                </Grid>
              )}

              {step === 3 && (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField select label="Project manager" {...field('projectManagerId')}>
                      {state.team.filter((t) => t.department === 'Project Management' || t.department === 'Leadership').map((t) => <MenuItem key={t.id} value={t.id}>{t.name} — {t.role}</MenuItem>)}
                    </TextField>
                  </Grid>
                  <Grid item xs={12}>
                    <Autocomplete multiple options={state.team} getOptionLabel={(o) => `${o.name} (${o.role})`} value={state.team.filter((t) => form.teamIds.includes(t.id))} onChange={(e, v) => set('teamIds', v.map((x) => x.id))}
                      renderInput={(p) => <TextField {...p} label="Team members" />} renderTags={(v, getTagProps) => v.map((o, i) => <Chip size="small" avatar={<PersonAvatar person={o} size={20} />} label={o.name} {...getTagProps({ index: i })} key={o.id} />)} />
                  </Grid>
                  <Grid item xs={12}>
                    <Autocomplete multiple options={state.vendors} groupBy={(o) => o.category} getOptionLabel={(o) => o.name} value={state.vendors.filter((v) => form.vendorIds.includes(v.id))} onChange={(e, v) => set('vendorIds', v.map((x) => x.id))}
                      renderInput={(p) => <TextField {...p} label="Vendors" />} renderTags={(v, getTagProps) => v.map((o, i) => <Chip size="small" label={`${o.name} · ${o.category}`} {...getTagProps({ index: i })} key={o.id} />)} />
                  </Grid>
                </Grid>
              )}

              {step === 4 && (
                <Box>
                  {Object.keys(errors).length > 0 && <Alert severity="error" sx={{ mb: 2 }}>{Object.values(errors).join(' · ')}</Alert>}
                  <Grid container spacing={2}>
                    {[
                      ['Title', form.title], ['Client', client?.name], ['Exhibition', form.exhibition], ['Venue', venue ? `${venue.name} · ${form.hall} · Stall ${form.stallNo || '—'}` : '—'],
                      ['Dates', `${form.startDate} → ${form.endDate}`], ['Setup / dismantle', `${form.setupDate} / ${form.dismantleDate}`],
                      ['Stall', `${form.stallSizeSqm} m² ${form.stallType}, ${form.openSides}-side open, ${form.heightM} m`], ['Budget', fmtINR(form.budget)],
                      ['PM', teamById[form.projectManagerId]?.name], ['Team', form.teamIds.map((t) => teamById[t]?.name).join(', ') || '—'],
                      ['Vendors', form.vendorIds.length], ['Deliverables', form.deliverables.join(', ') || '—'],
                    ].map(([l, v]) => (
                      <Grid item xs={12} sm={6} key={l}>
                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em' }}>{l}</Typography>
                        <Typography fontSize={14}>{v || '—'}</Typography>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}

              <Divider sx={{ my: 3 }} />
              <Stack direction="row" justifyContent="space-between">
                <Button disabled={step === 0} onClick={() => setStep((s) => s - 1)}>Back</Button>
                <Stack direction="row" gap={1}>
                  <Button component={Link} to={isEdit ? `/events/${id}` : '/events'}>Cancel</Button>
                  {step < STEPS.length - 1 ? (
                    <Button variant="contained" onClick={() => setStep((s) => s + 1)}>Next</Button>
                  ) : (
                    <Button variant="contained" color="secondary" onClick={save}>{isEdit ? 'Save changes' : 'Create project'}</Button>
                  )}
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} lg={4}>
          <Card sx={{ position: 'sticky', top: 80 }}>
            <CardContent>
              <Typography variant="overline" color="text.secondary">Live summary</Typography>
              <Typography variant="h6" sx={{ mb: 1 }}>{form.title || 'Untitled project'}</Typography>
              <Stack gap={1}>
                <Row l="Client" v={client?.name} />
                <Row l="Venue" v={venue ? `${venue.name}${form.hall ? ` · ${form.hall}` : ''}` : null} />
                <Row l="Dates" v={`${dayjs(form.startDate).format('DD MMM')} – ${dayjs(form.endDate).format('DD MMM YYYY')}`} />
                <Row l="Size" v={`${form.stallSizeSqm} m² · ${form.stallType}`} />
                <Row l="Budget" v={fmtINR(form.budget)} />
                <Row l="PM" v={teamById[form.projectManagerId]?.name} />
                <Row l="Team" v={`${form.teamIds.length} members`} />
                <Row l="Vendors" v={`${form.vendorIds.length} selected`} />
              </Stack>
              <Divider sx={{ my: 2 }} />
              <Typography variant="caption" color="text.secondary">
                {isEdit ? 'Editing an existing project. Milestones are preserved.' : 'A default milestone plan (brief → dismantle) is generated from the show dates.'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

function Row({ l, v }) {
  return (
    <Stack direction="row" justifyContent="space-between" gap={2}>
      <Typography variant="body2" color="text.secondary">{l}</Typography>
      <Typography variant="body2" fontWeight={600} textAlign="right">{v || '—'}</Typography>
    </Stack>
  );
}
