/**
 * ! Executing this script will delete all data in your database and seed it with 10 buckets_vectors.
 * ! Make sure to adjust the script to your needs.
 * Use any TypeScript runner to run this script, for example: `npx tsx seed.ts`
 * Learn more about the Seed Client by following our guide: https://docs.snaplet.dev/seed/getting-started
 */
import { createSeedClient } from "@snaplet/seed";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "~/types/database.types";

const main = async () => {
  const seed = await createSeedClient();

  const supabase = createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_KEY!
  );

  await seed.$resetDatabase();

  const [mainUserId, userWithoutFinishedCycleId, userWithMiddleCycleId] =
    await Promise.all(
      [
        process.env.SUPABASE_TEST_USER_EMAIL,
        "userwithoutfinishedcycle@yopmail.com",
        "userwithmiddlecycle@yopmail.com",
      ].map(async (email) => {
        const { data: user } = await supabase.auth.signUp({
          email,
          password: process.env.SUPABASE_TEST_USER_PASSWORD!,
        });
        const userId = user!.user!.id;
        return userId;
      })
    );

  const { tags } = await seed.tags((x) => [
    {
      label: "Focus Interval",
      type: "focus",
    },
    {
      label: "Break Interval",
      type: "break",
    },
    {
      label: "Long Break Interval",
      type: "long-break",
    },
  ]);

  console.log(tags);

  const { pomodoros_cycles } = await seed.pomodoros_cycles((x) => [
    {
      user_id: mainUserId,
      state: "current",
    },
    {
      user_id: userWithoutFinishedCycleId,
      state: "current",
    },
    {
      user_id: userWithMiddleCycleId,
      state: "current",
    },
  ]);

  const [mainCycle, userWithoutFinishedCycle, userWithMiddleCycle] =
    pomodoros_cycles;

  const { pomodoros } = await seed.pomodoros((x) => [
    {
      user_id: mainUserId,
      cycle: mainCycle.id,
    },
    {
      user_id: mainUserId,
      cycle: mainCycle.id,
    },
    {
      user_id: mainUserId,
      cycle: mainCycle.id,
    },
    {
      user_id: userWithoutFinishedCycleId,
      cycle: userWithoutFinishedCycle.id,
    },
    {
      user_id: userWithMiddleCycleId,
      cycle: userWithMiddleCycle.id,
    },
  ]);

  const { pomodoros_tags } = await seed.pomodoros_tags((x) => [
    {
      user_id: mainUserId,
      pomodoro: 1,
      tag: 1,
    },
    {
      user_id: mainUserId,
      pomodoro: 2,
      tag: 2,
    },
    {
      user_id: mainUserId,
      pomodoro: 3,
      tag: 3,
    },
    {
      user_id: userWithoutFinishedCycleId,
      pomodoro: 4,
      tag: 1,
    },
    {
      user_id: userWithMiddleCycleId,
      pomodoro: 5,
      tag: 2,
    },
  ]);

  // Type completion not working? You might want to reload your TypeScript Server to pick up the changes
  console.log("Database seeded successfully!");

  process.exit();
};

main();
