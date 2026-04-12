import { Button, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import PageCard from '../components/PageCard';
import api from '../services/api';

export default function EditRequestsPage() {
  const [requests, setRequests] = useState([]);

  const load = async () => {
    const { data } = await api.get('/api/students/edit-requests/all');
    setRequests(data.data);
  };

  useEffect(() => { load(); }, []);

  const review = async (id, action) => {
    await api.post(`/api/students/edit-requests/${id}/review`, { action });
    load();
  };

  return (
    <PageCard title="Pending edit requests">
      <Stack spacing={2}>
        {requests.map((request) => (
          <PageCard key={request._id} title={request.studentId?.fullName || 'Student'}>
            <Typography variant="body2">Class: {request.studentId?.className} - {request.studentId?.section}</Typography>
            <Typography variant="body2">Submitted by: {request.submittedByType}</Typography>
            <pre style={{ whiteSpace: 'pre-wrap', background: '#f8fafc', padding: 12, borderRadius: 12 }}>{JSON.stringify(request.payload, null, 2)}</pre>
            {request.status === 'pending' ? (
              <Stack direction="row" spacing={1}>
                <Button variant="contained" onClick={() => review(request._id, 'approve')}>Approve</Button>
                <Button variant="outlined" color="error" onClick={() => review(request._id, 'reject')}>Reject</Button>
              </Stack>
            ) : (
              <Typography>Status: {request.status}</Typography>
            )}
          </PageCard>
        ))}
      </Stack>
    </PageCard>
  );
}
