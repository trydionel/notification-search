import { ahaFetch } from "../lib/ahaFetch";

export const fetchPageInfo = async (notification: Aha.Notification) => {
  const topic = notification.notifiable.commentable;
  const { page } = await (await ahaFetch(`/api/v1/pages/${topic.id}`)).json()

  return {
    __typename: 'Page',
    id: page.id,
    name: page.name,
    path: page.url,
    referenceNum: page.reference_num,
  }
};