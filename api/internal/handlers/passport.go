package handlers

import (
	"context"
	"net/http"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// ── Models ────────────────────────────────────────────────────────────────────

type PassportStamp struct {
	ID          string    `json:"id"`
	CartID      string    `json:"cart_id"`
	CartName    string    `json:"cart_name"`
	CartCuisine string    `json:"cart_cuisine"`
	District    string    `json:"district"`
	CreatedAt   time.Time `json:"created_at"`
}

type EarnedBadge struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	EarnedAt    time.Time `json:"earned_at"`
}

type PassportResponse struct {
	StampCount int             `json:"stamp_count"`
	Stamps     []PassportStamp `json:"stamps"`
	Badges     []EarnedBadge   `json:"badges"`
}

type LeaderboardEntry struct {
	Rank       int    `json:"rank"`
	TravelerID string `json:"traveler_id"`
	StampCount int    `json:"stamp_count"`
}

// ── Handlers ──────────────────────────────────────────────────────────────────

// GetPassport handles GET /v1/passport?traveler_id=<token>
func GetPassport(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		travelerID := strings.TrimSpace(r.URL.Query().Get("traveler_id"))
		if travelerID == "" {
			writeError(w, http.StatusBadRequest, "traveler_id is required")
			return
		}

		rows, err := pool.Query(r.Context(),
			`SELECT ps.id, ps.cart_id, c.name, COALESCE(c.cuisine_type,''), COALESCE(c.district,''), ps.created_at
			 FROM passport_stamps ps
			 JOIN carts c ON ps.cart_id = c.id
			 WHERE ps.traveler_id = $1
			 ORDER BY ps.created_at DESC`,
			travelerID)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "database error")
			return
		}
		defer rows.Close()

		stamps := []PassportStamp{}
		for rows.Next() {
			var s PassportStamp
			if err := rows.Scan(&s.ID, &s.CartID, &s.CartName, &s.CartCuisine, &s.District, &s.CreatedAt); err != nil {
				writeError(w, http.StatusInternalServerError, "scan error")
				return
			}
			stamps = append(stamps, s)
		}
		rows.Close()

		badgeRows, err := pool.Query(r.Context(),
			`SELECT b.id, b.name, b.description, tb.earned_at
			 FROM traveler_badges tb
			 JOIN badges b ON tb.badge_id = b.id
			 WHERE tb.traveler_id = $1
			 ORDER BY tb.earned_at ASC`,
			travelerID)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "database error")
			return
		}
		defer badgeRows.Close()

		earnedBadges := []EarnedBadge{}
		for badgeRows.Next() {
			var b EarnedBadge
			if err := badgeRows.Scan(&b.ID, &b.Name, &b.Description, &b.EarnedAt); err != nil {
				writeError(w, http.StatusInternalServerError, "scan error")
				return
			}
			earnedBadges = append(earnedBadges, b)
		}

		writeJSON(w, http.StatusOK, PassportResponse{
			StampCount: len(stamps),
			Stamps:     stamps,
			Badges:     earnedBadges,
		})
	}
}

// GetLeaderboard handles GET /v1/leaderboard
func GetLeaderboard(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		rows, err := pool.Query(r.Context(),
			`SELECT traveler_id, COUNT(*) AS stamp_count
			 FROM passport_stamps
			 GROUP BY traveler_id
			 ORDER BY stamp_count DESC
			 LIMIT 10`)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "database error")
			return
		}
		defer rows.Close()

		entries := []LeaderboardEntry{}
		rank := 1
		for rows.Next() {
			var e LeaderboardEntry
			if err := rows.Scan(&e.TravelerID, &e.StampCount); err != nil {
				writeError(w, http.StatusInternalServerError, "scan error")
				return
			}
			e.Rank = rank
			rank++
			entries = append(entries, e)
		}

		writeJSON(w, http.StatusOK, entries)
	}
}

// ── Badge evaluation ──────────────────────────────────────────────────────────

// awardBadges checks all badge criteria for the traveler and inserts any newly earned badges.
// Called after a passport stamp is issued. Errors are silently ignored (non-fatal).
func awardBadges(ctx context.Context, pool *pgxpool.Pool, travelerID string) {
	var stampCount, cuisineCount, districtCount int

	_ = pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM passport_stamps WHERE traveler_id=$1`, travelerID,
	).Scan(&stampCount)

	_ = pool.QueryRow(ctx,
		`SELECT COUNT(DISTINCT c.cuisine_type)
		 FROM passport_stamps ps JOIN carts c ON ps.cart_id = c.id
		 WHERE ps.traveler_id=$1 AND c.cuisine_type IS NOT NULL AND c.cuisine_type != ''`,
		travelerID,
	).Scan(&cuisineCount)

	_ = pool.QueryRow(ctx,
		`SELECT COUNT(DISTINCT c.district)
		 FROM passport_stamps ps JOIN carts c ON ps.cart_id = c.id
		 WHERE ps.traveler_id=$1 AND c.district IS NOT NULL AND c.district != ''`,
		travelerID,
	).Scan(&districtCount)

	type badgeRow struct {
		id            string
		criteriaType  string
		criteriaValue int
	}

	rows, err := pool.Query(ctx, `SELECT id, criteria_type, criteria_value FROM badges`)
	if err != nil {
		return
	}
	defer rows.Close()

	var toAward []string
	for rows.Next() {
		var b badgeRow
		if err := rows.Scan(&b.id, &b.criteriaType, &b.criteriaValue); err != nil {
			continue
		}
		var earned bool
		switch b.criteriaType {
		case "stamp_count":
			earned = stampCount >= b.criteriaValue
		case "cuisine_variety":
			earned = cuisineCount >= b.criteriaValue
		case "district_count":
			earned = districtCount >= b.criteriaValue
		}
		if earned {
			toAward = append(toAward, b.id)
		}
	}
	rows.Close()

	for _, badgeID := range toAward {
		_, _ = pool.Exec(ctx,
			`INSERT INTO traveler_badges (traveler_id, badge_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
			travelerID, badgeID)
	}
}
