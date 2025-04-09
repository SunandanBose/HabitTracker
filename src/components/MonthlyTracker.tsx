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
} from '@mui/material';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

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
    <Paper sx={{ p: 2, mt: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Monthly Overview - {format(selectedMonth, 'MMMM yyyy')}
        </Typography>
        <DatePicker
          value={selectedMonth}
          onChange={(newDate) => newDate && onMonthChange(newDate)}
          views={['year', 'month']}
        />
      </Box>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Habit</TableCell>
              <TableCell>Progress</TableCell>
              <TableCell align="right">Completion</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {monthlyStats.map((stat) => (
              <TableRow key={stat.habit}>
                <TableCell>{stat.habit}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ width: '100%', mr: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={stat.percentage}
                        sx={{
                          height: 10,
                          borderRadius: 5,
                          backgroundColor: '#e0e0e0',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 5,
                          },
                        }}
                      />
                    </Box>
                    <Box sx={{ minWidth: 35 }}>
                      <Typography variant="body2" color="text.secondary">
                        {`${stat.percentage}%`}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell align="right">
                  {stat.completed} / {stat.total} days
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default MonthlyTracker; 