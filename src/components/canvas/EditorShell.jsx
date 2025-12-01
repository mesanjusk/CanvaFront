import React from "react";
import { Box, Drawer, Stack, useMediaQuery, useTheme } from "@mui/material";

const EditorShell = ({
  topBar,
  leftToolbar,
  viewport,
  rightPanel,
  bottomBar,
  mobileLeftOpen = false,
  mobileRightOpen = false,
  onToggleLeft = () => {},
  onToggleRight = () => {},
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("lg"));

  return (
    <Stack minHeight="100vh" width="100vw" bgcolor="grey.50">
      <Box flexShrink={0}>{topBar}</Box>
      <Stack direction={isMobile ? "column" : "row"} flex={1} overflow="hidden">
        {isMobile ? (
          <Drawer anchor="left" open={mobileLeftOpen} onClose={onToggleLeft} ModalProps={{ keepMounted: true }}>
            <Box sx={{ width: 288 }} role="presentation" onClick={onToggleLeft}>
              {leftToolbar}
            </Box>
          </Drawer>
        ) : (
          <Box width={288} borderRight={1} borderColor="divider" bgcolor="background.paper" overflow="auto">
            {leftToolbar}
          </Box>
        )}

        <Box
          flex={1}
          overflow="auto"
          bgcolor="grey.100"
          display="flex"
          alignItems="center"
          justifyContent="center"
          position="relative"
        >
          {viewport}
        </Box>

        {isMobile ? (
          <Drawer anchor="right" open={mobileRightOpen} onClose={onToggleRight} ModalProps={{ keepMounted: true }}>
            <Box sx={{ width: 320 }} role="presentation" onClick={onToggleRight}>
              {rightPanel}
            </Box>
          </Drawer>
        ) : (
          <Box width={320} borderLeft={1} borderColor="divider" bgcolor="background.paper" overflow="auto">
            {rightPanel}
          </Box>
        )}
      </Stack>
      <Box flexShrink={0}>{bottomBar}</Box>
    </Stack>
  );
};

export default EditorShell;
