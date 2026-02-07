-- Add performance indexes for frequently queried columns
-- This migration adds database indexes to speed up common queries

-- Works table indexes
CREATE INDEX IF NOT EXISTS idx_works_author_id ON works(author_id);
CREATE INDEX IF NOT EXISTS idx_works_created_at ON works(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_works_work_type ON works(work_type);

-- Follows table indexes
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);

-- Work interests table indexes
CREATE INDEX IF NOT EXISTS idx_work_interests_work_id ON work_interests(work_id);
CREATE INDEX IF NOT EXISTS idx_work_interests_interest_id ON work_interests(interest_id);

-- User interests table indexes
CREATE INDEX IF NOT EXISTS idx_user_interests_user_id ON user_interests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interests_interest_id ON user_interests(interest_id);

-- Bookmarks table indexes (composite index for user + work lookups)
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_work ON bookmarks(user_id, work_id);

-- Likes table indexes (composite index for user + work lookups)
CREATE INDEX IF NOT EXISTS idx_likes_user_work ON likes(user_id, work_id);
CREATE INDEX IF NOT EXISTS idx_likes_work_id ON likes(work_id);

-- Work comments table indexes
CREATE INDEX IF NOT EXISTS idx_work_comments_work_id ON work_comments(work_id);
CREATE INDEX IF NOT EXISTS idx_work_comments_author_id ON work_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_work_comments_created_at ON work_comments(created_at DESC);

-- Profiles table indexes
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at DESC);

-- These indexes will significantly improve query performance for:
-- - Fetching works by author
-- - Sorting works by date
-- - Finding who follows whom
-- - Looking up user interests
-- - Checking bookmark/like status
-- - Loading comments for a work
