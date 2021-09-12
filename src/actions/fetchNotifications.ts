import NotificationsQuery from "../queries/NotificationsQuery.txt";

type NotificationsResponse = {
  notifications: {
    nodes: [Aha.Notification]
  }
}

export const fetchNotifications = () => {
  return aha.graphQuery<NotificationsResponse>(NotificationsQuery, { variables: {} });
}