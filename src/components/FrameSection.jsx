import React, { useState } from "react";
import { Box, Button, Collapse, Grid, Typography } from "@mui/material";
import IconButton from "./IconButton";
import { Square, Circle, Triangle, Hexagon, Star, Heart } from "lucide-react";

const FrameSection = ({ addFrameSlot }) => {
  const [open, setOpen] = useState(false);

  return (
    <Box borderBottom={1} borderColor="divider" pb={open ? 1 : 0}>
      <Button
        fullWidth
        onClick={() => setOpen(!open)}
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          textTransform: "none",
          fontSize: 14,
          fontWeight: 600,
          py: 1.5,
          color: "text.primary",
        }}
      >
        <Typography variant="body2" fontWeight={600}>
          Add Frame
        </Typography>
        <Typography variant="caption">{open ? "▲" : "▼"}</Typography>
      </Button>

      <Collapse in={open} timeout="auto" unmountOnExit>
        <Box px={2} pb={2}>
          <Grid container spacing={1}>
            <Grid item xs={3}>
              <IconButton title="Rectangle Frame" onClick={() => addFrameSlot("rect")}>
                <Square size={18} />
              </IconButton>
            </Grid>
            <Grid item xs={3}>
              <IconButton title="Rounded Frame" onClick={() => addFrameSlot("rounded") }>
                <Square size={18} style={{ borderRadius: 6 }} />
              </IconButton>
            </Grid>
            <Grid item xs={3}>
              <IconButton title="Circle Frame" onClick={() => addFrameSlot("circle")}>
                <Circle size={18} />
              </IconButton>
            </Grid>
            <Grid item xs={3}>
              <IconButton title="Triangle Frame" onClick={() => addFrameSlot("triangle")}>
                <Triangle size={18} />
              </IconButton>
            </Grid>
            <Grid item xs={3}>
              <IconButton title="Hexagon Frame" onClick={() => addFrameSlot("hexagon")}>
                <Hexagon size={18} />
              </IconButton>
            </Grid>
            <Grid item xs={3}>
              <IconButton title="Star Frame" onClick={() => addFrameSlot("star")}>
                <Star size={18} />
              </IconButton>
            </Grid>
            <Grid item xs={3}>
              <IconButton title="Heart Frame" onClick={() => addFrameSlot("heart")}>
                <Heart size={18} />
              </IconButton>
            </Grid>
          </Grid>
        </Box>
      </Collapse>
    </Box>
  );
};

export default FrameSection;
