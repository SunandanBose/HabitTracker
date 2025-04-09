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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format } from 'date-fns';

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
  const [newRow, setNewRow] = useState<any>({
    date: new Date(),
    day: '',
    month: '',
  });

  const handleAddColumn = () => {
    if (newColumnName.trim()) {
      onAddColumn(newColumnName.trim());
      setNewColumnName('');
      setNewColumnDialog(false);
    }
  };

  const handleDateChange = (date: Date | null) => {
    if (date) {
      const day = format(date, 'EEE');
      const month = format(date, 'MMMM');
      setNewRow({
        ...newRow,
        date: format(date, 'yyyy-MM-dd'),
        day,
        month,
      });
    }
  };

  const handleAddRow = () => {
    const rowWithId = {
      ...newRow,
      id: data.length + 1,
    };
    onAddRow(rowWithId);
    setNewRow({
      date: new Date(),
      day: '',
      month: '',
    });
  };

  const handleCheckboxChange = (rowId: number, column: string, checked: boolean) => {
    const updatedRow = data.find((row) => row.id === rowId);
    if (updatedRow) {
      onUpdateRow({
        ...updatedRow,
        [column]: checked,
      });
    }
  };

  return (
    <Paper sx={{ p: 2, mt: 2 }}>
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
                      checked={row[column] || false}
                      onChange={(e) => handleCheckboxChange(row.id, column, e.target.checked)}
                    />
                  </TableCell>
                ))}
                <TableCell>{row.comment}</TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell>{data.length + 1}</TableCell>
              <TableCell>
                <DatePicker
                  value={newRow.date ? new Date(newRow.date) : null}
                  onChange={handleDateChange}
                />
              </TableCell>
              <TableCell>{newRow.day}</TableCell>
              <TableCell>{newRow.month}</TableCell>
              {customColumns.map((column) => (
                <TableCell key={column}>
                  <Checkbox
                    checked={newRow[column] || false}
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
          </TableBody>
        </Table>
      </TableContainer>

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