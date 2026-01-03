/**
 * Crew name data for procedural generation.
 */

export const FIRST_NAMES: string[] = [
  "Kai", "Yuki", "Chen", "Hana", "Jin", "Mei", "Takeshi", "Akira", "Suki", "Ren",
  "Aisha", "Raj", "Priya", "Vikram", "Deepa", "Arjun",
  "Dmitri", "Katya", "Nikolai", "Anya", "Ivan", "Mila",
  "Marcus", "Elena", "Victor", "Lucia", "Felix", "Clara",
  "Carlos", "Rosa", "Diego", "Sofia", "Miguel", "Luna",
  "Amara", "Kofi", "Zara", "Jabari", "Nia", "Kwame",
  "Omar", "Fatima", "Hassan", "Layla", "Samir", "Nadia",
  "Nova", "Rook", "Jax", "Sable", "Vex", "Cipher", "Ash", "Storm", "Blaze", "Echo",
];

export const LAST_NAMES: string[] = [
  "Tanaka", "Kim", "Wong", "Nakamura", "Park", "Nguyen", "Chen", "Yamamoto", "Lee", "Sato",
  "Singh", "Patel", "Sharma", "Kumar", "Gupta", "Khan",
  "Petrov", "Volkov", "Kozlov", "Novak", "Ivanov", "Morozov",
  "Mueller", "Schmidt", "Bernard", "Rossi", "Fischer", "Weber",
  "Vasquez", "Reyes", "Morales", "Santos", "Ortega", "Cruz",
  "Okonkwo", "Mensah", "Diallo", "Mbeki", "Nkosi", "Toure",
  "Hassan", "Nazari", "Khalil", "Abbasi", "Farouk", "Mansour",
  "Steele", "Vance", "Cross", "Stone", "Drake", "Frost", "Cole", "Quinn", "Reeve", "Locke",
];

export function getRandomFirstName(randomFn: () => number): string {
  const index = Math.floor(randomFn() * FIRST_NAMES.length);
  return FIRST_NAMES[index];
}

export function getRandomLastName(randomFn: () => number): string {
  const index = Math.floor(randomFn() * LAST_NAMES.length);
  return LAST_NAMES[index];
}

export function generateFullName(randomFn: () => number): {
  firstName: string;
  lastName: string;
  name: string;
} {
  const firstName = getRandomFirstName(randomFn);
  const lastName = getRandomLastName(randomFn);
  return { firstName, lastName, name: `${firstName} ${lastName}` };
}