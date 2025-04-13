import React, { useState } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  Typography,
  Box,
  Fab,
  useTheme,
  useMediaQuery,
  alpha,
  styled,
  Grid,
  FormControl,
  FormControlLabel,
  InputLabel
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format } from 'date-fns';

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
  marginBottom: theme.spacing(4),
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

const StyledCheckbox = styled(Checkbox)(({ theme }) => ({
  color: theme.palette.primary.main,
  '&.Mui-checked': {
    color: theme.palette.primary.dark,
  }
}));

const AddButton = styled(Fab)(({ theme }) => ({
  position: 'fixed',
  bottom: theme.spacing(3),
  right: theme.spacing(3),
  boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
  zIndex: 1000,
  [theme.breakpoints.down('sm')]: {
    bottom: theme.spacing(2),
    right: theme.spacing(2),
  }
}));

const HeaderBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: theme.spacing(3),
  flexWrap: 'wrap',
  gap: theme.spacing(2),
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  }
}));

const ButtonsContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1),
  [theme.breakpoints.down('sm')]: {
    width: '100%',
    justifyContent: 'space-between',
  }
}));

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.spacing(1),
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
  transition: 'transform 0.2s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
  }
}));

const ReadOnlyField = styled(TextField)(({ theme }) => ({
  '& .MuiInputBase-input': {
    color: theme.palette.text.secondary,
  },
  '& .MuiOutlinedInput-root': {
    backgroundColor: alpha(theme.palette.action.disabledBackground, 0.3),
  }
}));

// Define a proper type for row data
interface TrackerRow {
  id: number;
  slNo: number; // Separate sequential Sl No from the ID
  date: string;
  day: string;
  month: string;
  comment: string;
  [key: string]: any; // This allows dynamic column names
}

// Interface for the new row form
interface NewRowForm {
  date: string;
  day: string;
  month: string;
  comment: string;
  [key: string]: any; // Allow dynamic properties for custom columns
}

interface DailyTrackerProps {
  data: TrackerRow[]; // Properly type the data prop
  customColumns: string[];
  onAddColumn: (columnName: string) => void;
  onAddRow: (row: TrackerRow) => void;
  onUpdateRow: (row: TrackerRow) => void;
  onSave: () => void;
}

const DailyTracker: React.FC<DailyTrackerProps> = ({
  data,
  customColumns,
  onAddColumn,
  onAddRow,
  onUpdateRow,
  onSave,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [newColumnDialog, setNewColumnDialog] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [newRowDialog, setNewRowDialog] = useState(false);
  
  // Initialize form data
  const initializeNewRowForm = (): NewRowForm => {
    const today = new Date();
    const formData: NewRowForm = {
      date: format(today, 'yyyy-MM-dd'),
      day: format(today, 'EEE'),
      month: format(today, 'MMMM'),
      comment: '',
    };
    
    // Initialize all custom columns to false
    customColumns.forEach(col => {
      formData[col] = false;
    });
    
    return formData;
  };
  
  const [newRow, setNewRow] = useState<NewRowForm>(initializeNewRowForm());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const handleAddColumn = () => {
    if (newColumnName.trim()) {
      onAddColumn(newColumnName.trim());
      setNewColumnName('');
      setNewColumnDialog(false);
    }
  };

  const handleDateChange = (date: Date | null) => {
    if (date) {
      setSelectedDate(date);
      setNewRow({
        ...newRow,
        date: format(date, 'yyyy-MM-dd'),
        day: format(date, 'EEE'),
        month: format(date, 'MMMM'),
      });
    }
  };

  // Get the next sequential number
  const getNextSlNo = () => {
    if (data.length === 0) return 1;
    
    try {
      // First check if there are any existing rows with slNo
      const rowsWithSlNo = data.filter(row => row && typeof row.slNo === 'number');
      
      if (rowsWithSlNo.length === 0) {
        return 1; // If no rows have slNo, start with 1
      }
      
      // Find the highest serial number and add 1
      const highestSlNo = Math.max(...rowsWithSlNo.map(row => row.slNo));
      
      // Check if the result is valid
      return isFinite(highestSlNo) && highestSlNo > 0 ? highestSlNo + 1 : data.length + 1;
    } catch (error) {
      // Fallback to length + 1 if there's any error
      console.error('Error calculating next SlNo:', error);
      return data.length + 1;
    }
  };

  const handleOpenNewRowDialog = () => {
    setNewRow(initializeNewRowForm());
    setSelectedDate(new Date());
    setNewRowDialog(true);
  };

  const handleCloseNewRowDialog = () => {
    setNewRowDialog(false);
  };

  const handleAddRow = () => {
    // Validate required fields
    if (!newRow.date) {
      console.log('Cannot add row: date is required');
      return;
    }
    
    // Calculate the next sequential number
    const nextSlNo = getNextSlNo();
    
    // Create new row with proper sequential number and unique ID
    const newRowData: TrackerRow = {
      id: Date.now(), // Unique ID for React keys and updates
      slNo: nextSlNo, // Sequential number for display
      date: newRow.date,
      day: newRow.day,
      month: newRow.month,
      comment: newRow.comment || '',
    };
    
    // Add custom column values
    customColumns.forEach(column => {
      newRowData[column] = Boolean(newRow[column]);
    });
    
    // Add the row to data - use a callback to ensure we have the latest state
    onAddRow(newRowData);
    
    // Close dialog and reset form for next entry
    handleCloseNewRowDialog();
  };

  const handleCheckboxChange = (rowId: number, column: string, checked: boolean) => {
    const rowIndex = data.findIndex(row => row.id === rowId);
    if (rowIndex !== -1) {
      const updatedRow = {...data[rowIndex], [column]: checked};
      onUpdateRow(updatedRow);
    }
  };

  return (
    <StyledPaper elevation={3}>
      <HeaderBox>
        <Typography variant="h5" color="primary" fontWeight="600">
          Daily Tracker
        </Typography>
        <ButtonsContainer>
          <StyledButton
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setNewColumnDialog(true)}
            size={isMobile ? "small" : "medium"}
          >
            Add Column
          </StyledButton>
          <StyledButton 
            variant="contained" 
            onClick={onSave}
            size={isMobile ? "small" : "medium"}
          >
            Save
          </StyledButton>
        </ButtonsContainer>
      </HeaderBox>

      <StyledTableContainer>
        <Table sx={{ minWidth: isMobile ? undefined : 650 }} stickyHeader>
          <StyledTableHead>
            <TableRow>
              <TableCell>Sl No.</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Day</TableCell>
              <TableCell>Month</TableCell>
              {customColumns.map((column) => (
                <TableCell key={column}>{column}</TableCell>
              ))}
              <TableCell>Comment</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </StyledTableHead>
          <TableBody>
            {data.map((row) => (
              <StyledTableRow key={row.id}>
                <TableCell>{row.slNo || row.id}</TableCell>
                <TableCell>{row.date}</TableCell>
                <TableCell>{row.day}</TableCell>
                <TableCell>{row.month}</TableCell>
                {customColumns.map((column) => (
                  <TableCell key={column} align="center">
                    <StyledCheckbox
                      checked={Boolean(row[column])}
                      onChange={(e) => handleCheckboxChange(row.id, column, e.target.checked)}
                    />
                  </TableCell>
                ))}
                <TableCell>{row.comment}</TableCell>
                <TableCell></TableCell>
              </StyledTableRow>
            ))}
            
            {/* Show empty row with message if no data */}
            {data.length === 0 && (
              <TableRow>
                <TableCell colSpan={5 + customColumns.length + 1} align="center" sx={{ py: 6 }}>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                    No data available. Click the "Add Row" button to create a new entry.
                  </Typography>
                  <StyledButton 
                    variant="outlined" 
                    startIcon={<AddIcon />}
                    onClick={handleOpenNewRowDialog}
                  >
                    Add Row
                  </StyledButton>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </StyledTableContainer>
      
      {/* Floating action button to add a new row */}
      {data.length > 0 && (
        <AddButton 
          color="primary" 
          aria-label="add" 
          onClick={handleOpenNewRowDialog}
          data-testid="add-row-fab"
          size={isMobile ? "medium" : "large"}
        >
          <AddIcon />
        </AddButton>
      )}

      {/* New Column Dialog */}
      <Dialog 
        open={newColumnDialog} 
        onClose={() => setNewColumnDialog(false)}
        PaperProps={{
          elevation: 8,
          sx: {
            borderRadius: 2,
            padding: 1
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Add New Column</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Column Name"
            fullWidth
            value={newColumnName}
            onChange={(e) => setNewColumnName(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setNewColumnDialog(false)}>Cancel</Button>
          <Button onClick={handleAddColumn} variant="contained" disableElevation>
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* New Row Dialog */}
      <Dialog
        open={newRowDialog}
        onClose={handleCloseNewRowDialog}
        maxWidth="md"
        PaperProps={{
          elevation: 8,
          sx: {
            borderRadius: 2,
            padding: 1,
            width: '100%'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Add New Tracker Entry</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Box sx={{ mb: 3 }}>
                <InputLabel sx={{ mb: 1, fontWeight: 500 }}>Date</InputLabel>
                <DatePicker
                  value={selectedDate}
                  onChange={handleDateChange}
                  slotProps={{ 
                    textField: { 
                      fullWidth: true,
                      size: 'medium'
                    } 
                  }}
                />
              </Box>
            </Grid>

            <Grid item xs={12} sm={3}>
              <Box sx={{ mb: 3 }}>
                <InputLabel sx={{ mb: 1, fontWeight: 500 }}>Day</InputLabel>
                <ReadOnlyField
                  fullWidth
                  value={newRow.day}
                  disabled
                  size="medium"
                />
              </Box>
            </Grid>

            <Grid item xs={12} sm={3}>
              <Box sx={{ mb: 3 }}>
                <InputLabel sx={{ mb: 1, fontWeight: 500 }}>Month</InputLabel>
                <ReadOnlyField
                  fullWidth
                  value={newRow.month}
                  disabled
                  size="medium"
                />
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ mb: 3 }}>
                <InputLabel sx={{ mb: 1, fontWeight: 500 }}>Comment</InputLabel>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  value={newRow.comment || ''}
                  onChange={(e) => setNewRow({ ...newRow, comment: e.target.value })}
                  placeholder="Add any notes or comments"
                  size="medium"
                />
              </Box>
            </Grid>

            {customColumns.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
                  Habits
                </Typography>
                <Grid container spacing={2}>
                  {customColumns.map((column) => (
                    <Grid item xs={12} sm={6} md={4} key={column}>
                      <FormControl component="fieldset">
                        <FormControlLabel
                          control={
                            <StyledCheckbox
                              checked={Boolean(newRow[column])}
                              onChange={(e) =>
                                setNewRow({ ...newRow, [column]: e.target.checked })
                              }
                            />
                          }
                          label={<Typography variant="body1">{column}</Typography>}
                        />
                      </FormControl>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={handleCloseNewRowDialog} 
            color="inherit"
            variant="outlined"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAddRow} 
            variant="contained" 
            disableElevation
            color="primary"
            data-testid="add-row-button"
          >
            Add Entry
          </Button>
        </DialogActions>
      </Dialog>
    </StyledPaper>
  );
};

export default DailyTracker;