create table employees (
    id uuid primary key,
    document_number varchar(40) not null unique,
    first_name varchar(120) not null,
    last_name varchar(120) not null,
    email varchar(200),
    phone varchar(50),
    area varchar(120),
    position varchar(120),
    active boolean not null,
    created_at timestamp with time zone not null,
    updated_at timestamp with time zone not null
);

create table item_types (
    id uuid primary key,
    code varchar(30) not null unique,
    name varchar(140) not null,
    category varchar(40) not null,
    description varchar(500),
    default_periodicity_months integer not null,
    active boolean not null,
    created_at timestamp with time zone not null,
    updated_at timestamp with time zone not null
);

create table employee_requirements (
    id uuid primary key,
    employee_id uuid not null references employees(id),
    item_type_id uuid not null references item_types(id),
    periodicity_months integer not null,
    effective_from date not null,
    notes varchar(500),
    created_at timestamp with time zone not null,
    updated_at timestamp with time zone not null,
    constraint uk_employee_item unique (employee_id, item_type_id)
);

create table deliveries (
    id uuid primary key,
    employee_id uuid not null references employees(id),
    delivered_at date not null,
    delivered_by varchar(140) not null,
    notes varchar(1000),
    signer_name varchar(140),
    signature_image bytea,
    certificate_number varchar(80) not null unique,
    created_at timestamp with time zone not null,
    updated_at timestamp with time zone not null
);

create table delivery_items (
    id uuid primary key,
    delivery_id uuid not null references deliveries(id) on delete cascade,
    item_type_id uuid not null references item_types(id),
    quantity integer not null,
    created_at timestamp with time zone not null,
    updated_at timestamp with time zone not null
);

create index idx_employee_requirements_employee on employee_requirements(employee_id);
create index idx_delivery_employee on deliveries(employee_id);
create index idx_delivery_delivered_at on deliveries(delivered_at);
create index idx_delivery_items_delivery on delivery_items(delivery_id);
