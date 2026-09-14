export const getFileUrl = (fileUrl?: string | null) => {
  if (!fileUrl) return null;

  if (
    fileUrl.startsWith('http://') ||
    fileUrl.startsWith('https://')
  ) {
    return fileUrl;
  }

  const apiUrl = import.meta.env.VITE_API_URL || '';
  const apiOrigin = apiUrl.replace(/\/api\/?$/, '');

  return `${apiOrigin}${fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`}`;
};