export const rules = {
  required: (value: string) => !!value || 'This field is required.',
  range: (v: number) => (v >= 1 && v <= 5) || 'Only numbers between 1 and 5 are allowed.',
  versionFormat: (v: string) => /^[0-9.]+$/.test(v) || 'Only numbers and dots (.) are allowed.',
};
