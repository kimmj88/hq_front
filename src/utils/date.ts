import dayjs from 'dayjs';

export const formatDateTime = (value: string | Date) => {
  return dayjs.utc(value).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss');
};
