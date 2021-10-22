export const createTodo = async (notification: Aha.Notification) => {
  const topic = notification.notifiable.commentable;
  const commentor = notification.notifiable.user.name;
  const body = notification.notifiable.body;

  const todo = new aha.models.Task();

  if (topic.__typename === 'Annotation' && topic.recordId) {
    // Attach todos to the parent record
    todo.record = {
      id: topic.recordId,
      typename: topic.recordTypename
    }
  } else {
    todo.record = {
      id: topic.id,
      typename: topic.__typename //FIXME
    };
  }

  todo.body = body;
  todo.name = `Follow up on comment from ${commentor}`;
  todo.dueDate = (new Date()).toISOString(); // due today
  todo.assignUser(aha.user.id);

  return await todo.save();
}