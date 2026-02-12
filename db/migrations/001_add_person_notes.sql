-- Migration 001: Add notes column to people table
-- Run this against your existing database to apply the schema change.
-- The init.sql will include this column for fresh installs.

ALTER TABLE people ADD COLUMN IF NOT EXISTS notes TEXT;
