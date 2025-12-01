import React from "react";
import { Box } from "@mui/material";

const Bottombar = ({ children }) => (
  <Box
    component="footer"
    sx={{
      height: 56,
      borderTop: 1,
      borderColor: "divider",
      bgcolor: "background.paper",
      display: "flex",
      alignItems: "center",
      px: 2,
      gap: 1.5,
    }}
  >
    {children}
  </Box>
);

export default Bottombar;
