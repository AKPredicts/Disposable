export const escapeHtml = (text) => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

export const extractEmail = (str) => {
  if (!str) return 'unknown';
  // Extract email from "Name <email@domain.com>" format
  const match = str.match(/<(.+?)>/);
  return (match ? match[1] : str).toLowerCase().trim();
};