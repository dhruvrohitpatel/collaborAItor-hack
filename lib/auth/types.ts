export type AppRole = "instructor" | "student";

export type SessionUser = {
  uid: string;
  email: string;
  role: AppRole;
  name: string | null;
  picture: string | null;
  emailVerified: boolean;
};
