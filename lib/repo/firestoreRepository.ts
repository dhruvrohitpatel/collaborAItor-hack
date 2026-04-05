import { collection, doc, getDocs, setDoc } from "firebase/firestore";

import { getFirestoreDb, isFirebaseConfigured } from "@/lib/firebase";
import { studentIntakeSchema } from "@/lib/schemas";
import type { StudentIntake } from "@/types/domain";

function getConfiguredFirestoreDb() {
  if (!isFirebaseConfigured) {
    throw new Error(
      "Firestore is not configured. Set the required NEXT_PUBLIC_FIREBASE_* environment variables or enable USE_MOCK_DATA=true."
    );
  }

  const db = getFirestoreDb();

  if (!db) {
    throw new Error(
      "Firestore failed to initialize. Check your Firebase configuration or enable USE_MOCK_DATA=true."
    );
  }

  return db;
}

export async function getFirestoreStudents(): Promise<StudentIntake[]> {
  const db = getConfiguredFirestoreDb();
  const snapshot = await getDocs(collection(db, "students"));

  return snapshot.docs
    .map((studentDoc) =>
      studentIntakeSchema.parse({
        ...studentDoc.data(),
        id: studentDoc.id
      })
    )
    .sort((left, right) => left.id.localeCompare(right.id));
}

export async function addFirestoreStudentIntake(input: StudentIntake): Promise<StudentIntake> {
  const db = getConfiguredFirestoreDb();
  const student = studentIntakeSchema.parse(input);

  await setDoc(doc(db, "students", student.id), student);

  return student;
}
