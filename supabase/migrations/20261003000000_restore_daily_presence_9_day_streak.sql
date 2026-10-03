INSERT INTO public.daily_presence (member_id, day)
SELECT m.id, to_char(d, 'YYYY-MM-DD')
FROM public.members m
CROSS JOIN generate_series(
  (CURRENT_DATE AT TIME ZONE 'Asia/Bangkok') - INTERVAL '8 day',
  (CURRENT_DATE AT TIME ZONE 'Asia/Bangkok'),
  INTERVAL '1 day'
) AS d
ON CONFLICT (member_id, day) DO NOTHING;
