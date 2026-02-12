-- Migration 001: Add notes field to people table
-- Run this against your existing database if you have data.
-- New installs via init.sql will get this column automatically.

ALTER TABLE people ADD COLUMN IF NOT EXISTS notes TEXT;
