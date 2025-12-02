import React from "react";
import { Box, Stack, useMediaQuery, useTheme } from "@mui/material";

const EditorShell = ({ topBar, leftToolbar, viewport, rightPanel, bottomBar }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <Stack minHeight="100vh" width="100vw" bgcolor="grey.50">
      <Box flexShrink={0}>{topBar}</Box>
      <Stack direction={isMobile ? "column" : "row"} flex={1} overflow="hidden">
        <Box
          width={isMobile ? "100%" : 288}
          borderRight={isMobile ? 0 : 1}
          borderColor="divider"
          bgcolor="background.paper"
          overflow="auto"
          display={isMobile ? "none" : "block"}
        >
          {leftToolbar}
        </Box>
        <Box flex={1} overflow="auto" bgcolor="grey.100" display="flex" alignItems="center" justifyContent="center">
          {viewport}
        </Box>
        <Box
          width={isMobile ? "100%" : 320}
          borderLeft={isMobile ? 0 : 1}
          borderColor="divider"
          bgcolor="background.paper"
          overflow="auto"
          display={isMobile ? "none" : "block"}
        >
          {rightPanel}
        </Box>
      </Stack>
      <Box flexShrink={0}>{bottomBar}</Box>
    </Stack>
  );
};

export default EditorShell;
