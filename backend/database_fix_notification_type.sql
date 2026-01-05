-- Fix notification type column size
-- Run this SQL in your MySQL database

ALTER TABLE notifications MODIFY COLUMN type VARCHAR(50) NOT NULL;

