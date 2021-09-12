import { ahaFetch } from "../lib/ahaFetch";

const TypenameMap = {
  'features': 'Feature',
  'requirements': 'Requirement',
  'epics': 'Epic',
  'releases': 'Release',
  'iterations': 'Iteration',
  'pages': 'Note'
}

export const fetchAnnotationInfo = async (notification) => {
  const fragment = await ahaFetch(`/notifications/${notification.id}.record`).then(r => r.text())
  const fragmentEl = document.createElement('div');
  fragmentEl.innerHTML = fragment;

  const drawerLinks = fragmentEl.querySelectorAll('.summary a[data-drawer-url]')
  const annotationLink = drawerLinks[0]
  const annotationHref = annotationLink.getAttribute('data-drawer-url')
  let recordId = null
  let recordTypename = null

  try {
    const matches = annotationHref.match(/.+\/(?:develop\/)?(.+)\/(.+)#.+/)
    recordTypename = TypenameMap[matches[1]]
    recordId = matches[2]
  } catch (e) {}

  return {
    __typename: 'Annotation',
    id: notification.notifiable.commentable.id,
    name: annotationLink.innerHTML,
    path: annotationHref,
    referenceNum: recordId,
    recordTypename,
    recordId
  }
}