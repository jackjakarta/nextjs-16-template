import { eq } from 'drizzle-orm';

import { db } from '..';
import { userTable, type InsertUserModel, type UserModel } from '../schema';

export async function dbGetUserById({
  userId,
}: {
  userId: string;
}): Promise<UserModel | undefined> {
  const [user] = await db.select().from(userTable).where(eq(userTable.id, userId));

  return user;
}

export async function dbGetUserByEmail({
  email,
}: {
  email: string;
}): Promise<UserModel | undefined> {
  const [user] = await db.select().from(userTable).where(eq(userTable.email, email));

  return user;
}

export async function dbCreateUser(data: InsertUserModel): Promise<UserModel | undefined> {
  const [user] = await db.insert(userTable).values(data).returning();

  return user;
}

export async function dbUpdateUserName({
  userId,
  name,
}: {
  userId: string;
  name: string;
}): Promise<UserModel | undefined> {
  const [user] = await db
    .update(userTable)
    .set({ name })
    .where(eq(userTable.id, userId))
    .returning();

  return user;
}
