-- SQL script to create an admin user
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- Create admin user (replace values as needed)
INSERT INTO "User" (
  id,
  email,
  name,
  phone,
  password,
  role,
  status,
  "createdAt",
  "updatedAt"
)
VALUES (
  gen_random_uuid()::text,
  'admin@albaz.dz',
  'Admin User',
  '0551234567',
  '$2a$12$629WE1SxVFTraeiAb8hf/.Ggqqph2tjXP18gm8YUZIWldOJ0Pwh2C', -- Password: Admin123!
  'ADMIN',
  'APPROVED',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE
SET
  role = 'ADMIN',
  status = 'APPROVED',
  "updatedAt" = NOW();

-- Verify the admin user was created
SELECT id, email, name, role, status 
FROM "User" 
WHERE email = 'admin@albaz.dz';

