import React, { useEffect, useRef, useState } from "react";
import { NotificationList } from "../components/NotificationList";
import FlexSearch from 'https://cdn.jsdelivr.net/gh/nextapps-de/flexsearch@0.7.2/dist/flexsearch.bundle.js';

const notificationsQuery = `{
  notifications(filters: {type: Comment}, order: {direction: ASC, name: createdAt}, per: 100) {
    nodes {
      id
      notifiable {
        ... on Comment {
          __typename
          id
          body
          user {
            id
            name
            avatarUrl
          }
          commentable {
            ... on Feature {
              id
              referenceNum
              name
              path
              project {
                name
              }
            }
          }
        }
      }
      createdAt
      read
    }
  }
}`

const processNotifications = (input) => {
  const notifications = {};
  const topics = {};

  input.forEach((notification) => {
    const key = notification.notifiable?.commentable?.id || 0;

    notifications[key] ??= []
    notifications[key].push(notification)
    
    topics[key] ??= []
    topics[key] = notification.notifiable?.commentable;

  });

  return {
    notifications,
    topics,
  }
}

const NotificationFilters = ({ onSearch }) => {
  return (
    <>
      <input type="search" onChange={e => onSearch(e.target.value)} />
    </>
  )
}

export const NotificationSearch = () => {
  const [data, setData] = useState(null);
  const [results, setResults] = useState(null);
  const [query, setQuery] = useState('');
  const index = useRef(null);

  // Load initial data
  useEffect(() => {
    const loadNotifications = async () => {
      const data = await aha.graphQuery(notificationsQuery);
      setData(data);
    }

    loadNotifications();
  }, []);

  useEffect(() => {
    if (!data) return;

    // Build search index
    const newIndex = new FlexSearch.Index("match");

    data.notifications.nodes.forEach(notification => {
      newIndex.add(+notification.id, notification.notifiable.body);
    });

    index.current = newIndex;

    // Perform initial processing of data
    const results = processNotifications(data?.notifications?.nodes || []);
    setResults(results);
  }, [data]);


  // Update results when query changes
  useEffect(() => {
    if (!data) return;

    let notifications;
    if (query) {
      const hits = index.current.search(query);
      notifications = data.notifications.nodes.filter(n => hits.indexOf(+n.id) > -1);
    } else {
      notifications = data.notifications.nodes;
    }
    const results = processNotifications(notifications);

    setResults(results)
  }, [query]);

  const onRead = (notifications) => {
    notifications.forEach(notification => {
      if (!notification.read) {
        console.log(`/notifications/${notification.id}/toggle_read`)
      }
    })
  }

  if (!results) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <NotificationFilters onSearch={setQuery} />
      <NotificationList results={results} onRead={onRead} />
    </>
  )
}