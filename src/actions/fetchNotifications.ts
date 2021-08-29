import NotificationsQuery from "../queries/NotificationsQuery.txt";

export const fetchNotifications = async () => {
  return await aha.graphQuery(NotificationsQuery);
}