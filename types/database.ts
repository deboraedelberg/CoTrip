export type TripMemberRole = 'owner' | 'member';
export type InviteStatus = 'pending' | 'accepted' | 'revoked';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & { id: string };
        Update: Partial<Database['public']['Tables']['profiles']['Row']>;
        Relationships: [];
      };
      trips: {
        Row: {
          id: string;
          name: string;
          destination: string | null;
          start_date: string | null;
          end_date: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['trips']['Row']> & {
          name: string;
          created_by: string;
        };
        Update: Partial<Database['public']['Tables']['trips']['Row']>;
        Relationships: [];
      };
      trip_members: {
        Row: {
          trip_id: string;
          user_id: string;
          role: TripMemberRole;
          joined_at: string;
        };
        Insert: Partial<Database['public']['Tables']['trip_members']['Row']> & {
          trip_id: string;
          user_id: string;
        };
        Update: Partial<Database['public']['Tables']['trip_members']['Row']>;
        Relationships: [
          {
            foreignKeyName: 'trip_members_profile_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      packing_lists: {
        Row: {
          id: string;
          trip_id: string;
          name: string;
          position: number;
          created_by: string;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['packing_lists']['Row']> & {
          trip_id: string;
          name: string;
          created_by: string;
        };
        Update: Partial<Database['public']['Tables']['packing_lists']['Row']>;
        Relationships: [];
      };
      items: {
        Row: {
          id: string;
          packing_list_id: string;
          assigned_to: string | null;
          category: string | null;
          name: string;
          quantity: number;
          position: number;
          is_packed: boolean;
          packed_by: string | null;
          packed_at: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['items']['Row']> & {
          packing_list_id: string;
          name: string;
          created_by: string;
        };
        Update: Partial<Database['public']['Tables']['items']['Row']>;
        Relationships: [];
      };
      invites: {
        Row: {
          id: string;
          trip_id: string;
          email: string;
          token: string;
          status: InviteStatus;
          invited_by: string;
          created_at: string;
          accepted_at: string | null;
        };
        Insert: Partial<Database['public']['Tables']['invites']['Row']> & {
          trip_id: string;
          email: string;
          invited_by: string;
        };
        Update: Partial<Database['public']['Tables']['invites']['Row']>;
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
