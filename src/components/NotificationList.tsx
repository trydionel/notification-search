import React, { useState } from "react";
import { parseISO, format } from 'https://cdn.skypack.dev/date-fns';
import { DotIcon, DotFillIcon, TriangleDownIcon, TriangleRightIcon, StarIcon, StarFillIcon, FileSymlinkFileIcon } from 'https://cdn.skypack.dev/@primer/octicons-react';

import { IconButton } from "./IconButton";
import { createTodo } from "../actions/createTodo";
import { useToast } from "../lib/toasts";

const TopicLink = ({ topic }) => {
  if (topic.__typename === 'Unimplemented') {
    return null
  }

  return (
    <a onClick={e => aha.drawer.showRecord(topic)}>
      {topic.referenceNum || `View ${topic.__typename.toLowerCase()}`}
    </a>
  )
}

const CommentNotificationRow = ({ notification, onRead, onStarred }) => {
  const { addToast } = useToast();

  const onCreateTodo = async () => {
    try {
      await createTodo(notification)
      addToast('Created a todo')
    } catch (e) {
      addToast('Unable to create todo :(')
    }
  }

  return (
    <tr>
      <td width="16" className="has-text-centered">
        <IconButton onClick={() => onRead(notification)}>
          {notification.read ? <DotIcon /> : <DotFillIcon />}
        </IconButton>
      </td>
      <td width="256" style={{ paddingTop: 12 }}>
        <figure className="image is-24x24 mr-1" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
          <img className="is-rounded" src={notification.notifiable.user?.avatarUrl} width="48" />
        </figure>
        &nbsp;
        {notification.notifiable.user?.name}
      </td>
      <td style={{ paddingTop: 15, paddingBottom: 15 }}>
        <div className="content" dangerouslySetInnerHTML={{ __html: notification.notifiable.body }} />
      </td>
      <td className="has-text-right" width="192" style={{ paddingTop: 15 }}>
        {format(parseISO(notification.createdAt), 'PPpp')}
      </td>
      <td width="32">
        <div className="field is-grouped is-grouped-right">
          <IconButton onClick={() => onStarred(notification)}>
            {notification.starred ? <StarFillIcon /> : <StarIcon />}
          </IconButton>
          <IconButton onClick={onCreateTodo}>
            <FileSymlinkFileIcon />
          </IconButton>
        </div>
      </td>
    </tr>
  )
}

const NotificationTopic = ({ topic, notifications, onRead, onStarred }) => {
  const unread = notifications.filter(n => !n.read).length;
  const [isCollapsed, setCollapsed] = useState(unread === 0);

  const markRead = (e) => {
    e.stopPropagation();
    onRead(notifications);
  }

  return (
    <table className="table is-fullwidth is-hoverable mb-6" key={topic.id}>
      <thead>
        <tr>
          <td width={16}>
            <IconButton onClick={() => setCollapsed(!isCollapsed)}>
              { isCollapsed ? <TriangleRightIcon /> : <TriangleDownIcon /> }
            </IconButton>
          </td>
          <td colSpan={2}>
            <div className="title is-6">
              <span style={{ display: 'inline-block', maxWidth: '50vw', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{topic.name}</span>
              <span className={unread > 0 ? 'tag is-rounded is-info ml-2' : 'tag is-rounded ml-2'}>{unread} unread</span>
            </div>
            <div className="subtitle is-7">
              <span className="mr-2">{notifications[0].project?.name}</span>
              <TopicLink topic={topic} />
            </div>
          </td>
          <td className="has-text-right" colSpan={2}>
            <button className="button is-white is-small" onClick={markRead} disabled={unread === 0}>Mark all as read</button>
          </td>
        </tr>
      </thead>
      {
        isCollapsed ? '' :
          <tbody>
            {
              notifications.reverse().map((notification) => {
                return <CommentNotificationRow
                  key={notification.id}
                  notification={notification}
                  onRead={onRead}
                  onStarred={onStarred}
                />
              })
            }
          </tbody>
      }
    </table>
  )
}

export const NotificationList = ({ results, onRead, onStarred }) => (
  <>
    {
      Object.keys(results.topics).map((topicId) => {
        return <NotificationTopic
          topic={results.topics[topicId]}
          notifications={results.notifications[topicId]}
          onRead={onRead}
          onStarred={onStarred}
          key={topicId}
        />;
      })
    }
  </>
)