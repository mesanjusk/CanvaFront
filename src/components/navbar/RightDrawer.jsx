import React from 'react';
import {
  Box,
  Collapse,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';
import EventNoteIcon from '@mui/icons-material/EventNote';
import GroupIcon from '@mui/icons-material/Group';

const RightDrawer = ({
  isOpen,
  showMasterItems,
  setShowMasterItems,
  showSettingsItems,
  setShowSettingsItems,
  navigate,
  user,
  onClose,
}) => {
  return (
    <Drawer anchor="right" open={isOpen} onClose={onClose} PaperProps={{ sx: { width: 280 } }}>
      <Box role="presentation" px={2} py={3}>
        <List subheader={<Typography variant="subtitle2">Master</Typography>}>
          <ListItemButton onClick={() => setShowMasterItems((prev) => !prev)}>
            <ListItemText primary="Master" secondary={showMasterItems ? 'Hide' : 'Show'} />
          </ListItemButton>
          <Collapse in={showMasterItems} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {[
                { path: '/addTemplate', label: 'Template' },
                { path: '/dashboard/addCategory', label: 'Category' },
                { path: '/dashboard/addSubcategory', label: 'Subcategory' },
              ].map((item) => (
                <ListItemButton
                  key={item.path}
                  sx={{ pl: 3 }}
                  onClick={() => {
                    navigate(item.path);
                    onClose();
                  }}
                >
                  <ListItemIcon>
                    <EventNoteIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItemButton>
              ))}
            </List>
          </Collapse>
        </List>

        <Divider sx={{ my: 1.5 }} />

        <List subheader={<Typography variant="subtitle2">Settings</Typography>}>
          <ListItemButton onClick={() => setShowSettingsItems((prev) => !prev)}>
            <ListItemText primary="Settings" secondary={showSettingsItems ? 'Hide' : 'Show'} />
          </ListItemButton>
          <Collapse in={showSettingsItems} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              <ListItemButton
                sx={{ pl: 3 }}
                onClick={() => {
                  navigate('/dashboard/user');
                  onClose();
                }}
              >
                <ListItemIcon>
                  <GroupIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="User" />
              </ListItemButton>

              {user?.role === 'admin' && (
                <ListItemButton
                  sx={{ pl: 3 }}
                  onClick={() => {
                    navigate('/dashboard/instituteProfile');
                    onClose();
                  }}
                >
                  <ListItemIcon>
                    <EventNoteIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Profile" />
                </ListItemButton>
              )}

              {(user?.role === 'owner' || user?.role === 'super_admin') && (
                <>
                  <ListItemButton
                    sx={{ pl: 3 }}
                    onClick={() => {
                      navigate('/dashboard/owner');
                      onClose();
                    }}
                  >
                    <ListItemIcon>
                      <EventNoteIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Owner" />
                  </ListItemButton>
                  <ListItemButton
                    sx={{ pl: 3 }}
                    onClick={() => {
                      navigate('/dashboard/institutes');
                      onClose();
                    }}
                  >
                    <ListItemIcon>
                      <EventNoteIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Institutes" />
                  </ListItemButton>
                  {user?.role === 'super_admin' && (
                    <ListItemButton
                      sx={{ pl: 3 }}
                      onClick={() => {
                        navigate('/dashboard/tools');
                        onClose();
                      }}
                    >
                      <ListItemIcon>
                        <EventNoteIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary="Tools" />
                    </ListItemButton>
                  )}
                </>
              )}
            </List>
          </Collapse>
        </List>
      </Box>
    </Drawer>
  );
};

export default RightDrawer;
