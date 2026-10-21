import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Card, Chip, Dialog, IconButton, ImageList, ImageListItem, ImageListItemBar, Stack, ToggleButton, ToggleButtonGroup, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import OpenInNewIcon from '@mui/icons-material/OpenInNewRounded';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightIcon from '@mui/icons-material/ChevronRightRounded';
import { useApp } from '../store/AppContext.jsx';
import { PageHeader } from '../components/common.jsx';
import { fmtDate, sum } from '../utils/format';

export default function PortfolioPage() {
  const { state, clientById, venueById } = useApp();
  const navigate = useNavigate();
  const theme = useTheme();
  const mdUp = useMediaQuery(theme.breakpoints.up('md'));
  const [filter, setFilter] = useState('All');
  const [lb, setLb] = useState(null); // {items, index}

  const projects = useMemo(() => state.events.filter((e) => e.images.length > 0).sort((a, b) => b.startDate.localeCompare(a.startDate)), [state.events]);
  const industries = useMemo(() => ['All', ...new Set(projects.map((p) => clientById[p.clientId]?.industry).filter(Boolean))], [projects, clientById]);
  const shown = filter === 'All' ? projects : projects.filter((p) => clientById[p.clientId]?.industry === filter);
  const allImages = shown.flatMap((p) => p.images.map((src) => ({ src, p })));

  return (
    <Box>
      <PageHeader title="Portfolio" subtitle={`${projects.length} built stalls · ${sum(projects, 'stallSizeSqm').toLocaleString('en-IN')} m² delivered · from the JD EVENTS credentials deck`} />
      <Box sx={{ borderRadius: 3, overflow: 'hidden', mb: 3, position: 'relative', minHeight: 260, backgroundImage: 'linear-gradient(to right, rgba(11,46,36,0.95) 30%, rgba(11,46,36,0.2)), url(/images/portfolio/kobelco-1.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', color: '#fff', p: { xs: 3, md: 5 }, display: 'flex', alignItems: 'center' }}>
        <Box sx={{ maxWidth: 520 }}>
          <Typography variant="overline" sx={{ color: '#c9a24a' }}>CREDENTIALS</Typography>
          <Typography variant="h3" sx={{ color: '#fff', lineHeight: 1.1, mb: 1.5 }}>Stalls that stop footfall.</Typography>
          <Typography sx={{ opacity: 0.85 }}>From a 64 m² confectionery pavilion at Jio World Centre to a 900 m² outdoor machinery arena at EXCON — design, fabrication and installation delivered end to end.</Typography>
        </Box>
      </Box>
      <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mb: 2.5 }}>
        {industries.map((i) => <Chip key={i} label={i} onClick={() => setFilter(i)} color={filter === i ? 'primary' : 'default'} variant={filter === i ? 'filled' : 'outlined'} />)}
      </Stack>
      <ImageList variant="masonry" cols={mdUp ? 3 : 1} gap={14}>
        {allImages.map(({ src, p }, i) => (
          <ImageListItem key={src + i} sx={{ borderRadius: 2.5, overflow: 'hidden', cursor: 'zoom-in', '& img': { transition: 'transform .3s' }, '&:hover img': { transform: 'scale(1.03)' } }} onClick={() => setLb({ items: allImages, index: i })}>
            <img src={src} alt={p.title} loading="lazy" />
            <ImageListItemBar
              title={p.title}
              subtitle={`${venueById[p.venueId]?.city} · ${fmtDate(p.startDate, 'MMM YYYY')} · ${p.stallSizeSqm} m²`}
              actionIcon={<IconButton sx={{ color: 'rgba(255,255,255,0.8)' }} onClick={(e) => { e.stopPropagation(); navigate(`/events/${p.id}`); }}><OpenInNewIcon fontSize="small" /></IconButton>}
              sx={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75), rgba(0,0,0,0))' }}
            />
          </ImageListItem>
        ))}
      </ImageList>
      <Dialog open={!!lb} onClose={() => setLb(null)} maxWidth="xl" PaperProps={{ sx: { bgcolor: '#000', border: 0 } }}>
        {lb && (
          <Box sx={{ position: 'relative' }}>
            <img src={lb.items[lb.index].src} alt="" style={{ maxWidth: '92vw', maxHeight: '86vh', display: 'block' }} />
            <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, p: 2, color: '#fff', background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}>
              <Typography fontWeight={700}>{lb.items[lb.index].p.title}</Typography>
              <Typography variant="caption">{clientById[lb.items[lb.index].p.clientId]?.name} · {venueById[lb.items[lb.index].p.venueId]?.name} · {lb.index + 1}/{lb.items.length}</Typography>
            </Box>
            <IconButton sx={{ position: 'absolute', left: 8, top: '50%', color: '#fff', bgcolor: 'rgba(0,0,0,0.4)' }} onClick={() => setLb({ ...lb, index: (lb.index - 1 + lb.items.length) % lb.items.length })}><ChevronLeftIcon /></IconButton>
            <IconButton sx={{ position: 'absolute', right: 8, top: '50%', color: '#fff', bgcolor: 'rgba(0,0,0,0.4)' }} onClick={() => setLb({ ...lb, index: (lb.index + 1) % lb.items.length })}><ChevronRightIcon /></IconButton>
          </Box>
        )}
      </Dialog>
    </Box>
  );
}
