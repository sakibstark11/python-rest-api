import { Box, Container, Typography } from '@mui/material';
import WeeklyEvents from '../components/WeeklyEvents';

export default function HomePage() {
  return (
    <Container maxWidth="lg">
      <Box py={4}>
        <Typography variant="h3" component="h1" align="center" gutterBottom>
          Calendar App
        </Typography>
        <WeeklyEvents />
      </Box>
    </Container>
  );
}
