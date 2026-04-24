import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import isToday from 'dayjs/plugin/isToday';
import isYesterday from 'dayjs/plugin/isYesterday';

dayjs.extend(relativeTime);
dayjs.extend(isToday);
dayjs.extend(isYesterday);

export const formatChatTime = (isoString) => {
  if (!isoString) return '';
  const d = dayjs(isoString);
  if (d.isToday()) return d.format('h:mm A');
  if (d.isYesterday()) return 'Yesterday';
  return d.format('MM/DD/YY');
};

export const formatMessageTime = (isoString) => {
  if (!isoString) return '';
  return dayjs(isoString).format('h:mm A');
};

export const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const getAvatarColor = (name) => {
  const colors = [
    '#0D4F3C', '#5C6BC0', '#EF5350', '#FF7043',
    '#26A69A', '#AB47BC', '#42A5F5', '#EC407A',
  ];
  if (!name) return colors[0];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
};
