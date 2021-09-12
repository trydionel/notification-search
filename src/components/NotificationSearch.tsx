import React, { useEffect, useRef, useState } from "react";
import FlexSearch from "https://cdn.jsdelivr.net/gh/nextapps-de/flexsearch@0.7.2/dist/flexsearch.bundle.js";

import { ToastProvider } from "../lib/toasts";
import { NotificationList } from "../components/NotificationList";
import { NotificationFilters } from "../components/NotificationFilters";
import { markRead } from "../actions/markRead";
import { toggleStarred } from "../actions/toggleStarred";
import { fetchNotifications } from "../actions/fetchNotifications";
import { fetchAnnotationInfo } from "../actions/fetchAnnotationInfo";


const resolveAnnotations = async (notifications: [Aha.Notification]) => {
  // Algo:
  // * Create a list of unique annotation IDs
  // * Fetch annotation data for each ID
  // * Backfill notification structure with resolved annotation data
  //
  const annotations = notifications.reduce((acc, notification) => {
    const commentable = notification.notifiable.commentable

    if (commentable.__typename === 'Unimplemented' && commentable.name === 'Annotation::Text') {
      acc[commentable.id] = notification
    }

    return acc
  }, {})

  const requests = Object.keys(annotations).map(annotationId => {
    const notification = annotations[annotationId];
    return fetchAnnotationInfo(notification).then(resolvedTopic => {
      annotations[annotationId] = resolvedTopic;
    })
  })
  await Promise.all(requests)

  notifications.forEach(notification => {
    const commentable = notification.notifiable.commentable
    const resolvedTopic = annotations[commentable.id]
    if (resolvedTopic) {
      notification.notifiable.commentable = resolvedTopic
    }
  });
}

const groupNotifications = (input) => {
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

const buildSearchIndex = (notifications: [Aha.Notification]) => {
  const index = new FlexSearch.Index("match");

  notifications.forEach(notification => {
    index.add(+notification.id, notification.notifiable.commentable.name + ' ' + notification.notifiable.body);
  });

  return index;
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
    const data = await fetchNotifications();
    await resolveAnnotations(data.notifications.nodes);

    setData(data);
  }

  const onRead = (notifications) => {
    return markRead(notifications).then(() => {
      loadNotifications();
    });
  }

  const onStarred = (notifications) => {
    return toggleStarred(notifications).then(() => {
      loadNotifications();
    });
  }

  // Load initial data
  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    if (!data) return;

    // Update search index
    index.current = buildSearchIndex(data.notifications.nodes);

    // Perform initial processing of data
    const results = groupNotifications(data?.notifications?.nodes || []);
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
    const updated = groupNotifications(notifications);

    setResults({
      ...updated,
      projects: results.projects // preserve full list of projects
    })
  }, [search]);

  if (!results) {
    return (
      <div className="is-flex is-justify-content-center is-align-items-center" style={{minHeight: '50vh'}}>
        <div className="button is-large is-loading">Loading...</div>
      </div>
    )
  }

  return (
    <>
      <ToastProvider>
        <NotificationFilters
          isLoading={loading}
          projects={results.projects}
          onSearch={s => setSearch(s)}
          onRefresh={loadNotifications}
        />
        <NotificationList
          results={results}
          onRead={onRead}
          onStarred={onStarred}
        />
      </ToastProvider>
    </>
  )
}