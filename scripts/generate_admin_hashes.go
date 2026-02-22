package main

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"log"

	"golang.org/x/crypto/argon2"
)

// generateArgon2IDHash generates an Argon2id hash for the given password
func generateArgon2IDHash(password string) (string, error) {
	// Generate a random 16-byte salt
	salt := make([]byte, 16)
	if _, err := rand.Read(salt); err != nil {
		return "", fmt.Errorf("failed to generate salt: %w", err)
	}

	// Argon2id parameters
	time := 3
	memory := 64 * 1024 // 64MB
	threads := 2
	keyLen := 32

	// Generate the hash
	hash := argon2.IDKey([]byte(password), salt, uint32(time), uint32(memory), uint8(threads), uint32(keyLen))

	// Encode to the format used in the database
	// Format: $argon2id$v=19$m=65536,t=3,p=2$<base64(salt)>$<base64(hash)>
	saltB64 := base64.RawStdEncoding.EncodeToString(salt)
	hashB64 := base64.RawStdEncoding.EncodeToString(hash)

	return fmt.Sprintf("$argon2id$v=19$m=65536,t=3,p=2$%s$%s", saltB64, hashB64), nil
}

func main() {
	// Admin users and their passwords
	adminUsers := map[string]string{
		"superadmin": "Admin123!",
		"sysadmin":   "System@2024",
		"opsadmin":   "Operations@2024",
		"demo_admin": "Demo@1234",
	}

	fmt.Println("Generated password hashes for admin users:")
	fmt.Println("==========================================")

	for username, password := range adminUsers {
		hash, err := generateArgon2IDHash(password)
		if err != nil {
			log.Fatalf("Failed to generate hash for %s: %v", username, err)
		}

		fmt.Printf("-- Username: %s, Password: %s\n", username, password)
		fmt.Printf("INSERT INTO users (username, email, password, first_name, last_name, role, is_active) VALUES\n")
		fmt.Printf("('%s', '%s@etax.com', '%s', '%s', 'Administrator', 'admin', true);\n\n", 
			username, username, hash, capitalizeFirst(username))
	}

	fmt.Println("==========================================")
	fmt.Println("Copy these INSERT statements into your admin_seed.sql file")
}

func capitalizeFirst(s string) string {
	if s == "" {
		return s
	}
	return string(s[0]-32) + s[1:]
}
