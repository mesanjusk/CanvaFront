// IconButton.jsx
import React from "react";
import { IconButton as MuiIconButton, Tooltip } from "@mui/material";

const IconButton = ({ onClick, title, children, color = "default", ...props }) => (
  <Tooltip title={title} arrow>
    <MuiIconButton
      onClick={onClick}
      color={color}
      size="small"
      sx={{
        backgroundColor: "background.paper",
        boxShadow: 1,
        transition: "background-color 0.2s ease",
        "&:hover": { backgroundColor: "action.hover" },
      }}
      {...props}
    >
      {children}
    </MuiIconButton>
  </Tooltip>
);

export default IconButton;
