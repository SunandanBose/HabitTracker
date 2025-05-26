import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  styled,
  useTheme,
  useMediaQuery,
  alpha
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  padding: theme.spacing(1.5, 3),
  fontSize: '1rem',
  fontWeight: 600,
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
  transition: 'all 0.3s ease',
  '&:hover': {
    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.25)',
    transform: 'translateY(-2px)',
    background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${alpha(theme.palette.primary.dark, 0.9)} 100%)`,
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1.2, 2.5),
    fontSize: '0.9rem',
  }
}));

const ButtonContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  padding: theme.spacing(3, 0),
  marginTop: theme.spacing(2),
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2, 0),
  }
}));

interface StartNewHabitButtonProps {
  onAddHabit: (habitName: string) => void;
}

const StartNewHabitButton: React.FC<StartNewHabitButtonProps> = ({
  onAddHabit,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [habitName, setHabitName] = useState('');

  const handleOpenDialog = () => {
    setDialogOpen(true);
    setHabitName('');
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setHabitName('');
  };

  const handleAddHabit = () => {
    if (habitName.trim()) {
      onAddHabit(habitName.trim());
      handleCloseDialog();
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleAddHabit();
    }
  };

  return (
    <>
      <ButtonContainer>
        <StyledButton
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
          size={isMobile ? "medium" : "large"}
        >
          Start a new habit
        </StyledButton>
      </ButtonContainer>

      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          elevation: 8,
          sx: {
            borderRadius: 2,
            padding: 1
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, fontSize: '1.25rem' }}>
          Start a New Habit
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Habit Name"
            fullWidth
            value={habitName}
            onChange={(e) => setHabitName(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="e.g., Drink 8 glasses of water, Exercise for 30 minutes"
            sx={{ mt: 2 }}
            helperText="Enter a clear, specific habit you want to track daily"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={handleCloseDialog}
            color="inherit"
            variant="outlined"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAddHabit} 
            variant="contained" 
            disableElevation
            disabled={!habitName.trim()}
          >
            Start Tracking
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default StartNewHabitButton; 