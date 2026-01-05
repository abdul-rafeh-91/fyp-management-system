-- Add customType column to documents table for custom deadline types
ALTER TABLE documents 
ADD COLUMN custom_type VARCHAR(255) NULL AFTER type;

-- Make type column nullable to support custom deadline types
ALTER TABLE documents 
MODIFY COLUMN type VARCHAR(255) NULL;

