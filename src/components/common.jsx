import React from 'react';
import {
  Avatar, AvatarGroup, Box, Breadcrumbs, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent,
  DialogContentText, DialogTitle, LinearProgress, Stack, Tooltip, Typography, Link as MuiLink, alpha,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { statusColors, priorityColors, taskStatusColors } from '../theme/theme';
import { initials } from '../utils/format';

export function StatusChip({ status, size = 'small', variant, onLight = false, sx }) {
  const color = statusColors[status] || taskStatusColors[status] || '#6b7280';
  return (
    <Chip
      size={size}
      label={status}
      variant={variant}
      sx={{
        bgcolor: onLight ? '#fff' : alpha(color, 0.12),
        color,
        border: `1px solid ${alpha(color, 0.35)}`,
        '& .MuiChip-label': { px: 1 },
        ...sx,
      }}
    />
  );
}

export function PriorityChip({ priority, size = 'small', onLight = false, sx }) {
  const color = priorityColors[priority] || '#6b7280';
  return (
    <Chip
      size={size}
      label={priority}
      sx={{ bgcolor: onLight ? '#fff' : alpha(color, 0.1), color, fontWeight: 700, height: 22, ...sx }}
    />
  );
}

// Branded placeholder for projects that have no site photos / renders yet.
export function EventPlaceholder({ event, client, height = 160 }) {
  const c = client?.color || '#1f6f5c';
  return (
    <Box
      sx={{
        height, position: 'relative', overflow: 'hidden',
        background: `linear-gradient(135deg, ${c} 0%, ${alpha(c, 0.55)} 60%, #0b2e24 100%)`,
        display: 'flex', alignItems: 'flex-end', p: 1.5, color: '#fff',
      }}
    >
      <Box sx={{ position: 'absolute', inset: 0, opacity: 0.18, backgroundImage: 'repeating-linear-gradient(45deg, #fff 0 1px, transparent 1px 14px)' }} />
      <Box sx={{ position: 'absolute', top: 12, right: 14, fontFamily: '"Space Grotesk"', fontWeight: 700, fontSize: 40, opacity: 0.25, lineHeight: 1 }}>{initials(client?.name || 'NA')}</Box>
      <Box sx={{ position: 'relative' }}>
        <Typography sx={{ fontSize: 11, letterSpacing: '0.12em', fontWeight: 700, opacity: 0.85 }}>RENDER PENDING</Typography>
        <Typography sx={{ fontSize: 13, fontWeight: 600, opacity: 0.95 }} noWrap>{event?.exhibition}</Typography>
      </Box>
    </Box>
  );
}

export function PersonAvatar({ person, size = 32, sx }) {
  if (!person) return <Avatar sx={{ width: size, height: size, ...sx }}>?</Avatar>;
  return (
    <Tooltip title={`${person.name} · ${person.role || ''}`}>
      <Avatar sx={{ width: size, height: size, bgcolor: person.color, fontSize: size * 0.38, fontWeight: 700, ...sx }}>
        {initials(person.name)}
      </Avatar>
    </Tooltip>
  );
}

export function TeamAvatars({ ids = [], teamById, max = 4, size = 28 }) {
  return (
    <AvatarGroup max={max} sx={{ '& .MuiAvatar-root': { width: size, height: size, fontSize: size * 0.38 } }}>
      {ids.map((id) => (
        <PersonAvatar key={id} person={teamById[id]} size={size} />
      ))}
    </AvatarGroup>
  );
}

export function StatCard({ title, value, sub, icon, color = 'primary', trend, onClick }) {
  return (
    <Card
      onClick={onClick}
      sx={{
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        overflow: 'hidden',
        '&:hover': onClick ? { boxShadow: 4, transform: 'translateY(-2px)' } : {},
      }}
    >
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="overline" color="text.secondary">{title}</Typography>
            <Typography variant="h4" sx={{ mt: 0.5, lineHeight: 1.1 }}>{value}</Typography>
            {sub && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>{sub}</Typography>
            )}
          </Box>
          {icon && (
            <Box
              sx={(t) => ({
                width: 44, height: 44, borderRadius: 2.5, display: 'grid', placeItems: 'center',
                bgcolor: alpha(t.palette[color].main, 0.12), color: t.palette[color].main,
              })}
            >
              {icon}
            </Box>
          )}
        </Stack>
        {trend != null && (
          <Typography variant="caption" sx={{ color: trend >= 0 ? 'success.main' : 'error.main', fontWeight: 700 }}>
            {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}% vs last quarter
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

export function PageHeader({ title, subtitle, crumbs = [], actions }) {
  return (
    <Box sx={{ mb: 3 }}>
      {crumbs.length > 0 && (
        <Breadcrumbs sx={{ mb: 0.5, fontSize: 13 }}>
          {crumbs.map((c, i) =>
            c.to ? (
              <MuiLink key={i} component={RouterLink} to={c.to} underline="hover" color="inherit">{c.label}</MuiLink>
            ) : (
              <Typography key={i} color="text.primary" fontSize={13}>{c.label}</Typography>
            )
          )}
        </Breadcrumbs>
      )}
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }} gap={2}>
        <Box>
          <Typography variant="h4">{title}</Typography>
          {subtitle && <Typography color="text.secondary" sx={{ mt: 0.5 }}>{subtitle}</Typography>}
        </Box>
        {actions && <Stack direction="row" gap={1} flexWrap="wrap">{actions}</Stack>}
      </Stack>
    </Box>
  );
}

export function ProgressBar({ value, color, height = 8, label }) {
  return (
    <Box sx={{ width: '100%' }}>
      {label && (
        <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
          <Typography variant="caption" color="text.secondary">{label}</Typography>
          <Typography variant="caption" fontWeight={700}>{value}%</Typography>
        </Stack>
      )}
      <LinearProgress
        variant="determinate"
        value={Math.min(100, Math.max(0, value))}
        sx={{
          height, borderRadius: height,
          bgcolor: (t) => alpha(t.palette.text.primary, 0.08),
          '& .MuiLinearProgress-bar': { borderRadius: height, bgcolor: color },
        }}
      />
    </Box>
  );
}

export function ConfirmDialog({ open, title, message, onCancel, onConfirm, confirmText = 'Delete', color = 'error' }) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button onClick={onConfirm} color={color} variant="contained">{confirmText}</Button>
      </DialogActions>
    </Dialog>
  );
}

export function EmptyState({ icon, title, message, action }) {
  return (
    <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
      <Box sx={{ fontSize: 48, mb: 1, opacity: 0.5 }}>{icon}</Box>
      <Typography variant="h6" color="text.primary">{title}</Typography>
      <Typography sx={{ mb: 2 }}>{message}</Typography>
      {action}
    </Box>
  );
}

export function SectionCard({ title, action, children, sx, noPadding }) {
  return (
    <Card sx={{ height: '100%', ...sx }}>
      {(title || action) && (
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2.5, pt: 2, pb: 1 }}>
          <Typography variant="h6" fontSize={16}>{title}</Typography>
          {action}
        </Stack>
      )}
      <Box sx={{ px: noPadding ? 0 : 2.5, pb: noPadding ? 0 : 2.5 }}>{children}</Box>
    </Card>
  );
}

export function KeyValue({ label, value }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={500}>{value ?? '—'}</Typography>
    </Box>
  );
}
