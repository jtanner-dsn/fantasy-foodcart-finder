package main

import (
	"context"
	"log"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/joho/godotenv"

	"github.com/jtanner/foodtruck-finder/api/internal/db"
	"github.com/jtanner/foodtruck-finder/api/internal/handlers"
	"github.com/jtanner/foodtruck-finder/api/internal/middleware"
)

func main() {
	// Load .env file; ignore error if it doesn't exist (e.g. in production).
	_ = godotenv.Load()

	// Resolve config from environment with sensible defaults.
	connStr := os.Getenv("DATABASE_URL")
	if connStr == "" {
		connStr = "postgres://postgres:postgres@localhost:5432/foodtruck_finder?sslmode=disable"
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	allowedOrigin := os.Getenv("ALLOWED_ORIGIN")
	if allowedOrigin == "" {
		allowedOrigin = "http://localhost:3000"
	}

	// Connect to Postgres.
	ctx := context.Background()
	pool, err := db.Connect(ctx, connStr)
	if err != nil {
		log.Printf("warning: could not connect to database: %v", err)
		log.Println("continuing without database — /health will still serve")
	} else {
		defer pool.Close()
		log.Println("connected to database")
	}

	// Build router.
	r := chi.NewRouter()
	r.Use(chimiddleware.Logger)
	r.Use(chimiddleware.Recoverer)
	r.Use(middleware.CORS(allowedOrigin))

	r.Get("/health", handlers.Health)
	if pool != nil {
		r.Get("/v1/badges", handlers.Badges(pool))

		// Carts
		r.Get("/v1/carts", handlers.ListCarts(pool))
		r.Post("/v1/carts", handlers.CreateCart(pool))
		r.Get("/v1/carts/browse", handlers.BrowseCarts(pool))
		r.Get("/v1/carts/{id}", handlers.GetCart(pool))
		r.Put("/v1/carts/{id}", handlers.UpdateCart(pool))
		r.Delete("/v1/carts/{id}", handlers.DeleteCart(pool))

		// Menu items (nested under cart)
		r.Post("/v1/carts/{id}/menu-items", handlers.CreateMenuItem(pool))
		r.Put("/v1/carts/{id}/menu-items/{itemId}", handlers.UpdateMenuItem(pool))
		r.Delete("/v1/carts/{id}/menu-items/{itemId}", handlers.DeleteMenuItem(pool))

		// Ratings (nested under cart)
		r.Get("/v1/carts/{id}/ratings", handlers.GetRatings(pool))
		r.Post("/v1/carts/{id}/ratings", handlers.UpsertRating(pool))

		// Passport & leaderboard
		r.Get("/v1/passport", handlers.GetPassport(pool))
		r.Get("/v1/leaderboard", handlers.GetLeaderboard(pool))
	}

	addr := ":" + port
	log.Printf("misthaven-api listening on %s", addr)
	if err := http.ListenAndServe(addr, r); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
