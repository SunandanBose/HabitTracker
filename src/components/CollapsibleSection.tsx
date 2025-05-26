import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Collapse,
  Paper,
  styled,
  alpha
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  icon?: React.ReactNode;
}

const StyledHeader = styled(Paper)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
  marginBottom: theme.spacing(2),
  overflow: 'hidden',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  '&:hover': {
    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.12)',
    transform: 'translateY(-1px)'
  },
  [theme.breakpoints.down('sm')]: {
    borderRadius: theme.spacing(1.5),
  }
}));

const HeaderContent = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(2, 3),
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
  color: theme.palette.primary.contrastText,
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1.5, 2),
  }
}));

const TitleContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
}));

const StyledIconButton = styled(IconButton)(({ theme }) => ({
  color: theme.palette.primary.contrastText,
  padding: theme.spacing(0.5),
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.contrastText, 0.1),
  }
}));

const ContentWrapper = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  children,
  defaultExpanded = true,
  icon
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const handleToggle = () => {
    setExpanded(!expanded);
  };

  return (
    <ContentWrapper>
      <StyledHeader elevation={2} onClick={handleToggle}>
        <HeaderContent>
          <TitleContainer>
            {icon && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {icon}
              </Box>
            )}
            <Typography 
              variant="h6" 
              fontWeight="600"
              sx={{ 
                fontSize: { xs: '1.1rem', sm: '1.25rem' }
              }}
            >
              {title}
            </Typography>
          </TitleContainer>
          <StyledIconButton size="small">
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </StyledIconButton>
        </HeaderContent>
      </StyledHeader>
      
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Box>
          {children}
        </Box>
      </Collapse>
    </ContentWrapper>
  );
};

export default CollapsibleSection; 