import React from "react";
import { Box, Stack } from "@mui/material";

const EditorShell = ({ topBar, leftToolbar, viewport, rightPanel, bottomBar }) => (
  <Stack minHeight="100vh" width="100vw" bgcolor="grey.50">
    <Box flexShrink={0}>{topBar}</Box>
    <Stack direction="row" flex={1} overflow="hidden">
      <Box width={288} borderRight={1} borderColor="divider" bgcolor="background.paper" overflow="auto">
        {leftToolbar}
      </Box>
      <Box flex={1} overflow="auto" bgcolor="grey.100" display="flex" alignItems="center" justifyContent="center">
        {viewport}
      </Box>
      <Box width={320} borderLeft={1} borderColor="divider" bgcolor="background.paper" overflow="auto">
        {rightPanel}
      </Box>
    </Stack>
    <Box flexShrink={0}>{bottomBar}</Box>
  </Stack>
);

export default EditorShell;
