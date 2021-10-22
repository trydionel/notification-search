import { ahaFetch } from "../lib/ahaFetch";

export const fetchIdeaInfo = async (notification: Aha.Notification) => {
  const topic = notification.notifiable.commentable;
  const { idea } = await (await ahaFetch(`/api/v1/ideas/${topic.id}`)).json()

  return {
    __typename: 'Idea',
    id: idea.id,
    name: idea.name,
    path: idea.url,
    referenceNum: idea.reference_num,
  }
};