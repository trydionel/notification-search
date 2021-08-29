import { ahaFetch } from "../lib/ahaFetch";

export const markRead = (notifications) => {
  notifications = [notifications].flat(); // suppoprt one or many notifications as input

  const requests = notifications.map(notification => {
    if (notification.read) {
      return Promise.resolve();
    } else {
      return ahaFetch(`/notifications/${notification.id}/toggle_read`, {
        method: 'POST'
      });
    }
  });

  // FIXME: in-place updates would be better here
  return Promise.all(requests)
};