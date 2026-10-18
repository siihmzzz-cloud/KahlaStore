alter table public.products
  add column if not exists images text[] not null default '{}';

update public.products
set images = array_remove(array[image, image2], '')
where cardinality(images) = 0;
