// src/utils/instituteUtils.js

export const getInstituteId = (searchParams) => {
  const fromQuery = searchParams.get('i');
  if (fromQuery) return fromQuery;

  const host = window.location.hostname;
  const parts = host.split('.');
  const subdomain = parts.length > 2 ? parts[0] : null;
  if (subdomain && subdomain !== 'www' && subdomain !== 'instify') return subdomain;

  return null;
};
