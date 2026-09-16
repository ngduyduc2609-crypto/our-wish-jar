ALTER TABLE public.wishes ADD COLUMN IF NOT EXISTS images jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.foods ADD COLUMN IF NOT EXISTS images jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS images jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.memories ADD COLUMN IF NOT EXISTS images jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.wishes ADD CONSTRAINT wishes_images_array CHECK (jsonb_typeof(images) = 'array');
ALTER TABLE public.foods ADD CONSTRAINT foods_images_array CHECK (jsonb_typeof(images) = 'array');
ALTER TABLE public.activities ADD CONSTRAINT activities_images_array CHECK (jsonb_typeof(images) = 'array');
ALTER TABLE public.memories ADD CONSTRAINT memories_images_array CHECK (jsonb_typeof(images) = 'array');

UPDATE public.foods
SET images = jsonb_build_array(jsonb_build_object('path', image_url, 'position', COALESCE(image_pos, '50% 50%')))
WHERE image_url IS NOT NULL AND images = '[]'::jsonb;

UPDATE public.activities
SET images = jsonb_build_array(jsonb_build_object('path', image_url, 'position', COALESCE(image_pos, '50% 50%')))
WHERE image_url IS NOT NULL AND images = '[]'::jsonb;

UPDATE public.memories
SET images = jsonb_build_array(jsonb_build_object('path', image_url, 'position', COALESCE(image_pos, '50% 50%')))
WHERE image_url IS NOT NULL AND images = '[]'::jsonb;