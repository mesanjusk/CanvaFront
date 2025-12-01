import PropTypes from "prop-types";
import { Box, Button, Modal, Stack, Typography } from "@mui/material";

export function ShortcutsDialog({ open = false, onClose = () => {} }) {
  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          bgcolor: "background.paper",
          p: 3,
          borderRadius: 2,
          boxShadow: 6,
          width: 384,
        }}
      >
        <Typography variant="h6" gutterBottom>
          Keyboard Shortcuts
        </Typography>
        <Stack spacing={1} sx={{ fontSize: 14, mt: 1 }}>
          <div>
            <strong>Ctrl/Cmd + Z</strong> — Undo
          </div>
          <div>
            <strong>Ctrl/Cmd + Shift + Z</strong> — Redo
          </div>
          <div>
            <strong>Space</strong> — Pan
          </div>
          <div>
            <strong>Ctrl/Cmd + S</strong> — Save
          </div>
        </Stack>
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
          <Button onClick={onClose} variant="contained">
            Close
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}

ShortcutsDialog.propTypes = { open: PropTypes.bool, onClose: PropTypes.func };
