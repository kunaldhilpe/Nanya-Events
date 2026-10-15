import React, { useMemo, useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar, Avatar, Badge, Box, Divider, Drawer, IconButton, InputBase, List, ListItemButton, ListItemIcon,
  ListItemText, Menu, MenuItem, Stack, Toolbar, Tooltip, Typography, alpha, useMediaQuery, Popover, ListSubheader,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import DashboardIcon from '@mui/icons-material/DashboardRounded';
import EventIcon from '@mui/icons-material/EventRounded';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonthRounded';
import TaskAltIcon from '@mui/icons-material/TaskAltRounded';
import BusinessIcon from '@mui/icons-material/BusinessRounded';
import PlaceIcon from '@mui/icons-material/PlaceRounded';
import HandshakeIcon from '@mui/icons-material/HandshakeRounded';
import GroupsIcon from '@mui/icons-material/GroupsRounded';
import PaymentsIcon from '@mui/icons-material/PaymentsRounded';
import Inventory2Icon from '@mui/icons-material/Inventory2Rounded';
import CollectionsIcon from '@mui/icons-material/CollectionsRounded';
import AssessmentIcon from '@mui/icons-material/AssessmentRounded';
import SettingsIcon from '@mui/icons-material/SettingsRounded';
import MenuIcon from '@mui/icons-material/MenuRounded';
import SearchIcon from '@mui/icons-material/SearchRounded';
import NotificationsIcon from '@mui/icons-material/NotificationsRounded';
import DarkModeIcon from '@mui/icons-material/DarkModeRounded';
import LightModeIcon from '@mui/icons-material/LightModeRounded';
import LogoutIcon from '@mui/icons-material/LogoutRounded';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeftRounded';
import TrendingUpIcon from '@mui/icons-material/TrendingUpRounded';
import { useApp } from '../store/AppContext.jsx';
import { useThemeMode } from '../theme/ThemeModeProvider.jsx';
import { Logo } from './Logo.jsx';
import { fromNow, initials } from '../utils/format';

const DRAWER_W = 256;
const DRAWER_MINI = 76;

const NAV = [
  { group: 'Overview', items: [
    { to: '/', label: 'Dashboard', icon: <DashboardIcon /> },
    { to: '/calendar', label: 'Calendar', icon: <CalendarMonthIcon /> },
  ]},
  { group: 'Projects', items: [
    { to: '/events', label: 'Events & Stalls', icon: <EventIcon /> },
    { to: '/tasks', label: 'Task Board', icon: <TaskAltIcon /> },
    { to: '/pipeline', label: 'Sales Pipeline', icon: <TrendingUpIcon /> },
    { to: '/portfolio', label: 'Portfolio', icon: <CollectionsIcon /> },
  ]},
  { group: 'Directory', items: [
    { to: '/clients', label: 'Clients', icon: <BusinessIcon /> },
    { to: '/venues', label: 'Venues', icon: <PlaceIcon /> },
    { to: '/vendors', label: 'Vendors', icon: <HandshakeIcon /> },
    { to: '/team', label: 'Team', icon: <GroupsIcon /> },
  ]},
  { group: 'Operations', items: [
    { to: '/finance', label: 'Finance', icon: <PaymentsIcon /> },
    { to: '/inventory', label: 'Inventory', icon: <Inventory2Icon /> },
    { to: '/reports', label: 'Reports', icon: <AssessmentIcon /> },
    { to: '/settings', label: 'Settings', icon: <SettingsIcon /> },
  ]},
];

function SidebarContent({ mini, onToggleMini, onNavigate }) {
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#0b2e24', color: '#e8f3ee' }}>
      <Stack direction="row" alignItems="center" justifyContent={mini ? 'center' : 'space-between'} sx={{ px: mini ? 1 : 2.5, py: 2.25 }}>
        <Logo compact={mini} light />
        {!mini && (
          <IconButton size="small" onClick={onToggleMini} sx={{ color: 'inherit', opacity: 0.7, display: { xs: 'none', md: 'inline-flex' } }}>
            <ChevronLeftIcon />
          </IconButton>
        )}
      </Stack>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />
      <Box sx={{ flex: 1, overflowY: 'auto', py: 1 }}>
        {NAV.map((g) => (
          <List
            key={g.group}
            dense
            subheader={!mini && (
              <ListSubheader sx={{ bgcolor: 'transparent', color: 'rgba(232,243,238,0.45)', fontSize: 11, letterSpacing: '0.12em', lineHeight: '32px' }}>
                {g.group.toUpperCase()}
              </ListSubheader>
            )}
          >
            {g.items.map((it) => (
              <NavLink key={it.to} to={it.to} end={it.to === '/'} style={{ textDecoration: 'none', color: 'inherit' }} onClick={onNavigate}>
                {({ isActive }) => (
                  <Tooltip title={mini ? it.label : ''} placement="right">
                    <ListItemButton
                      sx={{
                        mx: 1, my: 0.25, borderRadius: 2, justifyContent: mini ? 'center' : 'flex-start', px: mini ? 1.5 : 2,
                        color: isActive ? '#fff' : 'rgba(232,243,238,0.75)',
                        bgcolor: isActive ? 'rgba(201,162,74,0.22)' : 'transparent',
                        borderLeft: isActive ? '3px solid #c9a24a' : '3px solid transparent',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
                      }}
                    >
                      <ListItemIcon sx={{ color: isActive ? '#c9a24a' : 'inherit', minWidth: mini ? 0 : 38 }}>{it.icon}</ListItemIcon>
                      {!mini && <ListItemText primary={it.label} primaryTypographyProps={{ fontSize: 14, fontWeight: isActive ? 700 : 500 }} />}
                    </ListItemButton>
                  </Tooltip>
                )}
              </NavLink>
            ))}
          </List>
        ))}
      </Box>
      {!mini && (
        <Box sx={{ p: 2, m: 1.5, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.05)', fontSize: 12, color: 'rgba(232,243,238,0.7)' }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#c9a24a', display: 'block' }}>NANYA DESIGN STUDIO</Typography>
          Exhibition stall design & fabrication · Noida / Delhi NCR
        </Box>
      )}
    </Box>
  );
}

export default function AppLayout() {
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
  const { state, dispatch, eventById } = useApp();
  const { mode, toggle } = useThemeMode();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchor, setAnchor] = useState(null);
  const [notifAnchor, setNotifAnchor] = useState(null);
  const [q, setQ] = useState('');
  const [searchAnchor, setSearchAnchor] = useState(null);

  const mini = state.settings.sidebarCollapsed && isMdUp;
  const width = mini ? DRAWER_MINI : DRAWER_W;
  const unread = state.notifications.filter((n) => !n.read).length;
  const user = state.auth.user;

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (s.length < 2) return [];
    const r = [];
    state.events.forEach((e) => e.title.toLowerCase().includes(s) && r.push({ type: 'Event', label: e.title, to: `/events/${e.id}` }));
    state.clients.forEach((c) => c.name.toLowerCase().includes(s) && r.push({ type: 'Client', label: c.name, to: `/clients/${c.id}` }));
    state.venues.forEach((v) => v.name.toLowerCase().includes(s) && r.push({ type: 'Venue', label: v.name, to: `/venues/${v.id}` }));
    state.vendors.forEach((v) => v.name.toLowerCase().includes(s) && r.push({ type: 'Vendor', label: v.name, to: '/vendors' }));
    state.team.forEach((t) => t.name.toLowerCase().includes(s) && r.push({ type: 'Team', label: t.name, to: `/team/${t.id}` }));
    state.tasks.forEach((t) => t.title.toLowerCase().includes(s) && r.length < 40 && r.push({ type: 'Task', label: `${t.title} · ${eventById[t.eventId]?.title || ''}`, to: `/events/${t.eventId}?tab=tasks` }));
    return r.slice(0, 12);
  }, [q, state, eventById]);

  const pageTitle = useMemo(() => {
    const all = NAV.flatMap((g) => g.items);
    const found = all.find((i) => (i.to === '/' ? location.pathname === '/' : location.pathname.startsWith(i.to)));
    return found?.label || 'NANYA';
  }, [location.pathname]);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Drawer
        variant={isMdUp ? 'permanent' : 'temporary'}
        open={isMdUp ? true : mobileOpen}
        onClose={() => setMobileOpen(false)}
        sx={{ width, flexShrink: 0, '& .MuiDrawer-paper': { width, boxSizing: 'border-box', transition: 'width .2s', overflowX: 'hidden' } }}
      >
        <SidebarContent
          mini={mini}
          onToggleMini={() => dispatch({ type: 'SET_SETTING', key: 'sidebarCollapsed', value: !state.settings.sidebarCollapsed })}
          onNavigate={() => setMobileOpen(false)}
        />
      </Drawer>

      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <AppBar
          position="sticky"
          color="inherit"
          sx={{ bgcolor: alpha(theme.palette.background.default, 0.85), backdropFilter: 'blur(10px)', borderBottom: `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}
        >
          <Toolbar sx={{ gap: 1.5 }}>
            {!isMdUp && (
              <IconButton edge="start" onClick={() => setMobileOpen(true)}><MenuIcon /></IconButton>
            )}
            {isMdUp && mini && (
              <IconButton edge="start" onClick={() => dispatch({ type: 'SET_SETTING', key: 'sidebarCollapsed', value: false })}><MenuIcon /></IconButton>
            )}
            <Typography variant="h6" sx={{ display: { xs: 'none', sm: 'block' }, mr: 1 }}>{pageTitle}</Typography>

            <Box
              sx={{
                ml: 'auto', display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.5, borderRadius: 2.5, width: { xs: 160, sm: 280, md: 360 },
                bgcolor: alpha(theme.palette.text.primary, 0.05), border: `1px solid ${theme.palette.divider}`,
              }}
              onClick={(e) => setSearchAnchor(e.currentTarget)}
            >
              <SearchIcon fontSize="small" color="action" />
              <InputBase
                placeholder="Search events, clients, tasks…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                sx={{ flex: 1, fontSize: 14 }}
              />
            </Box>
            <Popover
              open={!!searchAnchor && results.length > 0}
              anchorEl={searchAnchor}
              onClose={() => setSearchAnchor(null)}
              disableAutoFocus
              disableEnforceFocus
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              slotProps={{ paper: { sx: { width: 420, mt: 1 } } }}
            >
              <List dense>
                {results.map((r, i) => (
                  <ListItemButton key={i} onClick={() => { navigate(r.to); setQ(''); setSearchAnchor(null); }}>
                    <ListItemText primary={r.label} secondary={r.type} />
                  </ListItemButton>
                ))}
              </List>
            </Popover>

            <Tooltip title={mode === 'dark' ? 'Light mode' : 'Dark mode'}>
              <IconButton onClick={toggle}>{mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}</IconButton>
            </Tooltip>
            <Tooltip title="Notifications">
              <IconButton onClick={(e) => setNotifAnchor(e.currentTarget)}>
                <Badge badgeContent={unread} color="secondary"><NotificationsIcon /></Badge>
              </IconButton>
            </Tooltip>
            <Popover
              open={!!notifAnchor}
              anchorEl={notifAnchor}
              onClose={() => setNotifAnchor(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              slotProps={{ paper: { sx: { width: 380, maxHeight: 460 } } }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2, py: 1.5 }}>
                <Typography fontWeight={700}>Notifications</Typography>
                <Typography variant="caption" sx={{ cursor: 'pointer', color: 'primary.main', fontWeight: 600 }} onClick={() => dispatch({ type: 'MARK_ALL_NOTIFICATIONS_READ' })}>
                  Mark all read
                </Typography>
              </Stack>
              <Divider />
              <List dense sx={{ overflowY: 'auto', maxHeight: 380 }}>
                {state.notifications.slice(0, 20).map((n) => (
                  <ListItemButton key={n.id} onClick={() => { navigate(`/events/${n.eventId}`); setNotifAnchor(null); dispatch({ type: 'UPDATE', entity: 'notifications', id: n.id, patch: { read: true } }); }}
                    sx={{ bgcolor: n.read ? 'transparent' : alpha(theme.palette.secondary.main, 0.08), alignItems: 'flex-start' }}>
                    <ListItemText primary={n.message} secondary={fromNow(n.timestamp)} primaryTypographyProps={{ fontSize: 13, fontWeight: n.read ? 400 : 600 }} />
                  </ListItemButton>
                ))}
              </List>
            </Popover>

            <IconButton onClick={(e) => setAnchor(e.currentTarget)} sx={{ p: 0.5 }}>
              <Avatar sx={{ width: 34, height: 34, bgcolor: 'secondary.main', color: '#1a1a1a', fontWeight: 700, fontSize: 14 }}>{initials(user?.name || 'NA')}</Avatar>
            </IconButton>
            <Menu open={!!anchor} anchorEl={anchor} onClose={() => setAnchor(null)}>
              <Box sx={{ px: 2, py: 1 }}>
                <Typography fontWeight={700}>{user?.name}</Typography>
                <Typography variant="caption" color="text.secondary">{user?.role}</Typography>
              </Box>
              <Divider />
              <MenuItem onClick={() => { navigate('/settings'); setAnchor(null); }}><ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>Settings</MenuItem>
              <MenuItem onClick={() => { dispatch({ type: 'LOGOUT' }); navigate('/login'); }}><ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>Sign out</MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        <Box component="main" sx={{ flex: 1, p: { xs: 2, md: 3 }, maxWidth: 1600, width: '100%', mx: 'auto' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
