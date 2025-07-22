import axios from 'axios';
import BASE_URL from '../config';

/**
 * Fetches metadata required for admission/enquiry forms in a single request.
 * Returns an object with courses, educations, exams, batches and payment modes.
 */
export const fetchMetadata = async (institute_uuid) => {
  const params = institute_uuid ? `?institute_uuid=${institute_uuid}` : '';
  const res = await axios.get(`${BASE_URL}/api/metadata${params}`);
  return res.data || {};
};
