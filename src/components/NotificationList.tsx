import React, { useState } from "react";
import { parseISO, format } from 'https://cdn.skypack.dev/date-fns';

const CommentNotificationRow = ({ notification }) => (
  <tr>
    <td width="16">
      <span className="has-text-info is-size-4">{ notification.read ? '' : '•' }</span>
    </td>
    <td width="256">
      <figure className="image is-24x24 mr-1" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
        <img className="is-rounded" src={notification.notifiable.user?.avatarUrl} width="48" />
      </figure>
      &nbsp;
      { notification.notifiable.user?.name }
    </td>
    <td>
      <div className="content" dangerouslySetInnerHTML={{ __html: notification.notifiable.body }} />
    </td>
    <td className="has-text-right" width="192">
      { format(parseISO(notification.createdAt), 'PPpp') }
    </td>
  </tr>
)

const NotificationGroupTable = ({ topic, notifications, onRead }) => {
  const [isCollapsed, setCollapsed] = useState(false);
  const unread = notifications.filter(n => !n.read).length;

  return (
    <table className="table is-fullwidth is-hoverable mb-6" key={topic.id}>
      <thead>
        <tr>
          <td onClick={() => setCollapsed(!isCollapsed)} width={16}>
            <i className={ isCollapsed ? 'fa fa-caret-right' : 'fa fa-caret-down'} />
          </td>
          <td colSpan={2}>
            <div className="title is-6">
              {topic.name}
              <span className={ unread > 0 ? 'tag is-rounded is-info ml-2' : 'tag is-rounded ml-2'}>{ unread } unread</span>
            </div>
            <div className="subtitle is-7">
              <span className="mr-2">{notifications[0].project.name}</span>
              <a onClick={e => aha.drawer.showRecord(topic)}>{topic.referenceNum || `View ${topic.__typename}`}</a>
            </div>
          </td>
          <td className="has-text-right">
            <button className="button is-white is-small" onClick={e => onRead(notifications)} disabled={unread === 0}>Mark all as read</button>
          </td>
        </tr>
      </thead>
      {
        isCollapsed ? '' :
        <tbody>
          {
            notifications.map((notification) => {
              return <CommentNotificationRow notification={notification} key={notification.id} />
            })
          }
        </tbody>
      }
    </table>
  )
}

export const NotificationList = ({ results, onRead }) => (
  <>
    {
      Object.keys(results.topics).map((topicId) => {
        return <NotificationGroupTable topic={results.topics[topicId]} notifications={results.notifications[topicId]} onRead={onRead} key={topicId} />
      })
    }
  </>
)