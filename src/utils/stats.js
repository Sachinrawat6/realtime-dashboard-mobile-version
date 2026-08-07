// Average items scanned per hour, based on the span between first and last scan.
export const calculatePerHourAverage = (firstTime, lastTime, count) => {
  if (!firstTime || !lastTime || !count) return '0.0';
  const diffMs = new Date(lastTime) - new Date(firstTime);
  if (diffMs <= 0) return count.toFixed(1);
  const hours = diffMs / (1000 * 60 * 60);
  return (count / hours).toFixed(1);
};
