-- Fix: Make document_type column nullable in deadlines table
-- This allows custom deadline types without requiring a document type

ALTER TABLE deadlines MODIFY COLUMN document_type VARCHAR(255) NULL;

