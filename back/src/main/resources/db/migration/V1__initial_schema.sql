create table employees (
    id uuid primary key,
    document_number varchar(40) not null unique,
    first_name varchar(120) not null,
    last_name varchar(120) not null,
    email varchar(200),
    phone varchar(50),
    area varchar(120),
    position varchar(120),
    birth_date date,
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
    unit_cost numeric(12, 2) not null,
    available_stock integer not null,
    active boolean not null,
    created_at timestamp with time zone not null,
    updated_at timestamp with time zone not null
);

create table deliveries (
    id uuid primary key,
    employee_id uuid not null references employees(id),
    delivery_type varchar(20) not null,
    delivered_at date not null,
    delivered_by varchar(140) not null,
    notes varchar(1000),
    signer_name varchar(140),
    signature_image bytea,
    certificate_number varchar(80) not null unique,
    duplicate_acknowledged boolean not null default false,
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

create table item_stock_movements (
    id uuid primary key,
    item_type_id uuid not null references item_types(id),
    movement_type varchar(20) not null,
    quantity integer not null,
    stock_before integer not null,
    stock_after integer not null,
    reason varchar(400),
    reference_type varchar(30),
    reference_id uuid,
    performed_by varchar(120) not null,
    performed_at timestamp with time zone not null
);

create index idx_employees_birth_date on employees(birth_date);
create index idx_delivery_employee on deliveries(employee_id);
create index idx_delivery_delivered_at on deliveries(delivered_at);
create index idx_delivery_items_delivery on delivery_items(delivery_id);
create index idx_item_stock_movements_item_type_performed_at
    on item_stock_movements(item_type_id, performed_at desc);
create index idx_item_stock_movements_performed_at
    on item_stock_movements(performed_at desc);

alter table item_types
    add constraint chk_item_types_available_stock_non_negative
    check (available_stock >= 0);

alter table item_stock_movements
    add constraint chk_item_stock_movements_quantity_positive
    check (quantity > 0);

alter table item_stock_movements
    add constraint chk_item_stock_movements_stock_non_negative
    check (stock_before >= 0 and stock_after >= 0);
