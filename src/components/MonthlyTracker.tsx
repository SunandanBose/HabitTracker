import React, { useState, useEffect } from 'react';
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
  useTheme,
  useMediaQuery,
  alpha,
  styled,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tooltip,
  CircularProgress
} from '@mui/material';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import DeleteIcon from '@mui/icons-material/Delete';
import CalendarViewMonthIcon from '@mui/icons-material/CalendarViewMonth';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

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

const StatusIconButton = styled(IconButton)(({ theme }) => ({
  padding: theme.spacing(0.5),
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.1),
  }
}));

const DeleteIconButton = styled(IconButton)(({ theme }) => ({
  padding: theme.spacing(0.5),
  color: theme.palette.error.main,
  '&:hover': {
    backgroundColor: alpha(theme.palette.error.main, 0.1),
  }
}));

const CompletionButton = styled(Button)(({ theme }) => ({
  minWidth: 'auto',
  padding: theme.spacing(0.5, 1),
  fontSize: '0.875rem',
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.1),
  }
}));

const CalendarContainer = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(7, 1fr)',
  gap: theme.spacing(0.5),
  padding: theme.spacing(2),
  maxWidth: 350,
}));

const CalendarDay = styled(Box)<{ completed?: boolean }>(({ theme, completed }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 40,
  height: 40,
  borderRadius: theme.spacing(0.5),
  fontSize: '0.875rem',
  backgroundColor: completed ? theme.palette.success.main : 'transparent',
  color: completed ? theme.palette.success.contrastText : theme.palette.text.primary,
  border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
}));

interface TrackerRow {
  id: number;
  slNo: number;
  date: string;
  day: string;
  month: string;
  comment: string;
  [key: string]: any;
}

interface MonthlyTrackerProps {
  data: TrackerRow[];
  customColumns: string[];
  selectedMonth: Date;
  onMonthChange: (date: Date) => void;
  onUpdateRow: (row: TrackerRow) => void;
  onAddRow: (row: TrackerRow) => void;
  onDeleteHabit: (habitName: string) => void;
  onSave: () => void;
}

const MonthlyTracker: React.FC<MonthlyTrackerProps> = ({
  data,
  customColumns,
  selectedMonth,
  onMonthChange,
  onUpdateRow,
  onAddRow,
  onDeleteHabit,
  onSave,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [statusDialog, setStatusDialog] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [completionDialog, setCompletionDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState<string>('');
  const [pendingSave, setPendingSave] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Auto-save effect when pendingSave is true
  useEffect(() => {
    if (pendingSave && !isSaving) {
      console.log('MonthlyTracker: Starting auto-save process');
      const saveData = async () => {
        setIsSaving(true);
        try {
          console.log('MonthlyTracker: Calling onSave function');
          await onSave();
          console.log('MonthlyTracker: Save completed successfully');
        } catch (error) {
          console.error('MonthlyTracker: Failed to save:', error);
        } finally {
          setIsSaving(false);
          setPendingSave(false);
        }
      };
      
      // Small delay to ensure state is fully updated
      const timeoutId = setTimeout(saveData, 200);
      return () => clearTimeout(timeoutId);
    }
  }, [pendingSave, isSaving, onSave]);

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
      const completedDates = monthEntries
        .filter((entry) => entry[column])
        .map((entry) => new Date(entry.date));

      // Check if habit is completed today
      const today = format(new Date(), 'yyyy-MM-dd');
      const todayEntry = data.find(entry => entry.date === today);
      const isCompletedToday = todayEntry ? Boolean(todayEntry[column]) : false;

      return {
        habit: column,
        completed: completedDays,
        total: daysInMonth,
        completedDates,
        isCompletedToday,
      };
    });

    return monthlyData;
  };

  const monthlyStats = calculateMonthlyStats();

  const handleStatusClick = (habitName: string) => {
    setSelectedHabit(habitName);
    setSelectedDate(new Date());
    setStatusDialog(true);
  };

  const handleStatusSubmit = () => {
    console.log('MonthlyTracker: Status submit clicked for habit:', selectedHabit);
    const dateString = format(selectedDate, 'yyyy-MM-dd');
    const dayString = format(selectedDate, 'EEE');
    const monthString = format(selectedDate, 'MMMM');

    // Find existing entry for this date
    const existingEntry = data.find(entry => entry.date === dateString);

    if (existingEntry) {
      console.log('MonthlyTracker: Updating existing entry for date:', dateString);
      // Update existing entry
      const updatedEntry = {
        ...existingEntry,
        [selectedHabit]: true
      };
      onUpdateRow(updatedEntry);
    } else {
      console.log('MonthlyTracker: Creating new entry for date:', dateString);
      // Create new entry for this date
      const newEntry: TrackerRow = {
        id: Date.now(),
        slNo: data.length + 1,
        date: dateString,
        day: dayString,
        month: monthString,
        comment: '',
        // Initialize all custom columns to false, except the selected habit
        ...customColumns.reduce((acc, col) => ({
          ...acc,
          [col]: col === selectedHabit
        }), {})
      };
      onAddRow(newEntry);
    }

    setStatusDialog(false);
    
    // Trigger auto-save
    console.log('MonthlyTracker: Triggering auto-save');
    setPendingSave(true);
  };

  const handleCompletionClick = (habitName: string) => {
    setSelectedHabit(habitName);
    setCompletionDialog(true);
  };

  const handleDeleteClick = (habitName: string) => {
    setHabitToDelete(habitName);
    setDeleteDialog(true);
  };

  const handleDeleteConfirm = () => {
    onDeleteHabit(habitToDelete);
    setDeleteDialog(false);
    setHabitToDelete('');
  };

  const renderCalendar = () => {
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    const habitStats = monthlyStats.find(stat => stat.habit === selectedHabit);
    const completedDates = habitStats?.completedDates || [];

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <CalendarContainer>
        {dayNames.map(day => (
          <Box key={day} sx={{ textAlign: 'center', fontWeight: 'bold', py: 1 }}>
            {day}
          </Box>
        ))}
        {daysInMonth.map(date => {
          const isCompleted = completedDates.some(completedDate => 
            isSameDay(completedDate, date)
          );
          
          return (
            <CalendarDay key={date.toISOString()} completed={isCompleted}>
              {format(date, 'd')}
            </CalendarDay>
          );
        })}
      </CalendarContainer>
    );
  };

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
              <TableCell>Status</TableCell>
              <TableCell>Habit</TableCell>
              <TableCell>Completion</TableCell>
              <TableCell>Delete</TableCell>
            </TableRow>
          </StyledTableHead>
          <TableBody>
            {monthlyStats.length > 0 ? (
              monthlyStats.map((stat) => (
                <StyledTableRow key={stat.habit}>
                  <TableCell>
                    <Tooltip title={stat.isCompletedToday ? "Completed today" : "Mark as completed for today"}>
                      <StatusIconButton 
                        onClick={() => handleStatusClick(stat.habit)}
                        disabled={isSaving}
                      >
                        {isSaving && selectedHabit === stat.habit ? (
                          <CircularProgress size={20} />
                        ) : stat.isCompletedToday ? (
                          <CheckCircleIcon sx={{ color: theme.palette.success.main }} />
                        ) : (
                          <RadioButtonUncheckedIcon />
                        )}
                      </StatusIconButton>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Typography fontWeight="500">{stat.habit}</Typography>
                  </TableCell>
                  <TableCell>
                    <Tooltip title="View completion calendar">
                      <CompletionButton 
                        variant="text" 
                        onClick={() => handleCompletionClick(stat.habit)}
                        startIcon={<CalendarViewMonthIcon />}
                      >
                        {`${stat.completed}/${stat.total}`}
                      </CompletionButton>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Delete habit">
                      <DeleteIconButton onClick={() => handleDeleteClick(stat.habit)}>
                        <DeleteIcon />
                      </DeleteIconButton>
                    </Tooltip>
                  </TableCell>
                </StyledTableRow>
              ))
            ) : (
              <StyledTableRow>
                <TableCell colSpan={4} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                    No habits tracked yet. Add some habits in the Daily Tracker to see your monthly progress.
                  </Typography>
                </TableCell>
              </StyledTableRow>
            )}
          </TableBody>
        </Table>
      </StyledTableContainer>

      {/* Status Dialog */}
      <Dialog open={statusDialog} onClose={() => setStatusDialog(false)}>
        <DialogTitle>Mark Habit as Completed</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Habit: <strong>{selectedHabit}</strong>
            </Typography>
            <DatePicker
              label="Date"
              value={selectedDate}
              onChange={(newDate) => newDate && setSelectedDate(newDate)}
              disabled
              slotProps={{ 
                textField: { 
                  fullWidth: true,
                  size: 'medium'
                } 
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleStatusSubmit} 
            variant="contained"
            disabled={isSaving}
            startIcon={isSaving ? <CircularProgress size={16} /> : undefined}
          >
            {isSaving ? 'Saving...' : 'Submit'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Completion Calendar Dialog */}
      <Dialog open={completionDialog} onClose={() => setCompletionDialog(false)}>
        <DialogTitle>
          Completion Calendar - {selectedHabit}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Green dates indicate completed days
          </Typography>
          {renderCalendar()}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompletionDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Delete Habit</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete the habit "<strong>{habitToDelete}</strong>"?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This will remove the habit from all entries in the daily tracker and cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </StyledPaper>
  );
};

export default MonthlyTracker; 