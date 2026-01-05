-- Fix avatar_url column to support larger base64 images
-- MEDIUMTEXT can store up to 16MB of text, which is more than enough for base64 encoded images

ALTER TABLE users MODIFY COLUMN avatar_url MEDIUMTEXT;

