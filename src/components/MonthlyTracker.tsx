import React from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Box,
  LinearProgress,
  useTheme,
  useMediaQuery,
  alpha,
  styled
} from '@mui/material';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

// Style customizations
const StyledPaper = styled(Paper)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.08)',
  overflow: 'hidden',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  '&:hover': {
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
    transform: 'translateY(-2px)'
  },
  padding: theme.spacing(3),
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
    borderRadius: theme.spacing(1.5),
  }
}));

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  maxHeight: '65vh',
  '&::-webkit-scrollbar': {
    width: '8px',
    height: '8px',
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: alpha(theme.palette.primary.main, 0.2),
    borderRadius: '4px',
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: theme.palette.background.paper,
  }
}));

const StyledTableHead = styled(TableHead)(({ theme }) => ({
  '& .MuiTableCell-head': {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  }
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: alpha(theme.palette.primary.light, 0.05),
  },
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.light, 0.1),
    transition: 'background-color 0.2s ease',
  },
  transition: 'background-color 0.2s ease',
}));

const DatePickerContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'flex-end',
  marginBottom: theme.spacing(2),
  [theme.breakpoints.down('sm')]: {
    justifyContent: 'center',
  }
}));

const StyledLinearProgress = styled(LinearProgress)(({ theme }) => ({
  height: 12,
  borderRadius: 6,
  backgroundColor: alpha(theme.palette.grey[300], 0.8),
  '& .MuiLinearProgress-bar': {
    borderRadius: 6,
    backgroundImage: `linear-gradient(to right, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
  }
}));

interface MonthlyTrackerProps {
  data: any[];
  customColumns: string[];
  selectedMonth: Date;
  onMonthChange: (date: Date) => void;
}

const MonthlyTracker: React.FC<MonthlyTrackerProps> = ({
  data,
  customColumns,
  selectedMonth,
  onMonthChange,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const calculateMonthlyStats = () => {
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd }).length;

    const monthlyData = customColumns.map((column) => {
      const monthEntries = data.filter(
        (entry) =>
          entry.month.toLowerCase() === format(selectedMonth, 'MMMM').toLowerCase()
      );

      const completedDays = monthEntries.filter((entry) => entry[column]).length;
      const percentage = (completedDays / daysInMonth) * 100;

      return {
        habit: column,
        completed: completedDays,
        total: daysInMonth,
        percentage: Math.round(percentage),
      };
    });

    return monthlyData;
  };

  const monthlyStats = calculateMonthlyStats();

  return (
    <StyledPaper elevation={3}>
      <DatePickerContainer>
        <DatePicker
          value={selectedMonth}
          onChange={(newDate) => newDate && onMonthChange(newDate)}
          views={['year', 'month']}
          slotProps={{ 
            textField: { 
              size: isMobile ? 'small' : 'medium',
              sx: { minWidth: 150 }
            } 
          }}
        />
      </DatePickerContainer>

      <StyledTableContainer>
        <Table sx={{ minWidth: isMobile ? undefined : 650 }} stickyHeader>
          <StyledTableHead>
            <TableRow>
              <TableCell>Habit</TableCell>
              <TableCell>Progress</TableCell>
              <TableCell align="right">Completion</TableCell>
            </TableRow>
          </StyledTableHead>
          <TableBody>
            {monthlyStats.length > 0 ? (
              monthlyStats.map((stat) => (
                <StyledTableRow key={stat.habit}>
                  <TableCell>
                    <Typography fontWeight="500">{stat.habit}</Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <Box sx={{ width: '100%', mr: 1 }}>
                        <StyledLinearProgress
                          variant="determinate"
                          value={stat.percentage}
                        />
                      </Box>
                      <Box sx={{ minWidth: 45, textAlign: 'right' }}>
                        <Typography 
                          variant="body2" 
                          color={stat.percentage > 70 ? 'primary.main' : 'text.secondary'}
                          fontWeight={stat.percentage > 70 ? 600 : 400}
                        >
                          {`${stat.percentage}%`}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 500,
                        color: stat.percentage > 70 ? 'primary.main' : 'text.secondary'
                      }}
                    >
                      {`${stat.completed}/${stat.total}`}
                    </Typography>
                  </TableCell>
                </StyledTableRow>
              ))
            ) : (
              <StyledTableRow>
                <TableCell colSpan={3} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                    No habits tracked yet. Add some habits in the Daily Tracker to see your monthly progress.
                  </Typography>
                </TableCell>
              </StyledTableRow>
            )}
          </TableBody>
        </Table>
      </StyledTableContainer>
    </StyledPaper>
  );
};

export default MonthlyTracker; 