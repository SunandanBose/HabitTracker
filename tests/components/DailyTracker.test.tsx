import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';
import DailyTracker from '../../src/components/DailyTracker';

// Helper function to wrap component with necessary providers
const renderWithProviders = (ui) => {
  return render(
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      {ui}
    </LocalizationProvider>
  );
};

describe('DailyTracker Component', () => {
  // Mock data and props
  const mockData = [
    {
      id: 1,
      slNo: 1,
      date: '2023-01-01',
      day: 'Sun',
      month: 'January',
      comment: 'Test comment',
      leetcode: true,
      study: false
    }
  ];
  
  const mockCustomColumns = ['leetcode', 'study'];
  
  const mockProps = {
    data: mockData,
    customColumns: mockCustomColumns,
    onAddColumn: jest.fn(),
    onAddRow: jest.fn(),
    onUpdateRow: jest.fn(),
    onSave: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders with initial data', () => {
    renderWithProviders(<DailyTracker {...mockProps} />);
    
    // Check for column headers
    expect(screen.getByText('Sl No.')).toBeInTheDocument();
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Day')).toBeInTheDocument();
    expect(screen.getByText('Month')).toBeInTheDocument();
    expect(screen.getByText('Comment')).toBeInTheDocument();
    
    // Check for custom columns
    expect(screen.getByText('leetcode')).toBeInTheDocument();
    expect(screen.getByText('study')).toBeInTheDocument();
    
    // Check for data rows
    expect(screen.getByText('1')).toBeInTheDocument(); // slNo
    expect(screen.getByText('2023-01-01')).toBeInTheDocument();
    expect(screen.getByText('Sun')).toBeInTheDocument();
    expect(screen.getByText('January')).toBeInTheDocument();
    expect(screen.getByText('Test comment')).toBeInTheDocument();
    
    // Check for Buttons
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText('Add Column')).toBeInTheDocument();
  });
  
  test('renders empty state message when no data', () => {
    renderWithProviders(
      <DailyTracker 
        {...mockProps}
        data={[]}
      />
    );
    
    expect(screen.getByText('No data available. Click the "Add Row" button to create a new entry.')).toBeInTheDocument();
  });
  
  test('opens add column dialog when clicking "Add Column" button', async () => {
    renderWithProviders(<DailyTracker {...mockProps} />);
    
    const addColumnButton = screen.getByText('Add Column');
    fireEvent.click(addColumnButton);
    
    // Dialog should appear
    expect(screen.getByText('Add New Column')).toBeInTheDocument();
    expect(screen.getByLabelText('Column Name')).toBeInTheDocument();
  });
  
  test('calls onAddColumn when adding a new column', async () => {
    renderWithProviders(<DailyTracker {...mockProps} />);
    
    // Open dialog
    const addColumnButton = screen.getByText('Add Column');
    fireEvent.click(addColumnButton);
    
    // Input column name
    const input = screen.getByLabelText('Column Name');
    fireEvent.change(input, { target: { value: 'exercise' } });
    
    // Click add button
    const addButton = screen.getByText('Add').closest('button');
    if (addButton) fireEvent.click(addButton);
    
    // Check if callback was called
    expect(mockProps.onAddColumn).toHaveBeenCalledWith('exercise');
  });
  
  test('clicking "Add Row" button shows new row form', async () => {
    renderWithProviders(<DailyTracker {...mockProps} />);
    
    // Initially, new row form is not visible
    expect(screen.getByTestId('add-row-fab')).toBeInTheDocument();
    
    // Click add row button (Fab)
    const addRowButton = screen.getByTestId('add-row-fab');
    fireEvent.click(addRowButton);
    
    // New row form should be visible
    const today = new Date();
    const todayFormatted = format(today, 'EEE');
    
    // Check for form elements in the new row
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBe(mockData.length * mockCustomColumns.length + mockCustomColumns.length);
    
    // There should be a comment field
    const textField = screen.getByRole('textbox');
    expect(textField).toBeInTheDocument();
  });
  
  test('adds a new row with correct data', async () => {
    renderWithProviders(<DailyTracker {...mockProps} />);
    
    // Click add row button
    const addRowButton = screen.getByTestId('add-row-fab');
    fireEvent.click(addRowButton);
    
    // Enter comment
    const commentField = screen.getByRole('textbox');
    fireEvent.change(commentField, { target: { value: 'New row comment' } });
    
    // Check a checkbox (first custom column)
    const checkboxes = screen.getAllByRole('checkbox');
    const newRowCheckboxes = checkboxes.slice(mockData.length * mockCustomColumns.length);
    fireEvent.click(newRowCheckboxes[0]); // Check first checkbox
    
    // Click the add icon to add the row
    const addRowConfirmButton = screen.getByTestId('add-row-button');
    fireEvent.click(addRowConfirmButton);
    
    // Verify that onAddRow was called with correct data
    expect(mockProps.onAddRow).toHaveBeenCalled();
    const calledWithArg = mockProps.onAddRow.mock.calls[0][0];
    
    // Verify key properties
    expect(calledWithArg).toHaveProperty('slNo', 2); // Next sequential number
    expect(calledWithArg).toHaveProperty('comment', 'New row comment');
    expect(calledWithArg).toHaveProperty('leetcode', true); // We checked this one
    expect(calledWithArg).toHaveProperty('study', false); // This was left unchecked
  });
  
  test('updates row when checkbox is clicked', async () => {
    renderWithProviders(<DailyTracker {...mockProps} />);
    
    // Find the first checkbox in the data row
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]); // Click on the first checkbox
    
    // Verify that onUpdateRow was called with updated row
    expect(mockProps.onUpdateRow).toHaveBeenCalled();
    const updatedRow = mockProps.onUpdateRow.mock.calls[0][0];
    
    // The updated value should be the opposite of the original
    expect(updatedRow.leetcode).toBe(!mockData[0].leetcode);
  });
  
  test('calls onSave when Save button is clicked', async () => {
    renderWithProviders(<DailyTracker {...mockProps} />);
    
    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);
    
    expect(mockProps.onSave).toHaveBeenCalled();
  });
}); 