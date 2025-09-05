import React from "react";
import PageSizeDpiSection from "./PageSizeDpiSection";
import BleedSafeMarksSection from "./BleedSafeMarksSection";
import ImpositionSection from "./ImpositionSection";

const PrintSettings = ({
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
  bleed,
  setBleed,
  safe,
  setSafe,
  showMarks,
  setShowMarks,
  showReg,
  setShowReg,
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
}) => (
  <>
    <PageSizeDpiSection
      usePrintSizing={usePrintSizing}
      setUsePrintSizing={setUsePrintSizing}
      pagePreset={pagePreset}
      setPagePreset={setPagePreset}
      customPage={customPage}
      setCustomPage={setCustomPage}
      pageOrientation={pageOrientation}
      setPageOrientation={setPageOrientation}
      dpi={dpi}
      setDpi={setDpi}
    />
    <BleedSafeMarksSection
      bleed={bleed}
      setBleed={setBleed}
      safe={safe}
      setSafe={setSafe}
      showMarks={showMarks}
      setShowMarks={setShowMarks}
      showReg={showReg}
      setShowReg={setShowReg}
    />
    <ImpositionSection
      imposeOn={imposeOn}
      setImposeOn={setImposeOn}
      sheetPreset={sheetPreset}
      setSheetPreset={setSheetPreset}
      sheetCustom={sheetCustom}
      setSheetCustom={setSheetCustom}
      rows={rows}
      setRows={setRows}
      cols={cols}
      setCols={setCols}
      gap={gap}
      setGap={setGap}
      outer={outer}
      setOuter={setOuter}
    />
  </>
);

export default PrintSettings;
