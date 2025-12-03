export interface Tag {
    id: string;
    name: string;
    color: string;
    minRequired: number;
    maxAllowed: number | null;
}

export interface TimeSection {
    id: string;
    label: string;
    startTime: string;
    endTime: string;
    order: number;
}

export interface CourseOccurrence {
    id?: string;
    dayOfWeek: number;
    sectionId: string;
    section?: TimeSection;
}

export interface Course {
    id: string;
    name: string;
    description: string | null;
    capacity: number | null;
    occurrences: CourseOccurrence[];
    tags: Tag[];
}

export interface Project {
    id: string;
    name: string;
    description: string;
    timezone: string;
    submissionStart: string;
    submissionEnd: string;
}
