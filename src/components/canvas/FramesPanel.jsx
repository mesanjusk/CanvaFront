import PropTypes from "prop-types";
import { Box, Button, Stack, Typography } from "@mui/material";

export function FramesPanel({ onAddFrame = () => {} }) {
  return (
    <Box p={3}>
      <Typography variant="subtitle1">Frames</Typography>
      <Stack spacing={1.5} mt={2} direction="column">
        <Button onClick={() => onAddFrame("rounded")} variant="outlined">
          Rounded
        </Button>
        <Button onClick={() => onAddFrame("circle")} variant="outlined">
          Circle
        </Button>
      </Stack>
    </Box>
  );
}

FramesPanel.propTypes = { onAddFrame: PropTypes.func };

export default FramesPanel;
