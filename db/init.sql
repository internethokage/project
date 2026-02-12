-- Giftable Database Schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table (replaces Supabase auth)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX idx_users_email ON users(email);

-- Occasions
CREATE TABLE IF NOT EXISTS occasions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL,
    date TEXT NOT NULL,
    budget NUMERIC(10,2) NOT NULL DEFAULT 0,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_occasions_user ON occasions(user_id);

-- People
CREATE TABLE IF NOT EXISTS people (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    relationship TEXT NOT NULL,
    budget NUMERIC(10,2) NOT NULL DEFAULT 0,
    notes TEXT,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migrate existing installs (idempotent)
ALTER TABLE people ADD COLUMN IF NOT EXISTS notes TEXT;

CREATE INDEX idx_people_user ON people(user_id);

-- People <-> Occasions junction
CREATE TABLE IF NOT EXISTS people_occasions (
    person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    occasion_id UUID NOT NULL REFERENCES occasions(id) ON DELETE CASCADE,
    PRIMARY KEY (person_id, occasion_id)
);

-- Gifts
CREATE TABLE IF NOT EXISTS gifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    price NUMERIC(10,2) NOT NULL DEFAULT 0,
    url TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'idea' CHECK (status IN ('idea', 'purchased', 'given')),
    date_added TIMESTAMPTZ DEFAULT NOW(),
    date_purchased TIMESTAMPTZ,
    date_given TIMESTAMPTZ,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_gifts_user ON gifts(user_id);
CREATE INDEX idx_gifts_person ON gifts(person_id);
