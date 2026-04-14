create table employee_requirements (
    id uuid primary key,
    employee_id uuid not null references employees(id),
    item_type_id uuid not null references item_types(id),
    requested_quantity integer not null,
    notes varchar(500),
    created_at timestamp with time zone not null,
    updated_at timestamp with time zone not null,
    constraint uk_employee_item unique (employee_id, item_type_id)
);

create index idx_employee_requirements_employee on employee_requirements(employee_id);

alter table employee_requirements
    add constraint chk_employee_requirements_requested_quantity_positive
    check (requested_quantity > 0);