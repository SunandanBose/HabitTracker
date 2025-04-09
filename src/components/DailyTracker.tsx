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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format } from 'date-fns';

// Define a proper type for row data
interface TrackerRow {
  id: number;
  date: string;
  day: string;
  month: string;
  comment: string;
  [key: string]: any; // This allows dynamic column names
}

interface DailyTrackerProps {
  data: any[];
  customColumns: string[];
  onAddColumn: (columnName: string) => void;
  onAddRow: (row: any) => void;
  onUpdateRow: (row: any) => void;
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
  const [newColumnDialog, setNewColumnDialog] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [newRowMode, setNewRowMode] = useState(false);
  const [newRow, setNewRow] = useState<any>({
    date: format(new Date(), 'yyyy-MM-dd'),
    day: format(new Date(), 'EEE'),
    month: format(new Date(), 'MMMM'),
    comment: '',
  });
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

  const handleAddRow = () => {
    const newRowData: TrackerRow = {
      id: Date.now(),
      date: newRow.date,
      day: newRow.day,
      month: newRow.month,
      comment: newRow.comment || '',
    };
    
    customColumns.forEach(column => {
      newRowData[column] = Boolean(newRow[column]);
    });
    
    onAddRow(newRowData);
    
    // Reset state after adding
    setNewRow({
      date: format(new Date(), 'yyyy-MM-dd'),
      day: format(new Date(), 'EEE'),
      month: format(new Date(), 'MMMM'),
      comment: '',
    });
    setSelectedDate(new Date());
    setNewRowMode(false); // Exit new row mode
  };

  const handleCheckboxChange = (rowId: number, column: string, checked: boolean) => {
    const rowIndex = data.findIndex(row => row.id === rowId);
    if (rowIndex !== -1) {
      const updatedRow = {...data[rowIndex], [column]: checked};
      onUpdateRow(updatedRow);
    }
  };

  return (
    <Paper sx={{ p: 2, mt: 2, position: 'relative' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Daily Tracker</Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setNewColumnDialog(true)}
            sx={{ mr: 1 }}
          >
            Add Column
          </Button>
          <Button variant="contained" onClick={onSave}>
            Save
          </Button>
        </Box>
      </Box>

      <TableContainer>
        <Table>
          <TableHead>
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
          </TableHead>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.id}</TableCell>
                <TableCell>{row.date}</TableCell>
                <TableCell>{row.day}</TableCell>
                <TableCell>{row.month}</TableCell>
                {customColumns.map((column) => (
                  <TableCell key={column}>
                    <Checkbox
                      checked={Boolean(row[column])}
                      onChange={(e) => handleCheckboxChange(row.id, column, e.target.checked)}
                    />
                  </TableCell>
                ))}
                <TableCell>{row.comment}</TableCell>
                <TableCell></TableCell>
              </TableRow>
            ))}
            
            {/* Show new row form only when in new row mode */}
            {newRowMode && (
              <TableRow>
                <TableCell>{data.length + 1}</TableCell>
                <TableCell>
                  <DatePicker
                    value={selectedDate}
                    onChange={handleDateChange}
                  />
                </TableCell>
                <TableCell>{newRow.day}</TableCell>
                <TableCell>{newRow.month}</TableCell>
                {customColumns.map((column) => (
                  <TableCell key={column}>
                    <Checkbox
                      checked={Boolean(newRow[column])}
                      onChange={(e) =>
                        setNewRow({ ...newRow, [column]: e.target.checked })
                      }
                    />
                  </TableCell>
                ))}
                <TableCell>
                  <TextField
                    size="small"
                    value={newRow.comment || ''}
                    onChange={(e) =>
                      setNewRow({ ...newRow, comment: e.target.value })
                    }
                  />
                </TableCell>
                <TableCell>
                  <IconButton onClick={handleAddRow} color="primary">
                    <AddIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            )}
            
            {/* Show empty row with message if no data and not in new row mode */}
            {data.length === 0 && !newRowMode && (
              <TableRow>
                <TableCell colSpan={5 + customColumns.length + 1} align="center">
                  <Typography variant="body1" sx={{ py: 2 }}>
                    No data available. Click the "Add Row" button to create a new entry.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Floating action button to add a new row */}
      {!newRowMode && (
        <Fab 
          color="primary" 
          aria-label="add" 
          onClick={() => setNewRowMode(true)}
          sx={{ position: 'absolute', bottom: 16, right: 16 }}
        >
          <AddIcon />
        </Fab>
      )}

      <Dialog open={newColumnDialog} onClose={() => setNewColumnDialog(false)}>
        <DialogTitle>Add New Column</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Column Name"
            fullWidth
            value={newColumnName}
            onChange={(e) => setNewColumnName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewColumnDialog(false)}>Cancel</Button>
          <Button onClick={handleAddColumn} variant="contained">
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default DailyTracker;