import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import type { StudentIntake } from "@/types/domain";

type RosterTableProps = {
  students: StudentIntake[];
};

export function RosterTable({ students }: RosterTableProps) {
  if (!students.length) {
    return <p className="text-sm text-muted-foreground">No students loaded yet.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Timezone</TableHead>
          <TableHead>Preferred Role</TableHead>
          <TableHead>Style</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {students.map((student) => (
          <TableRow key={student.id}>
            <TableCell className="font-medium">{student.name}</TableCell>
            <TableCell>{student.email}</TableCell>
            <TableCell>{student.timezone}</TableCell>
            <TableCell>{student.preferredRole}</TableCell>
            <TableCell>
              <Badge variant="secondary">{student.communicationStyle}</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
