import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import AssessmentRoundedIcon from '@mui/icons-material/AssessmentRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import { useLocation, useNavigate } from 'react-router-dom';

const items = [
  { label: 'Dashboard', value: '/app', icon: <DashboardRoundedIcon /> },
  { label: 'Admissions', value: '/app/admissions', icon: <SchoolRoundedIcon /> },
  { label: 'ID Cards', value: '/app/id-cards', icon: <BadgeRoundedIcon /> },
  { label: 'Report Cards', value: '/app/report-cards', icon: <AssessmentRoundedIcon /> },
  { label: 'Settings', value: '/app/settings', icon: <SettingsRoundedIcon /> },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const value = items.find((item) => location.pathname.startsWith(item.value))?.value || '/app';
  return (
    <Paper sx={{ position: 'fixed', left: 0, right: 0, bottom: 0, borderTop: '1px solid', borderColor: 'divider' }} elevation={6}>
      <BottomNavigation value={value} onChange={(_, next) => navigate(next)} showLabels>
        {items.map((item) => <BottomNavigationAction key={item.value} {...item} />)}
      </BottomNavigation>
    </Paper>
  );
}
