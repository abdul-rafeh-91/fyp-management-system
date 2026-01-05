-- Fix document status column length
-- Longest status: EVALUATION_COMMITTEE_REVISION_REQUESTED (37 characters)
-- Setting to 50 for safety

ALTER TABLE documents MODIFY COLUMN status VARCHAR(50) NOT NULL;

