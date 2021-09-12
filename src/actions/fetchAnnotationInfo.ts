import { ahaFetch } from "../lib/ahaFetch";

export const fetchAnnotationInfo = async (notification) => {
  const fragment = await ahaFetch(`/notifications/${notification.id}.record`).then(r => r.text())
  const fragmentEl = document.createElement('div');
  fragmentEl.innerHTML = fragment;

  const drawerLinks = fragmentEl.querySelectorAll('.summary a[data-drawer-url]')
  const drawerLink = drawerLinks[0]

  return {
    __typename: 'Annotation',
    id: notification.notifiable.commentable.id,
    name: drawerLink.innerHTML,
    path: drawerLink.getAttribute('href')
  }
}