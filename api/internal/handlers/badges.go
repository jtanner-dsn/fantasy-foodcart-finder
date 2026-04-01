package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Badge struct {
	ID             string `json:"id"`
	Name           string `json:"name"`
	Description    string `json:"description"`
	CriteriaType   string `json:"criteria_type"`
	CriteriaValue  int    `json:"criteria_value"`
}

func Badges(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		rows, err := pool.Query(r.Context(),
			`SELECT id, name, description, criteria_type, criteria_value FROM badges ORDER BY criteria_value`)
		if err != nil {
			http.Error(w, "database error", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		badges := []Badge{}
		for rows.Next() {
			var b Badge
			if err := rows.Scan(&b.ID, &b.Name, &b.Description, &b.CriteriaType, &b.CriteriaValue); err != nil {
				http.Error(w, "scan error", http.StatusInternalServerError)
				return
			}
			badges = append(badges, b)
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(badges)
	}
}
