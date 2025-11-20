import React, { useState } from 'react';
import { Box, Fab, Stack, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

const FloatingButtons = ({ buttonsList = [], direction = 'up' }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Box position="fixed" bottom={80} right={24} display="flex" flexDirection="column" alignItems="center" zIndex={1200}>
      {isOpen && (
        <Stack
          spacing={1}
          direction="column"
          justifyContent="center"
          alignItems="center"
          sx={{ mb: 1.5, flexDirection: direction === 'up' ? 'column-reverse' : 'column' }}
        >
          {buttonsList.length === 0 ? (
            <Box color="common.white" fontSize={14} px={1}>
              No actions
            </Box>
          ) : (
            buttonsList.map((button, index) => (
              <Button
                key={index}
                variant="contained"
                color="secondary"
                onClick={() => {
                  button.onClick();
                  setIsOpen(false);
                }}
                sx={{
                  width: 150,
                  borderRadius: 999,
                  boxShadow: 3,
                  fontWeight: 700,
                  textTransform: 'none',
                }}
              >
                {button.label}
              </Button>
            ))
          )}
        </Stack>
      )}

      <Fab
        color="success"
        aria-label="Toggle actions"
        onClick={() => setIsOpen((v) => !v)}
        sx={{ boxShadow: 6 }}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
};

export default FloatingButtons;
