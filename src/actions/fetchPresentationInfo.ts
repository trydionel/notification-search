import { ahaFetch } from "../lib/ahaFetch";

export const fetchPresentationInfo = async (notification) => {
  const fragment = await ahaFetch(`/notifications/${notification.id}.record`).then(r => r.text())
  const fragmentEl = document.createElement('div');
  fragmentEl.innerHTML = fragment;

  const drawerLinks = fragmentEl.querySelectorAll('.summary a:last-of-type')
  const annotationLink = drawerLinks[0]
  const annotationHref = annotationLink.getAttribute('href')

  return {
    __typename: 'Presentation',
    id: notification.notifiable.commentable.id,
    name: annotationLink.innerHTML,
    path: annotationHref
  }
}