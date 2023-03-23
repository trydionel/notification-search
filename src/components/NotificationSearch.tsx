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
import { fetchPresentationInfo } from "../actions/fetchPresentationInfo";
import { EmptyState } from "./EmptyState";

import InboxSVG from '../assets/inbox.svg.txt'

type SearchQuery = {
  query: string;
  project?: string | null;
  mode: FilterMode;
}

const Resolvers = {
  'Annotation::Text': fetchAnnotationInfo,
  'Annotation::Point': fetchAnnotationInfo,
  'Ideas::Idea': fetchIdeaInfo,
  'Page': fetchPageInfo,
  'Publish::Notebook': fetchPresentationInfo
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

  const setFavicon = (notificationCount) => {
    const link = document.querySelector<HTMLLinkElement>("link[rel*='icon']")

    if (!link) return;

    const fragment = document.createElement('div');
    fragment.innerHTML = InboxSVG;

    if (notificationCount > 0) {
      const svgNS = 'http://www.w3.org/2000/svg'
      const count = document.createElementNS(svgNS, 'circle');
      count.setAttributeNS(null, 'cx', 416);
      count.setAttributeNS(null, 'cy', 64);
      count.setAttributeNS(null, 'r', 64);
      count.setAttributeNS(null, 'fill', 'red');

      fragment.querySelector('svg').appendChild(count);
    }

    const favicon = fragment.innerHTML;
    link.href = `data:image/svg+xml;base64,${btoa(favicon)}`
  }

  // Load initial data
  useEffect(() => {
    loadNotifications();
  }, []);

  // Regularly check for new notifications
  useEffect(() => {
    console.log("Registering for notification updates")

    let refreshInterval = 5 * 60 * 1000; // 5 minutes
    let pollingPid = setInterval(async () => {
      await loadNotifications();
    }, refreshInterval)

    return () => {
      clearInterval(pollingPid);
    }
  }, [])

  // Post-process data after loading
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
    setFavicon(notifications.length);
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