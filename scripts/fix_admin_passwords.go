package main

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"log"

	"golang.org/x/crypto/argon2"
)

// Password hashing configuration matching backend
type PasswordConfig struct {
	Memory      uint32
	Iterations  uint32
	Parallelism uint8
	SaltLength  uint32
	KeyLength   uint32
}

func main() {
	config := PasswordConfig{
		Memory:      64 * 1024,
		Iterations:  3,
		Parallelism: 2,
		SaltLength:  16,
		KeyLength:   32,
	}

	// Admin users and their passwords
	adminUsers := map[string]string{
		"superadmin": "Admin123!",
		"sysadmin":   "System@2024",
		"opsadmin":   "Operations@2024",
		"demo_admin": "Demo@1234",
	}

	fmt.Println("-- Fixed admin user passwords with correct hashing format")
	fmt.Println("-- Copy these UPDATE statements to fix existing users")
	fmt.Println()

	for username, password := range adminUsers {
		hash, err := hashPassword(password, config)
		if err != nil {
			log.Fatalf("Failed to hash password for %s: %v", username, err)
		}

		fmt.Printf("-- Update %s password\n", username)
		fmt.Printf("UPDATE users SET password = '%s' WHERE username = '%s';\n\n", hash, username)
	}

	fmt.Println("-- After running these updates, test login with:")
	fmt.Println("-- superadmin / Admin123!")
	fmt.Println("-- sysadmin / System@2024")
	fmt.Println("-- opsadmin / Operations@2024")
	fmt.Println("-- demo_admin / Demo@1234")
}

func hashPassword(password string, config PasswordConfig) (string, error) {
	salt := make([]byte, config.SaltLength)
	if _, err := rand.Read(salt); err != nil {
		return "", fmt.Errorf("failed to generate salt: %w", err)
	}

	hash := argon2.IDKey([]byte(password), salt, config.Iterations,
		config.Memory, config.Parallelism, config.KeyLength)

	// Store salt + hash (backend format)
	saltedHash := append(salt, hash...)
	return base64.StdEncoding.EncodeToString(saltedHash), nil
}
