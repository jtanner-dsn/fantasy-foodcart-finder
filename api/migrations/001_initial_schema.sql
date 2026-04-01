-- carts
CREATE TABLE carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    cuisine_type TEXT,
    operator_id TEXT NOT NULL,   -- session token of merchant
    is_open BOOLEAN NOT NULL DEFAULT false,
    hours_text TEXT,
    location_x FLOAT,
    location_y FLOAT,
    district TEXT,
    landmark_desc TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- menu_items
CREATE TABLE menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL DEFAULT 0
);

-- ratings
CREATE TABLE ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    traveler_id TEXT NOT NULL,
    stars INTEGER NOT NULL CHECK (stars >= 1 AND stars <= 5),
    review_text TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(cart_id, traveler_id)
);

-- passport_stamps
CREATE TABLE passport_stamps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    traveler_id TEXT NOT NULL,
    cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(traveler_id, cart_id)
);

-- badges
CREATE TABLE badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    criteria_type TEXT NOT NULL,
    criteria_value INTEGER NOT NULL
);

-- traveler_badges
CREATE TABLE traveler_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    traveler_id TEXT NOT NULL,
    badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(traveler_id, badge_id)
);

-- seed badges
INSERT INTO badges (name, description, criteria_type, criteria_value) VALUES
    ('First Bite', 'Earn your first stamp', 'stamp_count', 1),
    ('Street Sage', '10 stamps collected', 'stamp_count', 10),
    ('Seasoned Wanderer', '25 stamps collected', 'stamp_count', 25),
    ('Flavor Pilgrim', 'Rate carts from 5 different cuisine types', 'cuisine_variety', 5),
    ('Dockside Regular', 'Rate 3 carts in the Dockside Quarter', 'district_count', 3);
