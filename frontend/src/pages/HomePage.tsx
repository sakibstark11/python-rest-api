import { Container } from '@mui/material';
import WeeklyEvents from '../components/WeeklyEvents';

export default function HomePage() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <WeeklyEvents />
    </Container>
  );
}
