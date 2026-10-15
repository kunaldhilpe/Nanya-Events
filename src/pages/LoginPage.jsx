import React, { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Box, Button, Card, CardContent, Stack, TextField, Typography, Alert, MenuItem, Chip } from '@mui/material';
import { useApp } from '../store/AppContext.jsx';
import { Logo } from '../layout/Logo.jsx';

export default function LoginPage() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [userId, setUserId] = useState('TM-002');
  const [password, setPassword] = useState('nanya123');
  const [error, setError] = useState('');

  if (state.auth.isAuthenticated) return <Navigate to="/" replace />;

  const submit = (e) => {
    e.preventDefault();
    if (password !== 'nanya123') {
      setError('Invalid credentials. Demo password is nanya123.');
      return;
    }
    const user = state.team.find((t) => t.id === userId);
    dispatch({ type: 'LOGIN', user });
    navigate(location.state?.from?.pathname || '/', { replace: true });
  };

  return (
    <Box
      sx={{
        minHeight: '100vh', display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.1fr 1fr' },
      }}
    >
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' }, flexDirection: 'column', justifyContent: 'space-between', p: 6, color: '#e8f3ee',
          background: 'linear-gradient(160deg, #0b2e24 0%, #143f33 60%, #0b2e24 100%)', position: 'relative', overflow: 'hidden',
        }}
      >
        <Box sx={{ position: 'absolute', inset: 0, backgroundImage: 'url(/images/portfolio/adani-1.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.18 }} />
        <Box sx={{ position: 'relative' }}><Logo light size={1.3} /></Box>
        <Box sx={{ position: 'relative', maxWidth: 520 }}>
          <Typography variant="overline" sx={{ color: '#c9a24a' }}>EXHIBITION & EVENT PROJECT MANAGER</Typography>
          <Typography variant="h3" sx={{ mt: 1, mb: 2, lineHeight: 1.15 }}>
            Every stall, from brief to dismantle, in one place.
          </Typography>
          <Typography sx={{ opacity: 0.8 }}>
            Track design approvals, fabrication, vendors, budgets and on-site installation across every expo on the calendar —
            EV India, ELECRAMA, World Food India, EXCON and more.
          </Typography>
          <Stack direction="row" gap={1} sx={{ mt: 3, flexWrap: 'wrap' }}>
            {['Okaya', 'Adani', "Hershey's", 'Eaton', 'Grundfos', 'Canara Bank', 'CG Power', 'Kobelco'].map((c) => (
              <Chip key={c} label={c} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: '#fff' }} />
            ))}
          </Stack>
        </Box>
        <Typography variant="caption" sx={{ position: 'relative', opacity: 0.6 }}>© 2026 NANYA Design Studio · Frontend demo, all data stored locally in your browser.</Typography>
      </Box>

      <Box sx={{ display: 'grid', placeItems: 'center', p: 3, bgcolor: 'background.default' }}>
        <Card sx={{ width: '100%', maxWidth: 420 }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: { md: 'none' }, mb: 3 }}><Logo /></Box>
            <Typography variant="h5">Welcome back</Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>Sign in to the NANYA project workspace</Typography>
            <form onSubmit={submit}>
              <Stack gap={2}>
                <TextField select label="Sign in as" value={userId} onChange={(e) => setUserId(e.target.value)} fullWidth>
                  {state.team.map((t) => (
                    <MenuItem key={t.id} value={t.id}>{t.name} — {t.role}</MenuItem>
                  ))}
                </TextField>
                <TextField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} fullWidth helperText="Demo password: nanya123" />
                {error && <Alert severity="error">{error}</Alert>}
                <Button type="submit" variant="contained" size="large">Sign in</Button>
              </Stack>
            </form>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
