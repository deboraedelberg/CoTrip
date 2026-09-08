export type ListMemberRole = 'owner' | 'member';
export type InviteStatus = 'pending' | 'accepted';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          name: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & { id: string };
        Update: Partial<Database['public']['Tables']['profiles']['Row']>;
        Relationships: [];
      };
      lists: {
        Row: {
          id: string;
          name: string;
          created_by: string;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['lists']['Row']> & {
          name: string;
          created_by: string;
        };
        Update: Partial<Database['public']['Tables']['lists']['Row']>;
        Relationships: [];
      };
      list_members: {
        Row: {
          id: string;
          list_id: string;
          user_id: string;
          role: ListMemberRole;
          joined_at: string;
        };
        Insert: Partial<Database['public']['Tables']['list_members']['Row']> & {
          list_id: string;
          user_id: string;
        };
        Update: Partial<Database['public']['Tables']['list_members']['Row']>;
        Relationships: [];
      };
      invites: {
        Row: {
          id: string;
          list_id: string;
          email: string;
          invited_by: string;
          status: InviteStatus;
          token: string;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['invites']['Row']> & {
          list_id: string;
          email: string;
          invited_by: string;
        };
        Update: Partial<Database['public']['Tables']['invites']['Row']>;
        Relationships: [];
      };
      items: {
        Row: {
          id: string;
          list_id: string;
          name: string;
          quantity: number;
          category: string | null;
          assigned_to: string | null;
          is_packed: boolean;
          packed_by: string | null;
          packed_at: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['items']['Row']> & {
          list_id: string;
          name: string;
          created_by: string;
        };
        Update: Partial<Database['public']['Tables']['items']['Row']>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      accept_pending_invites_for_current_user: {
        Args: Record<string, never>;
        Returns: void;
      };
    };
  };
}
