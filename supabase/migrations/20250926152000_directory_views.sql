create or replace view public.directory_dmcs as
select * from public.agencies where type = 'dmc';

create or replace view public.directory_transport as
select * from public.agencies where type = 'transport';

create or replace view public.directory_agencies as
select * from public.agencies where type = 'agency';
