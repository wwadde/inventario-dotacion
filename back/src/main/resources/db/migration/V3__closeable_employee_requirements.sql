alter table employee_requirements
    add column closed boolean not null default false,
    add column closed_at timestamp with time zone,
    add column closed_by varchar(120);

alter table employee_requirements
    drop constraint if exists uk_employee_item;

create unique index if not exists uk_employee_item_open
    on employee_requirements(employee_id, item_type_id)
    where closed = false;

create index if not exists idx_employee_requirements_open
    on employee_requirements(closed, employee_id);