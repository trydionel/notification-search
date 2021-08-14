import React, { useEffect, useRef, useState } from "react";
import FlexSearch from "https://cdn.jsdelivr.net/gh/nextapps-de/flexsearch@0.7.2/dist/flexsearch.bundle.js";

import NotificationsQuery from "../queries/NotificationsQuery.txt";

import { NotificationList } from "../components/NotificationList";
import { NotificationFilters } from "../components/NotificationFilters";

const processNotifications = (input) => {
  const notifications = {};
  const topics = {};
  const projects = {};

  input.forEach((notification) => {
    const topicId = notification.notifiable?.commentable?.id || 0;
    const projectId = notification.project?.id || 0;

    notifications[topicId] ??= []
    notifications[topicId].push(notification)
    
    topics[topicId] ??= []
    topics[topicId] = notification.notifiable?.commentable;

    projects[projectId] = notification.project.name
  });

  return {
    notifications,
    topics,
    projects
  }
}

type SearchQuery = {
  query: string;
  project?: string | null;
}

export const NotificationSearch = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [results, setResults] = useState(null);
  const [search, setSearch] = useState<SearchQuery>({ query: '' });
  const index = useRef(null);
  const loadNotifications = async () => {
    const data = await aha.graphQuery(NotificationsQuery);
    console.log(data)
    setData(data);
  }

  const markRead = (notifications) => {
    notifications.forEach(notification => {
      if (!notification.read) {
        console.log(`/notifications/${notification.id}/toggle_read`)
      }
    })
  }

  // Load initial data
  useEffect(() => {
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
    setLoading(false);
  }, [data]);


  // Update results when search changes
  useEffect(() => {
    if (!data) return;

    let notifications = data.notifications.nodes;
    if (search.project) {
      notifications = notifications.filter(n => n.project.id === search.project)
    }

    if (search.query) {
      const hits = index.current.search(search.query);
      notifications = notifications.filter(n => hits.indexOf(+n.id) > -1);
    }
    const updated = processNotifications(notifications);

    setResults({
      ...updated,
      projects: results.projects // preserve full list of projects
    })
  }, [search]);

  if (!results) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <NotificationFilters isLoading={loading} projects={results.projects} onSearch={s => setSearch(s)} onRefresh={loadNotifications} />
      <NotificationList results={results} onRead={markRead} />
    </>
  )
}