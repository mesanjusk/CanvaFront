import React, { useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Collapse,
  FormControlLabel,
  Grid,
  Slider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { clamp } from "../utils/numberUtils";

const PageSizeDpiSection = ({
  usePrintSizing,
  setUsePrintSizing,
  pagePreset,
  setPagePreset,
  customPage,
  setCustomPage,
  pageOrientation,
  setPageOrientation,
  dpi,
  setDpi,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const pageOptions = ["ID-1/CR80", "A4", "Letter", "Legal", "Tabloid", "Custom"];

  return (
    <Box borderBottom={1} borderColor="divider">
      <Button
        fullWidth
        onClick={() => setIsOpen(!isOpen)}
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
          Page Size & DPI
        </Typography>
        <Typography variant="caption">{isOpen ? "▲" : "▼"}</Typography>
      </Button>

      <Collapse in={isOpen} timeout="auto" unmountOnExit>
        <Stack spacing={2} px={2} pb={2} fontSize={13}>
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={usePrintSizing}
                onChange={(e) => setUsePrintSizing(e.target.checked)}
              />
            }
            label={<Typography variant="caption">Enable print sizing</Typography>}
          />

          <Grid container spacing={1}>
            {pageOptions.map((key) => (
              <Grid item xs={6} key={key}>
                <Button
                  fullWidth
                  variant={pagePreset === key ? "contained" : "outlined"}
                  size="small"
                  onClick={() => setPagePreset(key)}
                >
                  {key}
                </Button>
              </Grid>
            ))}
          </Grid>

          {pagePreset === "Custom" && (
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <TextField
                  size="small"
                  label="Width (mm)"
                  type="number"
                  fullWidth
                  value={customPage.w_mm}
                  onChange={(e) =>
                    setCustomPage((s) => ({
                      ...s,
                      w_mm: clamp(parseFloat(e.target.value) || 0, 1, 3000),
                    }))
                  }
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  size="small"
                  label="Height (mm)"
                  type="number"
                  fullWidth
                  value={customPage.h_mm}
                  onChange={(e) =>
                    setCustomPage((s) => ({
                      ...s,
                      h_mm: clamp(parseFloat(e.target.value) || 0, 1, 3000),
                    }))
                  }
                />
              </Grid>
            </Grid>
          )}

          <Grid container spacing={1}>
            <Grid item xs={6}>
              <Button
                fullWidth
                variant={pageOrientation === "portrait" ? "contained" : "outlined"}
                size="small"
                onClick={() => setPageOrientation("portrait")}
              >
                Portrait
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                fullWidth
                variant={pageOrientation === "landscape" ? "contained" : "outlined"}
                size="small"
                onClick={() => setPageOrientation("landscape")}
              >
                Landscape
              </Button>
            </Grid>
          </Grid>

          <Stack spacing={1}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="caption">DPI</Typography>
              <Typography variant="caption" color="text.secondary">
                {dpi} dpi
              </Typography>
            </Stack>
            <Slider
              min={150}
              max={600}
              step={50}
              value={dpi}
              onChange={(_, v) => setDpi(Array.isArray(v) ? v[0] : v)}
            />
          </Stack>
        </Stack>
      </Collapse>
    </Box>
  );
};

export default PageSizeDpiSection;
