-- LedgerPro — remove OTP gating on admin user-management and branch-management
-- mutations.
--
-- WHEN TO RUN: Stop the backend, apply this SQL, then start the backend with
-- the new code. DB_SYNC=true in dev will also drop these tables automatically
-- because their TypeORM entities are deleted; production must run this
-- migration (or an equivalent reviewed migration) before deploying the code.
--
-- After this migration:
--   • POST/PATCH/DELETE /api/v1/users        commit immediately (no OTP).
--   • POST/PATCH/DELETE /api/v1/branches     commit immediately (no OTP).
--   • Customer signup OTP, password-reset OTP, and the User.otp_code /
--     otp_expires_at columns remain untouched — they are still in use.

BEGIN;

DROP TABLE IF EXISTS pending_user_actions;
DROP TABLE IF EXISTS pending_branch_actions;

COMMIT;
