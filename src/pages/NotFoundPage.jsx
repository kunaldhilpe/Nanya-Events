import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <Box sx={{ textAlign: 'center', py: 12 }}>
      <Typography variant="h1" sx={{ fontSize: 96, color: 'secondary.main' }}>404</Typography>
      <Typography variant="h5" sx={{ mb: 1 }}>This stall doesn't exist on the floor plan</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>The page you're looking for was moved, deleted or never built.</Typography>
      <Button component={Link} to="/" variant="contained">Back to dashboard</Button>
    </Box>
  );
}
