-- Fix avatar_url column size to accommodate base64 strings
-- Run this SQL script to update the database column size

ALTER TABLE users MODIFY COLUMN avatar_url VARCHAR(1000);

