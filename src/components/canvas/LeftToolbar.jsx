/* ------------------------- LeftToolbar ------------------------- */
import PropTypes from "prop-types";
import { Button, Divider, Typography } from "@mui/material";

export function LeftToolbar({
  addText = () => {},
  addRect = () => {},
  addCircle = () => {},
  addImage = () => {},
  onImportImage = () => {},
}) {
  return (
    <div className="p-3 space-y-3">
      <div className="flex flex-col gap-2">
        <Button variant="outlined" onClick={addText} fullWidth>
          Add Text
        </Button>
        <Button variant="outlined" onClick={addRect} fullWidth>
          Add Rectangle
        </Button>
        <Button variant="outlined" onClick={addCircle} fullWidth>
          Add Circle
        </Button>
        <Button variant="outlined" component="label" fullWidth>
          Upload Image
          <input type="file" onChange={onImportImage} hidden />
        </Button>
        <Button variant="contained" onClick={addImage} fullWidth>
          Add Image URL
        </Button>
      </div>

      <Divider />

      <div>
        <Typography variant="subtitle2" className="mb-2">
          Tools
        </Typography>
        <div className="grid grid-cols-2 gap-2">
          <Button size="small" variant="text">
            Select
          </Button>
          <Button size="small" variant="text">
            Frame
          </Button>
          <Button size="small" variant="text">
            Crop
          </Button>
          <Button size="small" variant="text">
            Guides
          </Button>
        </div>
      </div>
    </div>
  );
}

LeftToolbar.propTypes = {
  addText: PropTypes.func,
  addRect: PropTypes.func,
  addCircle: PropTypes.func,
  addImage: PropTypes.func,
  onImportImage: PropTypes.func,
};

export default LeftToolbar;
