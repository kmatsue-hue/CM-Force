export const stripProjectHonorific = (value = '') => (
  String(value ?? '')
    .replace(/(?:\s*様)+\s*$/u, '')
    .trim()
);

export const getProjectDisplayName = (value = '') => {
  const baseName = stripProjectHonorific(value);
  return baseName ? `${baseName} 様` : '';
};
