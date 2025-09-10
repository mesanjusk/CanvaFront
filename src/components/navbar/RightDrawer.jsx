import React from 'react';
import EventNoteIcon from '@mui/icons-material/EventNote';
import SchoolIcon from '@mui/icons-material/School';
import GroupIcon from '@mui/icons-material/Group';

const RightDrawer = ({
  isOpen,
  showMasterItems,
  setShowMasterItems,
  showSettingsItems,
  setShowSettingsItems,
  navigate,
  user,
  onClose
}) => {
  if (!isOpen) return null;
  return (
    <>
      <div className="absolute top-12 right-0 w-56 bg-white rounded-lg  z-50 p-4">
        {/* Master Section */}
        <div>
          <div
            className="font-semibold text-gray-700 mb-2 cursor-pointer hover:underline"
            onClick={() => setShowMasterItems(!showMasterItems)}
          >
            Master {showMasterItems}
          </div>
          {showMasterItems && (
            <div className="space-y-2 pl-2">
              {[
                { path: '/dashboard/Courses', label: 'Courses', icon: <EventNoteIcon fontSize="small" /> },
                { path: '/dashboard/Batches', label: 'Batches', icon: <EventNoteIcon fontSize="small" /> },
                { path: '/dashboard/allbatches', label: 'Manage Batches', icon: <EventNoteIcon fontSize="small" /> },
                { path: '/dashboard/allexams', label: 'Manage Exams', icon: <EventNoteIcon fontSize="small" /> },
                { path: '/dashboard/education', label: 'Education', icon: <SchoolIcon fontSize="small" /> },
                { path: '/dashboard/exam', label: 'Exam', icon: <EventNoteIcon fontSize="small" /> },
                { path: '/dashboard/addTemplate', label: 'Template', icon: <EventNoteIcon fontSize="small" /> },
                { path: '/dashboard/addCategory', label: 'Category', icon: <EventNoteIcon fontSize="small" /> },
                { path: '/dashboard/addSubcategory', label: 'Subcategory', icon: <EventNoteIcon fontSize="small" /> },
              ].map((item) => (
                <div
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    onClose();
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 text-sm cursor-pointer"
                >
                  {item.icon}
                  {item.label}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Settings Section */}
        <div>
          <div
            className="font-semibold text-gray-700 mb-2 cursor-pointer hover:underline"
            onClick={() => setShowSettingsItems(!showSettingsItems)}
          >
            Settings {showSettingsItems}
          </div>
          {showSettingsItems && (
            <div className="space-y-2 pl-2">
              <div
                onClick={() => {
                  navigate('/dashboard/user');
                  onClose();
                }}
                className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 text-sm cursor-pointer"
              >
                <GroupIcon fontSize="small" />
                User
              </div>

              {user?.role === 'admin' && (
                <div
                  onClick={() => {
                    navigate('/dashboard/instituteProfile');
                    onClose();
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 text-sm cursor-pointer"
                >
                  <EventNoteIcon fontSize="small" />
                  Profile
                </div>
              )}

              {(user?.role === 'owner' || user?.role === 'super_admin') && (
                <>
                  <div
                    onClick={() => {
                      navigate('/dashboard/owner');
                      onClose();
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 text-sm cursor-pointer"
                  >
                    <EventNoteIcon fontSize="small" />
                    Owner
                  </div>
                  <div
                    onClick={() => {
                      navigate('/dashboard/institutes');
                      onClose();
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 text-sm cursor-pointer"
                  >
                    <EventNoteIcon fontSize="small" />
                    Institutes
                  </div>
                  {user?.role === 'super_admin' && (
                    <div
                      onClick={() => {
                        navigate('/dashboard/tools');
                        onClose();
                      }}
                      className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 text-sm cursor-pointer"
                    >
                      <EventNoteIcon fontSize="small" />
                      Tools
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Overlay */}
      <div onClick={onClose} className="fixed inset-0 bg-black opacity-25 z-40" />
    </>
  );
};

export default RightDrawer;
