#!/bin/bash
docker exec ledgerpro-backend npm run typeorm -- query << 'SQL'
SELECT id, email, password_hash, first_name, last_name, role, is_verified, is_first_login FROM users WHERE email = 'admin@ledgerpro.com';
SQL
