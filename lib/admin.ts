import { auth } from "@clerk/nextjs"

const adminIds = [
  "user_2dvtnxkQltQNZVvz3MrEnl6SfH9",
];

export const isAdmin = () => {
  const { userId } = auth();

  if (!userId) {
    return false;
  }

  return adminIds.indexOf(userId) !== -1;
};