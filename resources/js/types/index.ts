export type Role = 'student' | 'faculty' | 'admin';

export interface FacultyStatus {
    id: number;
    user_id: number;
    status: 'available' | 'busy';
    catering_count: number;
    updated_at: string;
}

export interface User {
    id: number;
    name: string;
    email: string;
    role: Role;
    department?: string | null;
    office_location?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    location_consent_at?: string | null;
    student_id?: string | null;
    course?: string | null;
    year_level?: number | null;
    employee_id?: string | null;
    faculty_status?: FacultyStatus | null;
    schedules_count?: number;
}

export interface Friendship {
    id: number;
    requester_id: number;
    addressee_id: number;
    status: 'pending' | 'accepted' | 'declined' | 'blocked';
    requester: User;
    addressee: User;
    created_at: string;
}

export interface Message {
    id: number;
    conversation_id: number;
    sender_id: number;
    body: string;
    type: 'text' | 'system';
    created_at: string;
    sender: Pick<User, 'id' | 'name' | 'role'>;
}

export interface ConversationParticipantPivot {
    joined_at: string;
    last_read_at: string | null;
}

export interface ConversationParticipant extends User {
    pivot: ConversationParticipantPivot;
}

export interface Conversation {
    id: number;
    type: 'private' | 'group';
    name: string | null;
    created_by: number;
    creator?: User;
    participants: ConversationParticipant[];
    latest_message?: Message | null;
    messages?: Message[];
    unread_count?: number;
    created_at: string;
    updated_at: string;
}

export interface MeetingParticipantPivot {
    status: 'invited' | 'accepted' | 'declined';
}

export interface MeetingParticipant extends User {
    pivot: MeetingParticipantPivot;
}

export interface CateringSession {
    id: number;
    faculty_id: number;
    student_id: number;
    meeting_id: number | null;
    started_at: string;
    ended_at: string | null;
    student: Pick<User, 'id' | 'name' | 'role' | 'course' | 'year_level'>;
}

export interface Meeting {
    id: number;
    created_by: number;
    title: string;
    scheduled_at: string;
    duration_minutes: number;
    status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
    room_code: string;
    creator: User;
    participants: MeetingParticipant[];
    participants_count?: number;
    catering_sessions?: CateringSession[];
    created_at: string;
    updated_at: string;
}

export interface Notifications {
    pending_friends: number;
    unread_messages: number;
}

export interface PageProps {
    auth: { user: User };
    notifications: Notifications | null;
    [key: string]: unknown;
}
