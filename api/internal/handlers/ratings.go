package handlers

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// ── Models ────────────────────────────────────────────────────────────────────

type Rating struct {
	ID         string    `json:"id"`
	CartID     string    `json:"cart_id"`
	TravelerID string    `json:"traveler_id"`
	Stars      int       `json:"stars"`
	ReviewText *string   `json:"review_text"`
	CreatedAt  time.Time `json:"created_at"`
}

type RatingsResponse struct {
	AvgStars *float64 `json:"avg_stars"`
	Count    int      `json:"count"`
	Ratings  []Rating `json:"ratings"`
	MyRating *Rating  `json:"my_rating"`
}

type upsertRatingRequest struct {
	TravelerID string  `json:"traveler_id"`
	Stars      int     `json:"stars"`
	ReviewText *string `json:"review_text"`
}

// ── Handlers ──────────────────────────────────────────────────────────────────

// UpsertRating handles POST /v1/carts/{id}/ratings
func UpsertRating(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		cartID := chi.URLParam(r, "id")

		var req upsertRatingRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeError(w, http.StatusBadRequest, "invalid request body")
			return
		}
		if strings.TrimSpace(req.TravelerID) == "" {
			writeError(w, http.StatusBadRequest, "traveler_id is required")
			return
		}
		if req.Stars < 1 || req.Stars > 5 {
			writeError(w, http.StatusBadRequest, "stars must be between 1 and 5")
			return
		}

		// Block rating own cart
		var operatorID string
		err := pool.QueryRow(r.Context(),
			`SELECT operator_id FROM carts WHERE id=$1`, cartID,
		).Scan(&operatorID)
		if err != nil {
			writeError(w, http.StatusNotFound, "cart not found")
			return
		}
		if operatorID == req.TravelerID {
			writeError(w, http.StatusForbidden, "merchants cannot rate their own cart")
			return
		}

		var rt Rating
		err = pool.QueryRow(r.Context(),
			`INSERT INTO ratings (cart_id, traveler_id, stars, review_text)
			 VALUES ($1, $2, $3, $4)
			 ON CONFLICT (cart_id, traveler_id) DO UPDATE
			   SET stars = EXCLUDED.stars, review_text = EXCLUDED.review_text
			 RETURNING id, cart_id, traveler_id, stars, review_text, created_at`,
			cartID, req.TravelerID, req.Stars, req.ReviewText,
		).Scan(&rt.ID, &rt.CartID, &rt.TravelerID, &rt.Stars, &rt.ReviewText, &rt.CreatedAt)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to save rating")
			return
		}

		// Issue passport stamp (idempotent — unique constraint ignores duplicates)
		_, _ = pool.Exec(r.Context(),
			`INSERT INTO passport_stamps (traveler_id, cart_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
			req.TravelerID, cartID)
		// Evaluate and award any newly earned badges
		awardBadges(r.Context(), pool, req.TravelerID)

		writeJSON(w, http.StatusOK, rt)
	}
}

// GetRatings handles GET /v1/carts/{id}/ratings?traveler_id=<token>
func GetRatings(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		cartID := chi.URLParam(r, "id")
		travelerID := strings.TrimSpace(r.URL.Query().Get("traveler_id"))

		var avgStars *float64
		var count int
		_ = pool.QueryRow(r.Context(),
			`SELECT ROUND(AVG(stars)::numeric, 1), COUNT(*) FROM ratings WHERE cart_id=$1`,
			cartID,
		).Scan(&avgStars, &count)

		rows, err := pool.Query(r.Context(),
			`SELECT id, cart_id, traveler_id, stars, review_text, created_at
			 FROM ratings WHERE cart_id=$1 ORDER BY created_at DESC`,
			cartID)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "database error")
			return
		}
		defer rows.Close()

		ratings := []Rating{}
		var myRating *Rating
		for rows.Next() {
			var rt Rating
			if err := rows.Scan(
				&rt.ID, &rt.CartID, &rt.TravelerID, &rt.Stars, &rt.ReviewText, &rt.CreatedAt,
			); err != nil {
				writeError(w, http.StatusInternalServerError, "scan error")
				return
			}
			ratings = append(ratings, rt)
			if travelerID != "" && rt.TravelerID == travelerID {
				copy := rt
				myRating = &copy
			}
		}

		writeJSON(w, http.StatusOK, RatingsResponse{
			AvgStars: avgStars,
			Count:    count,
			Ratings:  ratings,
			MyRating: myRating,
		})
	}
}
