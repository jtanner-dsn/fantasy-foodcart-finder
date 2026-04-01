package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// ── Models ────────────────────────────────────────────────────────────────────

type Cart struct {
	ID           string     `json:"id"`
	Name         string     `json:"name"`
	Description  string     `json:"description"`
	CuisineType  string     `json:"cuisine_type"`
	OperatorID   string     `json:"operator_id"`
	IsOpen       bool       `json:"is_open"`
	HoursText    string     `json:"hours_text"`
	LocationX    *float64   `json:"location_x"`
	LocationY    *float64   `json:"location_y"`
	District     string     `json:"district"`
	LandmarkDesc string     `json:"landmark_desc"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
	MenuItems    []MenuItem `json:"menu_items,omitempty"`
}

type MenuItem struct {
	ID          string  `json:"id"`
	CartID      string  `json:"cart_id"`
	Name        string  `json:"name"`
	Description string  `json:"description"`
	Price       float64 `json:"price"`
}

type createCartRequest struct {
	Name         string   `json:"name"`
	Description  string   `json:"description"`
	CuisineType  string   `json:"cuisine_type"`
	OperatorID   string   `json:"operator_id"`
	IsOpen       bool     `json:"is_open"`
	HoursText    string   `json:"hours_text"`
	LocationX    *float64 `json:"location_x"`
	LocationY    *float64 `json:"location_y"`
	District     string   `json:"district"`
	LandmarkDesc string   `json:"landmark_desc"`
}

type updateCartRequest struct {
	Name         string   `json:"name"`
	Description  string   `json:"description"`
	CuisineType  string   `json:"cuisine_type"`
	OperatorID   string   `json:"operator_id"` // used for ownership check
	IsOpen       bool     `json:"is_open"`
	HoursText    string   `json:"hours_text"`
	LocationX    *float64 `json:"location_x"`
	LocationY    *float64 `json:"location_y"`
	District     string   `json:"district"`
	LandmarkDesc string   `json:"landmark_desc"`
}

type createMenuItemRequest struct {
	Name        string  `json:"name"`
	Description string  `json:"description"`
	Price       float64 `json:"price"`
}

// ── Helpers ───────────────────────────────────────────────────────────────────

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}

// fetchMenuItems returns the menu items for the given cart id.
func fetchMenuItems(r *http.Request, pool *pgxpool.Pool, cartID string) ([]MenuItem, error) {
	rows, err := pool.Query(r.Context(),
		`SELECT id, cart_id, name, description, price FROM menu_items WHERE cart_id = $1 ORDER BY name`,
		cartID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := []MenuItem{}
	for rows.Next() {
		var m MenuItem
		if err := rows.Scan(&m.ID, &m.CartID, &m.Name, &m.Description, &m.Price); err != nil {
			return nil, err
		}
		items = append(items, m)
	}
	return items, nil
}

// ── Cart handlers ─────────────────────────────────────────────────────────────

// ListCarts handles GET /v1/carts?operator_id=<token>
func ListCarts(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		operatorID := strings.TrimSpace(r.URL.Query().Get("operator_id"))
		if operatorID == "" {
			writeError(w, http.StatusBadRequest, "operator_id query parameter is required")
			return
		}

		rows, err := pool.Query(r.Context(),
			`SELECT id, name, description, cuisine_type, operator_id, is_open,
			        COALESCE(hours_text,''), location_x, location_y,
			        COALESCE(district,''), COALESCE(landmark_desc,''),
			        created_at, updated_at
			 FROM carts WHERE operator_id = $1 ORDER BY created_at DESC`,
			operatorID)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "database error")
			return
		}
		defer rows.Close()

		carts := []Cart{}
		for rows.Next() {
			var c Cart
			if err := rows.Scan(
				&c.ID, &c.Name, &c.Description, &c.CuisineType, &c.OperatorID,
				&c.IsOpen, &c.HoursText, &c.LocationX, &c.LocationY,
				&c.District, &c.LandmarkDesc, &c.CreatedAt, &c.UpdatedAt,
			); err != nil {
				writeError(w, http.StatusInternalServerError, "scan error")
				return
			}
			carts = append(carts, c)
		}

		writeJSON(w, http.StatusOK, carts)
	}
}

// GetCart handles GET /v1/carts/{id}
func GetCart(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")

		var c Cart
		err := pool.QueryRow(r.Context(),
			`SELECT id, name, description, cuisine_type, operator_id, is_open,
			        COALESCE(hours_text,''), location_x, location_y,
			        COALESCE(district,''), COALESCE(landmark_desc,''),
			        created_at, updated_at
			 FROM carts WHERE id = $1`,
			id,
		).Scan(
			&c.ID, &c.Name, &c.Description, &c.CuisineType, &c.OperatorID,
			&c.IsOpen, &c.HoursText, &c.LocationX, &c.LocationY,
			&c.District, &c.LandmarkDesc, &c.CreatedAt, &c.UpdatedAt,
		)
		if err != nil {
			writeError(w, http.StatusNotFound, "cart not found")
			return
		}

		items, err := fetchMenuItems(r, pool, c.ID)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "database error")
			return
		}
		c.MenuItems = items

		writeJSON(w, http.StatusOK, c)
	}
}

// CreateCart handles POST /v1/carts
func CreateCart(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req createCartRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeError(w, http.StatusBadRequest, "invalid request body")
			return
		}
		if strings.TrimSpace(req.Name) == "" {
			writeError(w, http.StatusBadRequest, "name is required")
			return
		}
		if strings.TrimSpace(req.OperatorID) == "" {
			writeError(w, http.StatusBadRequest, "operator_id is required")
			return
		}

		var c Cart
		err := pool.QueryRow(r.Context(),
			`INSERT INTO carts
			   (name, description, cuisine_type, operator_id, is_open, hours_text,
			    location_x, location_y, district, landmark_desc)
			 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
			 RETURNING id, name, description, cuisine_type, operator_id, is_open,
			           COALESCE(hours_text,''), location_x, location_y,
			           COALESCE(district,''), COALESCE(landmark_desc,''),
			           created_at, updated_at`,
			req.Name, req.Description, req.CuisineType, req.OperatorID,
			req.IsOpen, req.HoursText, req.LocationX, req.LocationY,
			req.District, req.LandmarkDesc,
		).Scan(
			&c.ID, &c.Name, &c.Description, &c.CuisineType, &c.OperatorID,
			&c.IsOpen, &c.HoursText, &c.LocationX, &c.LocationY,
			&c.District, &c.LandmarkDesc, &c.CreatedAt, &c.UpdatedAt,
		)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to create cart")
			return
		}

		c.MenuItems = []MenuItem{}
		writeJSON(w, http.StatusCreated, c)
	}
}

// UpdateCart handles PUT /v1/carts/{id}
func UpdateCart(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")

		var req updateCartRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeError(w, http.StatusBadRequest, "invalid request body")
			return
		}
		if strings.TrimSpace(req.Name) == "" {
			writeError(w, http.StatusBadRequest, "name is required")
			return
		}
		if strings.TrimSpace(req.OperatorID) == "" {
			writeError(w, http.StatusBadRequest, "operator_id is required")
			return
		}

		var c Cart
		err := pool.QueryRow(r.Context(),
			`UPDATE carts SET
			   name=$1, description=$2, cuisine_type=$3, is_open=$4, hours_text=$5,
			   location_x=$6, location_y=$7, district=$8, landmark_desc=$9,
			   updated_at=now()
			 WHERE id=$10 AND operator_id=$11
			 RETURNING id, name, description, cuisine_type, operator_id, is_open,
			           COALESCE(hours_text,''), location_x, location_y,
			           COALESCE(district,''), COALESCE(landmark_desc,''),
			           created_at, updated_at`,
			req.Name, req.Description, req.CuisineType, req.IsOpen, req.HoursText,
			req.LocationX, req.LocationY, req.District, req.LandmarkDesc,
			id, req.OperatorID,
		).Scan(
			&c.ID, &c.Name, &c.Description, &c.CuisineType, &c.OperatorID,
			&c.IsOpen, &c.HoursText, &c.LocationX, &c.LocationY,
			&c.District, &c.LandmarkDesc, &c.CreatedAt, &c.UpdatedAt,
		)
		if err != nil {
			writeError(w, http.StatusNotFound, "cart not found or not owned by this operator")
			return
		}

		items, err := fetchMenuItems(r, pool, c.ID)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "database error")
			return
		}
		c.MenuItems = items

		writeJSON(w, http.StatusOK, c)
	}
}

// DeleteCart handles DELETE /v1/carts/{id}?operator_id=<token>
func DeleteCart(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := chi.URLParam(r, "id")
		operatorID := strings.TrimSpace(r.URL.Query().Get("operator_id"))
		if operatorID == "" {
			writeError(w, http.StatusBadRequest, "operator_id query parameter is required")
			return
		}

		tag, err := pool.Exec(r.Context(),
			`DELETE FROM carts WHERE id=$1 AND operator_id=$2`,
			id, operatorID,
		)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "database error")
			return
		}
		if tag.RowsAffected() == 0 {
			writeError(w, http.StatusNotFound, "cart not found or not owned by this operator")
			return
		}

		w.WriteHeader(http.StatusNoContent)
	}
}

// BrowseCarts handles GET /v1/carts/browse — returns all carts, no auth required.
// Optional query params: district=, cuisine= (partial match), open=true
func BrowseCarts(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		district := strings.TrimSpace(r.URL.Query().Get("district"))
		cuisine := strings.TrimSpace(r.URL.Query().Get("cuisine"))
		openOnly := r.URL.Query().Get("open") == "true"

		query := `SELECT id, name, description, cuisine_type, operator_id, is_open,
		                 COALESCE(hours_text,''), location_x, location_y,
		                 COALESCE(district,''), COALESCE(landmark_desc,''),
		                 created_at, updated_at
		          FROM carts WHERE 1=1`
		args := []any{}
		n := 1

		if district != "" {
			query += fmt.Sprintf(" AND district = $%d", n)
			args = append(args, district)
			n++
		}
		if cuisine != "" {
			query += fmt.Sprintf(" AND cuisine_type ILIKE $%d", n)
			args = append(args, "%"+cuisine+"%")
			n++
		}
		if openOnly {
			query += " AND is_open = true"
		}
		query += " ORDER BY name"

		rows, err := pool.Query(r.Context(), query, args...)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "database error")
			return
		}
		defer rows.Close()

		carts := []Cart{}
		for rows.Next() {
			var c Cart
			if err := rows.Scan(
				&c.ID, &c.Name, &c.Description, &c.CuisineType, &c.OperatorID,
				&c.IsOpen, &c.HoursText, &c.LocationX, &c.LocationY,
				&c.District, &c.LandmarkDesc, &c.CreatedAt, &c.UpdatedAt,
			); err != nil {
				writeError(w, http.StatusInternalServerError, "scan error")
				return
			}
			carts = append(carts, c)
		}

		writeJSON(w, http.StatusOK, carts)
	}
}

// ── Menu item handlers ────────────────────────────────────────────────────────

// CreateMenuItem handles POST /v1/carts/{id}/menu-items?operator_id=<token>
func CreateMenuItem(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		cartID := chi.URLParam(r, "id")
		operatorID := strings.TrimSpace(r.URL.Query().Get("operator_id"))
		if operatorID == "" {
			writeError(w, http.StatusBadRequest, "operator_id query parameter is required")
			return
		}

		// Verify ownership
		var ownerCheck string
		err := pool.QueryRow(r.Context(),
			`SELECT id FROM carts WHERE id=$1 AND operator_id=$2`, cartID, operatorID,
		).Scan(&ownerCheck)
		if err != nil {
			writeError(w, http.StatusNotFound, "cart not found or not owned by this operator")
			return
		}

		var req createMenuItemRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeError(w, http.StatusBadRequest, "invalid request body")
			return
		}
		if strings.TrimSpace(req.Name) == "" {
			writeError(w, http.StatusBadRequest, "name is required")
			return
		}

		var m MenuItem
		err = pool.QueryRow(r.Context(),
			`INSERT INTO menu_items (cart_id, name, description, price)
			 VALUES ($1,$2,$3,$4)
			 RETURNING id, cart_id, name, description, price`,
			cartID, req.Name, req.Description, req.Price,
		).Scan(&m.ID, &m.CartID, &m.Name, &m.Description, &m.Price)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to create menu item")
			return
		}

		writeJSON(w, http.StatusCreated, m)
	}
}

// UpdateMenuItem handles PUT /v1/carts/{id}/menu-items/{itemId}?operator_id=<token>
func UpdateMenuItem(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		cartID := chi.URLParam(r, "id")
		itemID := chi.URLParam(r, "itemId")
		operatorID := strings.TrimSpace(r.URL.Query().Get("operator_id"))
		if operatorID == "" {
			writeError(w, http.StatusBadRequest, "operator_id query parameter is required")
			return
		}

		// Verify ownership
		var ownerCheck string
		err := pool.QueryRow(r.Context(),
			`SELECT id FROM carts WHERE id=$1 AND operator_id=$2`, cartID, operatorID,
		).Scan(&ownerCheck)
		if err != nil {
			writeError(w, http.StatusNotFound, "cart not found or not owned by this operator")
			return
		}

		var req createMenuItemRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeError(w, http.StatusBadRequest, "invalid request body")
			return
		}
		if strings.TrimSpace(req.Name) == "" {
			writeError(w, http.StatusBadRequest, "name is required")
			return
		}

		var m MenuItem
		err = pool.QueryRow(r.Context(),
			`UPDATE menu_items SET name=$1, description=$2, price=$3
			 WHERE id=$4 AND cart_id=$5
			 RETURNING id, cart_id, name, description, price`,
			req.Name, req.Description, req.Price, itemID, cartID,
		).Scan(&m.ID, &m.CartID, &m.Name, &m.Description, &m.Price)
		if err != nil {
			writeError(w, http.StatusNotFound, "menu item not found")
			return
		}

		writeJSON(w, http.StatusOK, m)
	}
}

// DeleteMenuItem handles DELETE /v1/carts/{id}/menu-items/{itemId}?operator_id=<token>
func DeleteMenuItem(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		cartID := chi.URLParam(r, "id")
		itemID := chi.URLParam(r, "itemId")
		operatorID := strings.TrimSpace(r.URL.Query().Get("operator_id"))
		if operatorID == "" {
			writeError(w, http.StatusBadRequest, "operator_id query parameter is required")
			return
		}

		// Verify ownership
		var ownerCheck string
		err := pool.QueryRow(r.Context(),
			`SELECT id FROM carts WHERE id=$1 AND operator_id=$2`, cartID, operatorID,
		).Scan(&ownerCheck)
		if err != nil {
			writeError(w, http.StatusNotFound, "cart not found or not owned by this operator")
			return
		}

		tag, err := pool.Exec(r.Context(),
			`DELETE FROM menu_items WHERE id=$1 AND cart_id=$2`, itemID, cartID,
		)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "database error")
			return
		}
		if tag.RowsAffected() == 0 {
			writeError(w, http.StatusNotFound, "menu item not found")
			return
		}

		w.WriteHeader(http.StatusNoContent)
	}
}
