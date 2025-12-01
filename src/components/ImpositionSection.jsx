import React, { useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Collapse,
  FormControlLabel,
  Grid,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { clamp } from "../utils/numberUtils";

const ImpositionSection = ({
  imposeOn,
  setImposeOn,
  sheetPreset,
  setSheetPreset,
  sheetCustom,
  setSheetCustom,
  rows,
  setRows,
  cols,
  setCols,
  gap,
  setGap,
  outer,
  setOuter,
}) => {
  const [open, setOpen] = useState(false);
  const presets = ["A4", "Letter", "Legal", "Tabloid", "Custom"];

  return (
    <Box borderBottom={1} borderColor="divider">
      <Button
        fullWidth
        onClick={() => setOpen(!open)}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          textTransform: "none",
          fontSize: 14,
          fontWeight: 600,
          py: 1.5,
          color: "text.primary",
        }}
      >
        <Typography variant="body2" fontWeight={600}>
          Imposition (n-up)
        </Typography>
        <Typography variant="caption">{open ? "▲" : "▼"}</Typography>
      </Button>

      <Collapse in={open} timeout="auto" unmountOnExit>
        <Stack spacing={2} px={2} pb={2} fontSize={13}>
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={imposeOn}
                onChange={(e) => setImposeOn(e.target.checked)}
              />
            }
            label={<Typography variant="caption">Enable Imposition on Sheet</Typography>}
          />

          <Grid container spacing={1}>
            {presets.map((key) => (
              <Grid item xs={6} key={key}>
                <Button
                  fullWidth
                  variant={sheetPreset === key ? "contained" : "outlined"}
                  size="small"
                  onClick={() => setSheetPreset(key)}
                >
                  {key}
                </Button>
              </Grid>
            ))}
          </Grid>

          {sheetPreset === "Custom" && (
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <TextField
                  size="small"
                  label="Sheet W (mm)"
                  type="number"
                  fullWidth
                  value={sheetCustom.w_mm}
                  onChange={(e) =>
                    setSheetCustom((s) => ({
                      ...s,
                      w_mm: clamp(parseFloat(e.target.value) || 0, 30, 3000),
                    }))
                  }
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  size="small"
                  label="Sheet H (mm)"
                  type="number"
                  fullWidth
                  value={sheetCustom.h_mm}
                  onChange={(e) =>
                    setSheetCustom((s) => ({
                      ...s,
                      h_mm: clamp(parseFloat(e.target.value) || 0, 30, 3000),
                    }))
                  }
                />
              </Grid>
            </Grid>
          )}

          <Grid container spacing={1}>
            <Grid item xs={6}>
              <TextField
                size="small"
                label="Rows"
                type="number"
                fullWidth
                value={rows}
                onChange={(e) => setRows(clamp(parseInt(e.target.value) || 1, 1, 20))}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                size="small"
                label="Columns"
                type="number"
                fullWidth
                value={cols}
                onChange={(e) => setCols(clamp(parseInt(e.target.value) || 1, 1, 20))}
              />
            </Grid>
          </Grid>

          <Grid container spacing={1}>
            <Grid item xs={6}>
              <TextField
                size="small"
                label="Gap X (mm)"
                type="number"
                fullWidth
                value={gap.x_mm}
                onChange={(e) =>
                  setGap((g) => ({
                    ...g,
                    x_mm: clamp(parseFloat(e.target.value) || 0, 0, 100),
                  }))
                }
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                size="small"
                label="Gap Y (mm)"
                type="number"
                fullWidth
                value={gap.y_mm}
                onChange={(e) =>
                  setGap((g) => ({
                    ...g,
                    y_mm: clamp(parseFloat(e.target.value) || 0, 0, 100),
                  }))
                }
              />
            </Grid>
          </Grid>

          <Grid container spacing={1}>
            {["top", "right", "bottom", "left"].map((side) => (
              <Grid item xs={3} key={side}>
                <TextField
                  size="small"
                  label={`Outer ${side}`}
                  type="number"
                  fullWidth
                  value={outer[side]}
                  onChange={(e) =>
                    setOuter((prev) => ({
                      ...prev,
                      [side]: clamp(parseFloat(e.target.value) || 0, 0, 200),
                    }))
                  }
                />
              </Grid>
            ))}
          </Grid>

          <Typography variant="caption" color="text.secondary">
            When Bulk + Imposition are on, we tile across the sheet using your filtered
            students.
          </Typography>
        </Stack>
      </Collapse>
    </Box>
  );
};

export default ImpositionSection;
