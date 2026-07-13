-- Remove eventos duplicados criados pelo CRON (mesmo recurrence_id + mesmo dia).
-- Para cada par (recurrence_id, data), mantém apenas o evento mais recente
-- que não está cancelado; os demais têm recurrence_id anulado para desvinculá-los.
WITH ranked AS (
  SELECT
    id,
    recurrence_id,
    starts_at::date AS event_date,
    status,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY recurrence_id, starts_at::date
      ORDER BY
        CASE WHEN status != 'canceled' THEN 0 ELSE 1 END,
        created_at DESC
    ) AS rn
  FROM events
  WHERE recurrence_id IS NOT NULL
)
UPDATE events
SET recurrence_id = NULL
WHERE id IN (
  SELECT id FROM ranked WHERE rn > 1
);

-- Agora que não há duplicatas, cria o índice único.
CREATE UNIQUE INDEX IF NOT EXISTS idx_events_recurrence_date
  ON events (recurrence_id, (starts_at::date))
  WHERE recurrence_id IS NOT NULL;
