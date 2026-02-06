import { Knex } from "knex";
import * as bcrypt from "bcrypt";

/**
 * Seed users for testing
 *
 * Creates example users with hashed passwords.
 * All test users have password: "password123"
 */
export async function seed(knex: Knex): Promise<void> {
    // Deletes ALL existing entries
    await knex("users").del();

    // Hash password for test users (password: "password123")
    const hashedPassword = await bcrypt.hash("password123", 10);

    // Inserts seed entries
    await knex("users").insert([
        {
            email: "admin@example.com",
            password: hashedPassword,
            name: "Admin User",
            created_at: knex.fn.now(),
            updated_at: knex.fn.now(),
        },
        {
            email: "user@example.com",
            password: hashedPassword,
            name: "Test User",
            created_at: knex.fn.now(),
            updated_at: knex.fn.now(),
        },
        {
            email: "demo@example.com",
            password: hashedPassword,
            name: "Demo User",
            created_at: knex.fn.now(),
            updated_at: knex.fn.now(),
        },
    ]);
};
