import React, { useEffect, useRef, useState } from "react";
import FlexSearch from "https://cdn.jsdelivr.net/gh/nextapps-de/flexsearch@0.7.2/dist/flexsearch.bundle.js";

import { ToastProvider } from "../lib/toasts";
import { NotificationList } from "../components/NotificationList";
import { FilterMode, NotificationFilters } from "../components/NotificationFilters";
import { markRead } from "../actions/markRead";
import { toggleStarred } from "../actions/toggleStarred";
import { fetchNotifications } from "../actions/fetchNotifications";
import { fetchAnnotationInfo } from "../actions/fetchAnnotationInfo";
import { fetchIdeaInfo } from "../actions/fetchIdeaInfo";
import { fetchPageInfo } from "../actions/fetchPageInfo";
import { EmptyState } from "./EmptyState";

type SearchQuery = {
  query: string;
  project?: string | null;
  mode: FilterMode;
}

const Resolvers = {
  'Annotation::Text': fetchAnnotationInfo,
  'Annotation::Point': fetchAnnotationInfo,
  'Ideas::Idea': fetchIdeaInfo,
  'Page': fetchPageInfo
}

const resolveUnimplementedTypes = async (notifications: [Aha.Notification]) => {
  // Algo:
  // * Create a list of unique topic IDs
  // * Fetch additional data for each ID
  // * Backfill notification structure with resolved topic data
  //
  const topics = notifications.reduce((acc, notification) => {
    const commentable = notification.notifiable.commentable

    if (commentable.__typename === 'Unimplemented' && Resolvers.hasOwnProperty(commentable.name)) {
      acc[commentable.id] = {
        type: commentable.name,
        notification
      }
    }

    return acc
  }, {})

  const requests = Object.keys(topics).map(annotationId => {
    const { notification, type } = topics[annotationId];
    const resolver = Resolvers[type];

    return resolver(notification).then(resolvedTopic => {
      topics[annotationId] = resolvedTopic;
    })
  })
  await Promise.all(requests)

  notifications.forEach(notification => {
    const commentable = notification.notifiable.commentable
    const resolvedTopic = topics[commentable.id]
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

    projects[projectId] = notification.project?.name || "None"
  });

  return {
    notifications,
    topics,
    projects,
    total: input.length
  }
}

const buildSearchIndex = (notifications: [Aha.Notification]) => {
  const index = new FlexSearch.Index("match");

  notifications.forEach(notification => {
    index.add(+notification.id, notification.notifiable.commentable.name + ' ' + notification.notifiable.body);
  });

  return index;
}

const filterNotifications = (input: Aha.Notification[], search: SearchQuery, index) => {
  let notifications = input;

  if (search.project) {
    notifications = notifications.filter(n => n.project.id === search.project);
  }

  if (search.mode === 'starred') {
    notifications = notifications.filter(n => n.starred);
  }

  if (search.mode === 'mentions' || search.query) {
    const hits = index.current.search(`@${aha.user.name} ${search.query}`);
    notifications = notifications.filter(n => hits.indexOf(+n.id) > -1);
  }

  return notifications;
}

export const NotificationSearch = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [results, setResults] = useState(null);
  const [search, setSearch] = useState<SearchQuery>({ query: '', mode: 'everything' });
  const index = useRef(null);

  const loadNotifications = async () => {
    const data = await fetchNotifications();
    await resolveUnimplementedTypes(data.notifications.nodes);

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
    let notifications = data.notifications.nodes;
    const filtered = filterNotifications(notifications, search, index);
    const grouped = groupNotifications(filtered);
    setResults(grouped);
    setLoading(false);
  }, [data]);


  // Update results when search changes
  useEffect(() => {
    if (!data) return;

    let notifications = data.notifications.nodes;
    const filtered = filterNotifications(notifications, search, index);
    const grouped = groupNotifications(filtered);

    setResults({
      ...grouped,
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
          search={search}
          onSearch={s => setSearch(s)}
          onRefresh={loadNotifications}
        />
        { data && data.notifications.nodes.length === 0 ?
          <EmptyState>
            <strong>You did it!</strong> That was your last notification.<br />
            Enjoy this moment of tranquility.
            <img src="https://source.unsplash.com/1600x900/?nature,water" className="mt-6" />
          </EmptyState> :
         results.total === 0 ?
          <EmptyState>No results matching the supplied filters</EmptyState> :
          <NotificationList
            results={results}
            onRead={onRead}
            onStarred={onStarred}
          />
        }
      </ToastProvider>
    </>
  )
}