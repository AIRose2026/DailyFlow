// Hand-written types matching supabase/migrations/0001_init.sql.
// Once the project is linked, prefer regenerating this file with:
//   supabase gen types typescript --project-id <ref> > src/lib/supabase/types.ts

export type TaskStatus = "open" | "done";
export type TaskSource = "manual" | "email" | "recurring_instance";

export interface Database {
  public: {
    Tables: {
      tasks: {
        Relationships: [];
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          category: string | null;
          status: TaskStatus;
          due_date: string | null;
          source: TaskSource;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          category?: string | null;
          status?: TaskStatus;
          due_date?: string | null;
          source?: TaskSource;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tasks"]["Insert"]>;
      };
      recurring_tasks: {
        Relationships: [];
        Row: {
          id: string;
          user_id: string;
          title: string;
          category: string | null;
          estimated_minutes: number;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          category?: string | null;
          estimated_minutes?: number;
          active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["recurring_tasks"]["Insert"]>;
      };
      recurring_task_completions: {
        Relationships: [
          {
            foreignKeyName: "recurring_task_completions_recurring_task_id_fkey";
            columns: ["recurring_task_id"];
            isOneToOne: false;
            referencedRelation: "recurring_tasks";
            referencedColumns: ["id"];
          },
        ];
        Row: {
          id: string;
          recurring_task_id: string;
          user_id: string;
          completed_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          recurring_task_id: string;
          user_id: string;
          completed_date: string;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["recurring_task_completions"]["Insert"]
        >;
      };
      email_tasks: {
        Relationships: [
          {
            foreignKeyName: "email_tasks_task_id_fkey";
            columns: ["task_id"];
            isOneToOne: true;
            referencedRelation: "tasks";
            referencedColumns: ["id"];
          },
        ];
        Row: {
          id: string;
          task_id: string;
          email_subject: string;
          email_sender: string;
          email_preview: string | null;
          outlook_flag_id: string | null;
          responded: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          email_subject: string;
          email_sender: string;
          email_preview?: string | null;
          outlook_flag_id?: string | null;
          responded?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["email_tasks"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      task_status: TaskStatus;
      task_source: TaskSource;
    };
    CompositeTypes: Record<string, never>;
  };
}

export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type RecurringTask = Database["public"]["Tables"]["recurring_tasks"]["Row"];
export type RecurringTaskCompletion =
  Database["public"]["Tables"]["recurring_task_completions"]["Row"];
export type EmailTask = Database["public"]["Tables"]["email_tasks"]["Row"];

export type EmailTaskWithContext = EmailTask & { task: Task };
