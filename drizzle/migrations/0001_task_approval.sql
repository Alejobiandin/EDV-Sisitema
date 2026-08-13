-- Migración incremental no destructiva para human-in-the-loop.
-- Aplicada mediante webdev_execute_sql en la base del proyecto.
ALTER TABLE tasks
  MODIFY COLUMN status ENUM('pending','in_progress','pending_approval','completed','rejected','failed','cancelled') NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS approvalStatus ENUM('not_required','pending','approved','rejected') NOT NULL DEFAULT 'not_required',
  ADD COLUMN IF NOT EXISTS approvalRequestedAt TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS approvedAt TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS approvedBy INT NULL,
  ADD COLUMN IF NOT EXISTS approvalComment TEXT NULL;
