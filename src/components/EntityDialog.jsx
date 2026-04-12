import { Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField } from '@mui/material';

export default function EntityDialog({ open, title, fields, form, setForm, onClose, onSubmit }) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {fields.map((field) => (
            <TextField
              key={field.name}
              label={field.label}
              value={form[field.name] ?? ''}
              onChange={(e) => setForm((prev) => ({ ...prev, [field.name]: e.target.value }))}
              select={field.type === 'select'}
              multiline={field.multiline}
              minRows={field.multiline ? 3 : undefined}
            >
              {field.options?.map((option) => (
                <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
              ))}
            </TextField>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={onSubmit}>Save</Button>
      </DialogActions>
    </Dialog>
  );
}
