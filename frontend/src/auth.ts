export type AuthUser = {
  fullName: string;
  email: string;
};

type StoredUser = AuthUser & {
  salt: string;
  passwordHash: string;
};

const USERS_KEY = "nyaylens.demoUsers.v1";
const SESSION_KEY = "nyaylens.demoSession.v1";
const PBKDF2_ITERATIONS = 210_000;

function getStoredUsers(): StoredUser[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(USERS_KEY) ?? "[]");
    return Array.isArray(value) ? (value as StoredUser[]) : [];
  } catch {
    return [];
  }
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function hashPassword(password: string, saltHex: string): Promise<string> {
  const salt = Uint8Array.from(
    saltHex.match(/.{2}/g) ?? [],
    (byte) => Number.parseInt(byte, 16),
  );
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    key,
    256,
  );
  return toHex(new Uint8Array(bits));
}

function saveSession(user: AuthUser): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function getCurrentUser(): AuthUser | null {
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? "null");
    if (
      typeof value === "object" &&
      value !== null &&
      "fullName" in value &&
      typeof value.fullName === "string" &&
      "email" in value &&
      typeof value.email === "string"
    ) {
      return { fullName: value.fullName, email: value.email };
    }
  } catch {
    return null;
  }
  return null;
}

export async function signUp(
  fullName: string,
  email: string,
  password: string,
): Promise<AuthUser> {
  const normalizedEmail = email.trim().toLowerCase();
  const users = getStoredUsers();
  if (users.some((user) => user.email === normalizedEmail)) {
    throw new Error("An account with this email already exists. Please log in.");
  }

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const user: StoredUser = {
    fullName: fullName.trim(),
    email: normalizedEmail,
    salt: toHex(salt),
    passwordHash: await hashPassword(password, toHex(salt)),
  };
  localStorage.setItem(USERS_KEY, JSON.stringify([...users, user]));
  const sessionUser = { fullName: user.fullName, email: user.email };
  saveSession(sessionUser);
  return sessionUser;
}

export async function logIn(email: string, password: string): Promise<AuthUser> {
  const normalizedEmail = email.trim().toLowerCase();
  const user = getStoredUsers().find((item) => item.email === normalizedEmail);
  if (!user || (await hashPassword(password, user.salt)) !== user.passwordHash) {
    throw new Error("Email or password is incorrect.");
  }
  const sessionUser = { fullName: user.fullName, email: user.email };
  saveSession(sessionUser);
  return sessionUser;
}

export function logOut(): void {
  sessionStorage.removeItem(SESSION_KEY);
}
