import { expandedStudents } from "@/data/generateExpandedStudents";
import { seedStudents } from "@/data/seedStudents";
import { parseEmailList } from "@/lib/email";
import type { StudentIntake } from "@/types/domain";

function applyDemoStudentEmailOverrides(students: StudentIntake[]) {
  const overrides = parseEmailList(process.env.DEMO_STUDENT_EMAILS).slice(0, 2);

  if (!overrides.length) {
    return students.map((student) => ({ ...student }));
  }

  return students.map((student, index) =>
    index < overrides.length
      ? {
          ...student,
          email: overrides[index]
        }
      : { ...student }
  );
}

export function getSeedStudents() {
  return applyDemoStudentEmailOverrides(seedStudents);
}

export function getExpandedStudents() {
  return applyDemoStudentEmailOverrides(expandedStudents);
}
