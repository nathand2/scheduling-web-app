export const convertUTCStringToDate = (dtString: string): Date => {
  const [year, month, day, hour, minute, second] = dtString
    .split(/[- :T.]/)
    .map(Number);
  return new Date(Date.UTC(year, month - 1, day, hour, minute, second));
};
