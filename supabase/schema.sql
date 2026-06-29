-- ============================================================
-- PELE SHOP — full database schema
-- Run this in Supabase SQL Editor
-- ============================================================


-- ============================================================
-- PROFILES
-- Supabase gives you auth.users automatically when someone
-- signs up. We create a profiles table to store extra info
-- (like their role) and join to it whenever we need it.
-- ============================================================
create table public.profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  full_name   text,
  avatar_url  text,
  -- "customer" is the default. You manually set "merchant"
  -- in the Supabase dashboard for your own account.
  role        text not null default 'customer' check (role in ('customer', 'merchant')),
  created_at  timestamptz default now()
);

-- This trigger fires automatically whenever a new user signs up.
-- It creates a matching row in profiles so every user has one.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ============================================================
-- PRODUCTS
-- The main catalog. slug is what appears in the URL:
-- /products/vintage-record-player
-- images is an array of Supabase Storage URLs.
-- ============================================================
create table public.products (
  id          uuid default gen_random_uuid() primary key,
  name        text not null,
  slug        text not null unique,
  description text,
  price       numeric(10, 2) not null check (price >= 0),
  stock       integer not null default 0 check (stock >= 0),
  category    text not null,
  -- Array of image URLs from Supabase Storage
  images      text[] default '{}',
  is_active   boolean default true,
  created_at  timestamptz default now()
);

-- Index slug because we query it on every product page load
create index products_slug_idx on public.products(slug);
-- Index category for the storefront filter
create index products_category_idx on public.products(category);
-- Full-text search index on name + description
create index products_fts_idx on public.products
  using gin(to_tsvector('english', name || ' ' || coalesce(description, '')));


-- ============================================================
-- ORDERS
-- One row per purchase. stripe_session_id lets us match
-- incoming Stripe webhooks to the right order.
-- status moves through: pending → paid → shipped → delivered
-- ============================================================
create table public.orders (
  id                 uuid default gen_random_uuid() primary key,
  user_id            uuid references public.profiles(id) on delete set null,
  stripe_session_id  text unique,
  status             text not null default 'pending'
                     check (status in ('pending', 'paid', 'shipped', 'delivered', 'cancelled')),
  total              numeric(10, 2) not null,
  -- Snapshot of the shipping address at time of purchase
  shipping_address   jsonb,
  created_at         timestamptz default now()
);

create index orders_user_id_idx on public.orders(user_id);
create index orders_status_idx on public.orders(status);
create index orders_created_at_idx on public.orders(created_at desc);


-- ============================================================
-- ORDER ITEMS
-- One row per product per order. We store unit_price as a
-- snapshot — if you change a product's price later, old
-- orders still show what the customer actually paid.
-- ============================================================
create table public.order_items (
  id           uuid default gen_random_uuid() primary key,
  order_id     uuid references public.orders(id) on delete cascade not null,
  product_id   uuid references public.products(id) on delete set null,
  quantity     integer not null check (quantity > 0),
  unit_price   numeric(10, 2) not null
);

create index order_items_order_id_idx on public.order_items(order_id);


-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- This is the security layer. Without it, anyone with the
-- anon key can read/write everything. With it, Supabase
-- checks these policies on every request.
-- ============================================================

-- Enable RLS on every table
alter table public.profiles    enable row level security;
alter table public.products    enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;


-- PROFILES policies
-- Anyone can read profiles (needed for merchant lookups)
create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

-- Users can only update their own profile
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);


-- PRODUCTS policies
-- Anyone (including logged-out visitors) can browse products
create policy "Products are viewable by everyone"
  on public.products for select using (is_active = true);

-- Only merchants can insert/update/delete products
create policy "Merchants can manage products"
  on public.products for all using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'merchant'
    )
  );


-- ORDERS policies
-- Customers see only their own orders
create policy "Users can view own orders"
  on public.orders for select using (auth.uid() = user_id);

-- Merchants can see all orders
create policy "Merchants can view all orders"
  on public.orders for select using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'merchant'
    )
  );

-- Merchants can update order status
create policy "Merchants can update orders"
  on public.orders for update using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'merchant'
    )
  );

-- Orders are created by the service role key (in the Stripe
-- webhook), so no insert policy needed for regular users.


-- ORDER ITEMS policies
-- Users can see items for their own orders
create policy "Users can view own order items"
  on public.order_items for select using (
    exists (
      select 1 from public.orders
      where id = order_id and user_id = auth.uid()
    )
  );

-- Merchants can see all order items
create policy "Merchants can view all order items"
  on public.order_items for select using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'merchant'
    )
  );


-- ============================================================
-- SEED DATA
-- Some products to start with so the store isn't empty.
-- Replace these with whatever fits your niche.
-- ============================================================
insert into public.products (name, slug, description, price, stock, category, images) values
  (
    'Vintage Record Player',
    'vintage-record-player',
    'A beautiful belt-drive turntable with a built-in preamp. Plays 33⅓ and 45 RPM records. Walnut finish.',
    299.99, 12, 'Audio',
    array['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800']
  ),
  (
    'Ceramic Pour-Over Set',
    'ceramic-pour-over-set',
    'Hand-thrown ceramic dripper and carafe. Makes 2–4 cups. Comes with 40 filters.',
    68.00, 34, 'Kitchen',
    array['https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800']
  ),
  (
    'Leather Field Notes Cover',
    'leather-field-notes-cover',
    'Full-grain vegetable-tanned leather. Fits standard Field Notes notebooks. Gets better with age.',
    45.00, 58, 'Accessories',
    array['https://images.unsplash.com/photo-1544816155-12df9643f363?w=800']
  ),
  (
    'Brass Desk Lamp',
    'brass-desk-lamp',
    'Solid brass with an articulating arm. Warm Edison bulb included. Weighted base, no wobble.',
    189.00, 7, 'Home',
    array['https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800']
  ),
  (
    'Merino Wool Beanie',
    'merino-wool-beanie',
    '100% merino wool. Itch-free, temperature-regulating. One size fits most.',
    38.00, 91, 'Apparel',
    array['https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=800']
  ),
  (
    'Cast Iron Skillet',
    'cast-iron-skillet',
    '10-inch pre-seasoned cast iron. Works on all cooktops including induction. Oven safe to 500°F.',
    54.00, 23, 'Kitchen',
    array['https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800']
  );