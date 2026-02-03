-- Migration: Add 'skipped' value to pomodoro_state enum
-- This allows distinguishing forcefully terminated pomodoros from naturally completed ones

ALTER TYPE "public"."pomodoro_state" ADD VALUE IF NOT EXISTS 'skipped';
