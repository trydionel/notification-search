import { addDays } from 'https://cdn.skypack.dev/date-fns';

export const createTodo = async (notification: Aha.Notification) => {
  const topic = notification.notifiable.commentable;
  const commentor = notification.notifiable.user.name;
  const body = notification.notifiable.body;

  const todo = new aha.models.Task();
  todo.record = {
    id: topic.id,
    typename: topic.__typename //FIXME
  };
  todo.body = body;
  todo.name = `Follow up on comment from ${commentor}`;
  todo.dueDate = addDays(new Date(), 1).toISOString();
  todo.assignUser(aha.user.id);

  return await todo.save();
}