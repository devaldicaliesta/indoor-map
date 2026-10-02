export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: { extensions?: Json; operationName?: string; query?: string; variables?: Json };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      audit_events: {
        Row: {
          action: string;
          details: NonNullable<Json>;
          entity: string | null;
          entity_id: string | null;
          id: number;
          occurred_at: string;
          user_id: string | null;
        };
        Insert: {
          action: string;
          details?: NonNullable<Json>;
          entity?: string | null;
          entity_id?: string | null;
          id?: never;
          occurred_at?: string;
          user_id?: string | null;
        };
        Update: {
          action?: string;
          details?: NonNullable<Json>;
          entity?: string | null;
          entity_id?: string | null;
          id?: never;
          occurred_at?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      buildings: {
        Row: {
          code: string;
          created_at: string;
          default_floor_id: string | null;
          footprint: unknown;
          id: string;
          name: string;
          sort_order: number;
          updated_at: string;
          venue_id: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          default_floor_id?: string | null;
          footprint?: unknown;
          id?: string;
          name: string;
          sort_order?: number;
          updated_at?: string;
          venue_id: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          default_floor_id?: string | null;
          footprint?: unknown;
          id?: string;
          name?: string;
          sort_order?: number;
          updated_at?: string;
          venue_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'buildings_default_floor_fk';
            columns: ['default_floor_id'];
            isOneToOne: false;
            referencedRelation: 'floors';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'buildings_venue_id_fkey';
            columns: ['venue_id'];
            isOneToOne: false;
            referencedRelation: 'venues';
            referencedColumns: ['id'];
          },
        ];
      };
      categories: {
        Row: {
          icon: string | null;
          id: string;
          location_type_id: string;
          name: string;
          sort_order: number;
        };
        Insert: {
          icon?: string | null;
          id?: string;
          location_type_id: string;
          name: string;
          sort_order?: number;
        };
        Update: {
          icon?: string | null;
          id?: string;
          location_type_id?: string;
          name?: string;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'categories_location_type_id_fkey';
            columns: ['location_type_id'];
            isOneToOne: false;
            referencedRelation: 'location_types';
            referencedColumns: ['id'];
          },
        ];
      };
      closures: {
        Row: {
          connector_id: string | null;
          created_at: string;
          created_by: string | null;
          edge_id: string | null;
          ends_at: string | null;
          feature_id: string | null;
          id: string;
          reason: string;
          starts_at: string;
          updated_at: string;
          venue_id: string;
        };
        Insert: {
          connector_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          edge_id?: string | null;
          ends_at?: string | null;
          feature_id?: string | null;
          id?: string;
          reason: string;
          starts_at?: string;
          updated_at?: string;
          venue_id: string;
        };
        Update: {
          connector_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          edge_id?: string | null;
          ends_at?: string | null;
          feature_id?: string | null;
          id?: string;
          reason?: string;
          starts_at?: string;
          updated_at?: string;
          venue_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'closures_connector_id_fkey';
            columns: ['connector_id'];
            isOneToOne: false;
            referencedRelation: 'connectors';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'closures_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'closures_edge_id_fkey';
            columns: ['edge_id'];
            isOneToOne: false;
            referencedRelation: 'nav_edges';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'closures_feature_id_fkey';
            columns: ['feature_id'];
            isOneToOne: false;
            referencedRelation: 'features';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'closures_venue_id_fkey';
            columns: ['venue_id'];
            isOneToOne: false;
            referencedRelation: 'venues';
            referencedColumns: ['id'];
          },
        ];
      };
      connector_stops: {
        Row: {
          connector_id: string;
          floor_id: string;
          node_id: string;
        };
        Insert: {
          connector_id: string;
          floor_id: string;
          node_id: string;
        };
        Update: {
          connector_id?: string;
          floor_id?: string;
          node_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'connector_stops_connector_id_fkey';
            columns: ['connector_id'];
            isOneToOne: false;
            referencedRelation: 'connectors';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'connector_stops_floor_id_fkey';
            columns: ['floor_id'];
            isOneToOne: false;
            referencedRelation: 'floors';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'connector_stops_node_id_fkey';
            columns: ['node_id'];
            isOneToOne: false;
            referencedRelation: 'nav_nodes';
            referencedColumns: ['id'];
          },
        ];
      };
      connectors: {
        Row: {
          created_at: string;
          direction: Database['public']['Enums']['escalator_direction'] | null;
          id: string;
          is_accessible: boolean;
          kind: Database['public']['Enums']['connector_kind'];
          name: string;
          updated_at: string;
          venue_id: string;
        };
        Insert: {
          created_at?: string;
          direction?: Database['public']['Enums']['escalator_direction'] | null;
          id?: string;
          is_accessible: boolean;
          kind: Database['public']['Enums']['connector_kind'];
          name: string;
          updated_at?: string;
          venue_id: string;
        };
        Update: {
          created_at?: string;
          direction?: Database['public']['Enums']['escalator_direction'] | null;
          id?: string;
          is_accessible?: boolean;
          kind?: Database['public']['Enums']['connector_kind'];
          name?: string;
          updated_at?: string;
          venue_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'connectors_venue_id_fkey';
            columns: ['venue_id'];
            isOneToOne: false;
            referencedRelation: 'venues';
            referencedColumns: ['id'];
          },
        ];
      };
      display_settings: {
        Row: {
          branding: NonNullable<Json>;
          camera: Json | null;
          colors: NonNullable<Json>;
          default_mode: Database['public']['Enums']['display_mode'];
          heights: NonNullable<Json>;
          updated_at: string;
          venue_id: string;
        };
        Insert: {
          branding?: NonNullable<Json>;
          camera?: Json | null;
          colors?: NonNullable<Json>;
          default_mode?: Database['public']['Enums']['display_mode'];
          heights?: NonNullable<Json>;
          updated_at?: string;
          venue_id: string;
        };
        Update: {
          branding?: NonNullable<Json>;
          camera?: Json | null;
          colors?: NonNullable<Json>;
          default_mode?: Database['public']['Enums']['display_mode'];
          heights?: NonNullable<Json>;
          updated_at?: string;
          venue_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'display_settings_venue_id_fkey';
            columns: ['venue_id'];
            isOneToOne: true;
            referencedRelation: 'venues';
            referencedColumns: ['id'];
          },
        ];
      };
      edit_locks: {
        Row: {
          floor_id: string;
          last_activity_at: string;
          started_at: string;
          user_id: string;
        };
        Insert: {
          floor_id: string;
          last_activity_at?: string;
          started_at?: string;
          user_id: string;
        };
        Update: {
          floor_id?: string;
          last_activity_at?: string;
          started_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'edit_locks_floor_id_fkey';
            columns: ['floor_id'];
            isOneToOne: true;
            referencedRelation: 'floors';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'edit_locks_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['user_id'];
          },
        ];
      };
      facility_types: {
        Row: {
          created_at: string;
          icon_path: string | null;
          id: string;
          is_safety: boolean;
          name: string;
          sort_order: number;
          updated_at: string;
          venue_id: string;
        };
        Insert: {
          created_at?: string;
          icon_path?: string | null;
          id?: string;
          is_safety?: boolean;
          name: string;
          sort_order?: number;
          updated_at?: string;
          venue_id: string;
        };
        Update: {
          created_at?: string;
          icon_path?: string | null;
          id?: string;
          is_safety?: boolean;
          name?: string;
          sort_order?: number;
          updated_at?: string;
          venue_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'facility_types_venue_id_fkey';
            columns: ['venue_id'];
            isOneToOne: false;
            referencedRelation: 'venues';
            referencedColumns: ['id'];
          },
        ];
      };
      features: {
        Row: {
          area_m2: number | null;
          color: string | null;
          created_at: string;
          created_by: string | null;
          facility_type_id: string | null;
          floor_id: string;
          geom: unknown;
          height_m: number | null;
          id: string;
          kind: Database['public']['Enums']['feature_kind'];
          name: string | null;
          props: NonNullable<Json>;
          unit_code: string | null;
          unit_status: Database['public']['Enums']['unit_status'] | null;
          updated_at: string;
          updated_by: string | null;
          venue_id: string;
        };
        Insert: {
          area_m2?: number | null;
          color?: string | null;
          created_at?: string;
          created_by?: string | null;
          facility_type_id?: string | null;
          floor_id: string;
          geom: unknown;
          height_m?: number | null;
          id?: string;
          kind: Database['public']['Enums']['feature_kind'];
          name?: string | null;
          props?: NonNullable<Json>;
          unit_code?: string | null;
          unit_status?: Database['public']['Enums']['unit_status'] | null;
          updated_at?: string;
          updated_by?: string | null;
          venue_id: string;
        };
        Update: {
          area_m2?: number | null;
          color?: string | null;
          created_at?: string;
          created_by?: string | null;
          facility_type_id?: string | null;
          floor_id?: string;
          geom?: unknown;
          height_m?: number | null;
          id?: string;
          kind?: Database['public']['Enums']['feature_kind'];
          name?: string | null;
          props?: NonNullable<Json>;
          unit_code?: string | null;
          unit_status?: Database['public']['Enums']['unit_status'] | null;
          updated_at?: string;
          updated_by?: string | null;
          venue_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'features_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'features_facility_type_id_fkey';
            columns: ['facility_type_id'];
            isOneToOne: false;
            referencedRelation: 'facility_types';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'features_floor_id_fkey';
            columns: ['floor_id'];
            isOneToOne: false;
            referencedRelation: 'floors';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'features_updated_by_fkey';
            columns: ['updated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'features_venue_id_fkey';
            columns: ['venue_id'];
            isOneToOne: false;
            referencedRelation: 'venues';
            referencedColumns: ['id'];
          },
        ];
      };
      field_definitions: {
        Row: {
          field_type: Database['public']['Enums']['field_type'];
          id: string;
          is_required: boolean;
          is_searchable: boolean;
          is_visible: boolean;
          key: string;
          label: string;
          location_type_id: string;
          options: NonNullable<Json>;
          sort_order: number;
        };
        Insert: {
          field_type: Database['public']['Enums']['field_type'];
          id?: string;
          is_required?: boolean;
          is_searchable?: boolean;
          is_visible?: boolean;
          key: string;
          label: string;
          location_type_id: string;
          options?: NonNullable<Json>;
          sort_order?: number;
        };
        Update: {
          field_type?: Database['public']['Enums']['field_type'];
          id?: string;
          is_required?: boolean;
          is_searchable?: boolean;
          is_visible?: boolean;
          key?: string;
          label?: string;
          location_type_id?: string;
          options?: NonNullable<Json>;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'field_definitions_location_type_id_fkey';
            columns: ['location_type_id'];
            isOneToOne: false;
            referencedRelation: 'location_types';
            referencedColumns: ['id'];
          },
        ];
      };
      floor_plans: {
        Row: {
          cad_layers: string[];
          corners: Json | null;
          created_at: string;
          floor_id: string;
          id: string;
          is_active: boolean;
          opacity: number;
          pdf_page: number | null;
          raster_path: string | null;
          source_format: Database['public']['Enums']['floor_plan_format'];
          source_path: string;
          uploaded_by: string | null;
        };
        Insert: {
          cad_layers?: string[];
          corners?: Json | null;
          created_at?: string;
          floor_id: string;
          id?: string;
          is_active?: boolean;
          opacity?: number;
          pdf_page?: number | null;
          raster_path?: string | null;
          source_format: Database['public']['Enums']['floor_plan_format'];
          source_path: string;
          uploaded_by?: string | null;
        };
        Update: {
          cad_layers?: string[];
          corners?: Json | null;
          created_at?: string;
          floor_id?: string;
          id?: string;
          is_active?: boolean;
          opacity?: number;
          pdf_page?: number | null;
          raster_path?: string | null;
          source_format?: Database['public']['Enums']['floor_plan_format'];
          source_path?: string;
          uploaded_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'floor_plans_floor_id_fkey';
            columns: ['floor_id'];
            isOneToOne: false;
            referencedRelation: 'floors';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'floor_plans_uploaded_by_fkey';
            columns: ['uploaded_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['user_id'];
          },
        ];
      };
      floors: {
        Row: {
          building_id: string | null;
          created_at: string;
          height_m: number;
          id: string;
          is_outdoor: boolean;
          level: number;
          name: string;
          sort_order: number;
          updated_at: string;
          venue_id: string;
        };
        Insert: {
          building_id?: string | null;
          created_at?: string;
          height_m?: number;
          id?: string;
          is_outdoor?: boolean;
          level?: number;
          name: string;
          sort_order?: number;
          updated_at?: string;
          venue_id: string;
        };
        Update: {
          building_id?: string | null;
          created_at?: string;
          height_m?: number;
          id?: string;
          is_outdoor?: boolean;
          level?: number;
          name?: string;
          sort_order?: number;
          updated_at?: string;
          venue_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'floors_building_same_venue';
            columns: ['building_id', 'venue_id'];
            isOneToOne: false;
            referencedRelation: 'buildings';
            referencedColumns: ['id', 'venue_id'];
          },
          {
            foreignKeyName: 'floors_venue_id_fkey';
            columns: ['venue_id'];
            isOneToOne: false;
            referencedRelation: 'venues';
            referencedColumns: ['id'];
          },
        ];
      };
      info_points: {
        Row: {
          code: string;
          created_at: string;
          default_language: Database['public']['Enums']['language_code'];
          default_mode: Database['public']['Enums']['display_mode'];
          floor_id: string;
          force_2d: boolean;
          geom: unknown;
          heading_deg: number;
          id: string;
          idle_seconds: number;
          last_heartbeat_at: string | null;
          loaded_version: number | null;
          name: string;
          node_id: string | null;
          updated_at: string;
          venue_id: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          default_language?: Database['public']['Enums']['language_code'];
          default_mode?: Database['public']['Enums']['display_mode'];
          floor_id: string;
          force_2d?: boolean;
          geom: unknown;
          heading_deg?: number;
          id?: string;
          idle_seconds?: number;
          last_heartbeat_at?: string | null;
          loaded_version?: number | null;
          name: string;
          node_id?: string | null;
          updated_at?: string;
          venue_id: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          default_language?: Database['public']['Enums']['language_code'];
          default_mode?: Database['public']['Enums']['display_mode'];
          floor_id?: string;
          force_2d?: boolean;
          geom?: unknown;
          heading_deg?: number;
          id?: string;
          idle_seconds?: number;
          last_heartbeat_at?: string | null;
          loaded_version?: number | null;
          name?: string;
          node_id?: string | null;
          updated_at?: string;
          venue_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'info_points_floor_id_fkey';
            columns: ['floor_id'];
            isOneToOne: false;
            referencedRelation: 'floors';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'info_points_node_id_fkey';
            columns: ['node_id'];
            isOneToOne: false;
            referencedRelation: 'nav_nodes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'info_points_venue_id_fkey';
            columns: ['venue_id'];
            isOneToOne: false;
            referencedRelation: 'venues';
            referencedColumns: ['id'];
          },
        ];
      };
      installation: {
        Row: {
          created_at: string;
          id: boolean;
          instance_id: string;
        };
        Insert: {
          created_at?: string;
          id?: boolean;
          instance_id?: string;
        };
        Update: {
          created_at?: string;
          id?: boolean;
          instance_id?: string;
        };
        Relationships: [];
      };
      instruction_templates: {
        Row: {
          action: Database['public']['Enums']['instruction_action'];
          text_en: string;
          text_id: string;
          venue_id: string;
        };
        Insert: {
          action: Database['public']['Enums']['instruction_action'];
          text_en?: string;
          text_id: string;
          venue_id: string;
        };
        Update: {
          action?: Database['public']['Enums']['instruction_action'];
          text_en?: string;
          text_id?: string;
          venue_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'instruction_templates_venue_id_fkey';
            columns: ['venue_id'];
            isOneToOne: false;
            referencedRelation: 'venues';
            referencedColumns: ['id'];
          },
        ];
      };
      licenses: {
        Row: {
          activated_at: string;
          id: string;
          is_current: boolean;
          last_checkin_at: string | null;
          last_seen_at: string | null;
          license_id: string;
          payload: NonNullable<Json>;
          signature: string;
          source: Database['public']['Enums']['license_source'];
          status: Database['public']['Enums']['license_status'];
        };
        Insert: {
          activated_at?: string;
          id?: string;
          is_current?: boolean;
          last_checkin_at?: string | null;
          last_seen_at?: string | null;
          license_id: string;
          payload: NonNullable<Json>;
          signature: string;
          source: Database['public']['Enums']['license_source'];
          status: Database['public']['Enums']['license_status'];
        };
        Update: {
          activated_at?: string;
          id?: string;
          is_current?: boolean;
          last_checkin_at?: string | null;
          last_seen_at?: string | null;
          license_id?: string;
          payload?: NonNullable<Json>;
          signature?: string;
          source?: Database['public']['Enums']['license_source'];
          status?: Database['public']['Enums']['license_status'];
        };
        Relationships: [];
      };
      location_categories: {
        Row: {
          category_id: string;
          location_id: string;
        };
        Insert: {
          category_id: string;
          location_id: string;
        };
        Update: {
          category_id?: string;
          location_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'location_categories_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'location_categories_location_id_fkey';
            columns: ['location_id'];
            isOneToOne: false;
            referencedRelation: 'locations';
            referencedColumns: ['id'];
          },
        ];
      };
      location_types: {
        Row: {
          color: string | null;
          created_at: string;
          icon: string | null;
          id: string;
          name: string;
          sort_order: number;
          updated_at: string;
          venue_id: string;
        };
        Insert: {
          color?: string | null;
          created_at?: string;
          icon?: string | null;
          id?: string;
          name: string;
          sort_order?: number;
          updated_at?: string;
          venue_id: string;
        };
        Update: {
          color?: string | null;
          created_at?: string;
          icon?: string | null;
          id?: string;
          name?: string;
          sort_order?: number;
          updated_at?: string;
          venue_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'location_types_venue_id_fkey';
            columns: ['venue_id'];
            isOneToOne: false;
            referencedRelation: 'venues';
            referencedColumns: ['id'];
          },
        ];
      };
      location_units: {
        Row: {
          feature_id: string;
          is_primary: boolean;
          location_id: string;
        };
        Insert: {
          feature_id: string;
          is_primary?: boolean;
          location_id: string;
        };
        Update: {
          feature_id?: string;
          is_primary?: boolean;
          location_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'location_units_feature_id_fkey';
            columns: ['feature_id'];
            isOneToOne: false;
            referencedRelation: 'features';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'location_units_location_id_fkey';
            columns: ['location_id'];
            isOneToOne: false;
            referencedRelation: 'locations';
            referencedColumns: ['id'];
          },
        ];
      };
      locations: {
        Row: {
          code: string | null;
          created_at: string;
          custom_fields: NonNullable<Json>;
          description: string | null;
          id: string;
          location_type_id: string;
          logo_path: string | null;
          name: string;
          opening_date: string | null;
          photo_paths: string[];
          status: Database['public']['Enums']['location_status'];
          updated_at: string;
          venue_id: string;
        };
        Insert: {
          code?: string | null;
          created_at?: string;
          custom_fields?: NonNullable<Json>;
          description?: string | null;
          id?: string;
          location_type_id: string;
          logo_path?: string | null;
          name: string;
          opening_date?: string | null;
          photo_paths?: string[];
          status?: Database['public']['Enums']['location_status'];
          updated_at?: string;
          venue_id: string;
        };
        Update: {
          code?: string | null;
          created_at?: string;
          custom_fields?: NonNullable<Json>;
          description?: string | null;
          id?: string;
          location_type_id?: string;
          logo_path?: string | null;
          name?: string;
          opening_date?: string | null;
          photo_paths?: string[];
          status?: Database['public']['Enums']['location_status'];
          updated_at?: string;
          venue_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'locations_location_type_id_fkey';
            columns: ['location_type_id'];
            isOneToOne: false;
            referencedRelation: 'location_types';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'locations_venue_id_fkey';
            columns: ['venue_id'];
            isOneToOne: false;
            referencedRelation: 'venues';
            referencedColumns: ['id'];
          },
        ];
      };
      nav_edges: {
        Row: {
          created_at: string;
          floor_id: string;
          from_node_id: string;
          id: string;
          is_accessible: boolean;
          length_m: number;
          to_node_id: string;
          updated_at: string;
          venue_id: string;
        };
        Insert: {
          created_at?: string;
          floor_id: string;
          from_node_id: string;
          id?: string;
          is_accessible?: boolean;
          length_m: number;
          to_node_id: string;
          updated_at?: string;
          venue_id: string;
        };
        Update: {
          created_at?: string;
          floor_id?: string;
          from_node_id?: string;
          id?: string;
          is_accessible?: boolean;
          length_m?: number;
          to_node_id?: string;
          updated_at?: string;
          venue_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'nav_edges_floor_id_fkey';
            columns: ['floor_id'];
            isOneToOne: false;
            referencedRelation: 'floors';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'nav_edges_from_node_id_fkey';
            columns: ['from_node_id'];
            isOneToOne: false;
            referencedRelation: 'nav_nodes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'nav_edges_to_node_id_fkey';
            columns: ['to_node_id'];
            isOneToOne: false;
            referencedRelation: 'nav_nodes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'nav_edges_venue_id_fkey';
            columns: ['venue_id'];
            isOneToOne: false;
            referencedRelation: 'venues';
            referencedColumns: ['id'];
          },
        ];
      };
      nav_nodes: {
        Row: {
          created_at: string;
          feature_id: string | null;
          floor_id: string;
          geom: unknown;
          id: string;
          role: Database['public']['Enums']['node_role'];
          updated_at: string;
          venue_id: string;
        };
        Insert: {
          created_at?: string;
          feature_id?: string | null;
          floor_id: string;
          geom: unknown;
          id?: string;
          role?: Database['public']['Enums']['node_role'];
          updated_at?: string;
          venue_id: string;
        };
        Update: {
          created_at?: string;
          feature_id?: string | null;
          floor_id?: string;
          geom?: unknown;
          id?: string;
          role?: Database['public']['Enums']['node_role'];
          updated_at?: string;
          venue_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'nav_nodes_feature_id_fkey';
            columns: ['feature_id'];
            isOneToOne: false;
            referencedRelation: 'features';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'nav_nodes_floor_id_fkey';
            columns: ['floor_id'];
            isOneToOne: false;
            referencedRelation: 'floors';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'nav_nodes_venue_id_fkey';
            columns: ['venue_id'];
            isOneToOne: false;
            referencedRelation: 'venues';
            referencedColumns: ['id'];
          },
        ];
      };
      opening_hours: {
        Row: {
          closes_at: string | null;
          id: string;
          is_closed: boolean;
          location_id: string;
          opens_at: string | null;
          special_date: string | null;
          weekday: number | null;
        };
        Insert: {
          closes_at?: string | null;
          id?: string;
          is_closed?: boolean;
          location_id: string;
          opens_at?: string | null;
          special_date?: string | null;
          weekday?: number | null;
        };
        Update: {
          closes_at?: string | null;
          id?: string;
          is_closed?: boolean;
          location_id?: string;
          opens_at?: string | null;
          special_date?: string | null;
          weekday?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'opening_hours_location_id_fkey';
            columns: ['location_id'];
            isOneToOne: false;
            referencedRelation: 'locations';
            referencedColumns: ['id'];
          },
        ];
      };
      origin_points: {
        Row: {
          created_at: string;
          floor_id: string;
          geom: unknown;
          heading_deg: number;
          id: string;
          name: string;
          node_id: string | null;
          public_code: string;
          updated_at: string;
          venue_id: string;
        };
        Insert: {
          created_at?: string;
          floor_id: string;
          geom: unknown;
          heading_deg?: number;
          id?: string;
          name: string;
          node_id?: string | null;
          public_code?: string;
          updated_at?: string;
          venue_id: string;
        };
        Update: {
          created_at?: string;
          floor_id?: string;
          geom?: unknown;
          heading_deg?: number;
          id?: string;
          name?: string;
          node_id?: string | null;
          public_code?: string;
          updated_at?: string;
          venue_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'origin_points_floor_id_fkey';
            columns: ['floor_id'];
            isOneToOne: false;
            referencedRelation: 'floors';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'origin_points_node_id_fkey';
            columns: ['node_id'];
            isOneToOne: false;
            referencedRelation: 'nav_nodes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'origin_points_venue_id_fkey';
            columns: ['venue_id'];
            isOneToOne: false;
            referencedRelation: 'venues';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string;
          failed_login_count: number;
          full_name: string;
          is_active: boolean;
          locked_until: string | null;
          role: Database['public']['Enums']['app_role'];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          failed_login_count?: number;
          full_name: string;
          is_active?: boolean;
          locked_until?: string | null;
          role?: Database['public']['Enums']['app_role'];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          failed_login_count?: number;
          full_name?: string;
          is_active?: boolean;
          locked_until?: string | null;
          role?: Database['public']['Enums']['app_role'];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      publications: {
        Row: {
          id: string;
          is_active: boolean;
          notes: string | null;
          origin: Database['public']['Enums']['publication_origin'];
          published_at: string;
          published_by: string | null;
          snapshot_path: string;
          source_version: number | null;
          venue_id: string;
          version: number;
        };
        Insert: {
          id?: string;
          is_active?: boolean;
          notes?: string | null;
          origin?: Database['public']['Enums']['publication_origin'];
          published_at?: string;
          published_by?: string | null;
          snapshot_path: string;
          source_version?: number | null;
          venue_id: string;
          version: number;
        };
        Update: {
          id?: string;
          is_active?: boolean;
          notes?: string | null;
          origin?: Database['public']['Enums']['publication_origin'];
          published_at?: string;
          published_by?: string | null;
          snapshot_path?: string;
          source_version?: number | null;
          venue_id?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'publications_published_by_fkey';
            columns: ['published_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'publications_venue_id_fkey';
            columns: ['venue_id'];
            isOneToOne: false;
            referencedRelation: 'venues';
            referencedColumns: ['id'];
          },
        ];
      };
      search_aliases: {
        Row: {
          category_id: string | null;
          facility_type_id: string | null;
          id: string;
          keyword: string;
          location_id: string | null;
          venue_id: string;
        };
        Insert: {
          category_id?: string | null;
          facility_type_id?: string | null;
          id?: string;
          keyword: string;
          location_id?: string | null;
          venue_id: string;
        };
        Update: {
          category_id?: string | null;
          facility_type_id?: string | null;
          id?: string;
          keyword?: string;
          location_id?: string | null;
          venue_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'search_aliases_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'search_aliases_facility_type_id_fkey';
            columns: ['facility_type_id'];
            isOneToOne: false;
            referencedRelation: 'facility_types';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'search_aliases_location_id_fkey';
            columns: ['location_id'];
            isOneToOne: false;
            referencedRelation: 'locations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'search_aliases_venue_id_fkey';
            columns: ['venue_id'];
            isOneToOne: false;
            referencedRelation: 'venues';
            referencedColumns: ['id'];
          },
        ];
      };
      system_settings: {
        Row: {
          default_language: Database['public']['Enums']['language_code'];
          default_timezone: string;
          id: boolean;
          public_visitor_url: string | null;
          smtp_from: string | null;
          smtp_host: string | null;
          smtp_port: number | null;
          smtp_username: string | null;
          updated_at: string;
        };
        Insert: {
          default_language?: Database['public']['Enums']['language_code'];
          default_timezone?: string;
          id?: boolean;
          public_visitor_url?: string | null;
          smtp_from?: string | null;
          smtp_host?: string | null;
          smtp_port?: number | null;
          smtp_username?: string | null;
          updated_at?: string;
        };
        Update: {
          default_language?: Database['public']['Enums']['language_code'];
          default_timezone?: string;
          id?: boolean;
          public_visitor_url?: string | null;
          smtp_from?: string | null;
          smtp_host?: string | null;
          smtp_port?: number | null;
          smtp_username?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      venues: {
        Row: {
          address: string | null;
          center: unknown;
          created_at: string;
          default_building_id: string | null;
          id: string;
          logo_path: string | null;
          name: string;
          timezone: string;
          updated_at: string;
          venue_type: Database['public']['Enums']['venue_type'];
        };
        Insert: {
          address?: string | null;
          center?: unknown;
          created_at?: string;
          default_building_id?: string | null;
          id?: string;
          logo_path?: string | null;
          name: string;
          timezone?: string;
          updated_at?: string;
          venue_type?: Database['public']['Enums']['venue_type'];
        };
        Update: {
          address?: string | null;
          center?: unknown;
          created_at?: string;
          default_building_id?: string | null;
          id?: string;
          logo_path?: string | null;
          name?: string;
          timezone?: string;
          updated_at?: string;
          venue_type?: Database['public']['Enums']['venue_type'];
        };
        Relationships: [
          {
            foreignKeyName: 'venues_default_building_fk';
            columns: ['default_building_id'];
            isOneToOne: false;
            referencedRelation: 'buildings';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      apply_template: {
        Args: {
          p_template: Json;
          p_venue_id: string;
          p_venue_type: Database['public']['Enums']['venue_type'];
        };
        Returns: undefined;
      };
      acquire_edit_lock: {
        Args: { p_floor_id: string };
        Returns: {
          user_id: string;
          full_name: string;
          started_at: string;
          last_activity_at: string;
        }[];
      };
      delete_connector: { Args: { p_id: string }; Returns: undefined };
      public_visitor_url: { Args: Record<PropertyKey, never>; Returns: string };
      publish_abort: { Args: { p_publication_id: string }; Returns: undefined };
      publish_begin: {
        Args: { p_venue_id: string };
        Returns: {
          publication_id: string;
          published_at: string;
          version: number;
        }[];
      };
      publish_commit: { Args: { p_publication_id: string }; Returns: undefined };
      release_edit_lock: { Args: { p_floor_id: string }; Returns: undefined };
      set_search_aliases: {
        Args: {
          p_keywords: string[];
          p_target_id: string;
          p_target_kind: string;
          p_venue_id: string;
        };
        Returns: undefined;
      };
      save_connector: {
        Args: {
          p_direction?: Database['public']['Enums']['escalator_direction'];
          p_floor_ids: string[];
          p_id: string;
          p_is_accessible: boolean;
          p_kind: Database['public']['Enums']['connector_kind'];
          p_lat: number;
          p_lng: number;
          p_name: string;
          p_venue_id: string;
        };
        Returns: {
          floor_id: string;
          node_id: string;
        }[];
      };
      save_location: {
        Args: {
          p_category_ids: string[];
          p_code?: string;
          p_description?: string;
          p_id: string;
          p_location_type_id: string;
          p_logo_path?: string;
          p_name: string;
          p_photo_paths: string[];
          p_primary_unit_id?: string;
          p_unit_ids: string[];
          p_venue_id: string;
          p_custom_fields?: Json;
          p_status?: Database['public']['Enums']['location_status'];
          p_opening_date?: string;
          p_hours?: Json;
        };
        Returns: string;
      };
      import_locations: {
        Args: { p_location_type_id: string; p_rows: Json; p_venue_id: string };
        Returns: number;
      };
      remove_field_definition: { Args: { p_id: string }; Returns: undefined };
      set_smtp_password: { Args: { p_password: string }; Returns: undefined };
      smtp_password_for_sending: { Args: Record<PropertyKey, never>; Returns: string };
      smtp_password_is_set: { Args: Record<PropertyKey, never>; Returns: boolean };
      take_over_edit_lock: { Args: { p_floor_id: string }; Returns: undefined };
    };
    Enums: {
      app_role: 'super_admin' | 'admin' | 'editor' | 'operator' | 'viewer';
      connector_kind: 'elevator' | 'escalator' | 'stairs' | 'building_door';
      display_mode: '2d' | '3d';
      escalator_direction: 'up' | 'down' | 'both';
      feature_kind:
        | 'unit'
        | 'corridor'
        | 'wall'
        | 'door'
        | 'elevator'
        | 'escalator'
        | 'stairs'
        | 'exit'
        | 'non_walkable'
        | 'outdoor_area'
        | 'facility'
        | 'landmark';
      field_type: 'text' | 'number' | 'select' | 'opening_hours' | 'image' | 'link';
      floor_plan_format: 'png' | 'jpg' | 'pdf' | 'dwg' | 'dxf';
      instruction_action:
        | 'start'
        | 'straight'
        | 'turn_left'
        | 'turn_right'
        | 'slight_left'
        | 'slight_right'
        | 'elevator_up'
        | 'elevator_down'
        | 'escalator_up'
        | 'escalator_down'
        | 'stairs_up'
        | 'stairs_down'
        | 'exit_building'
        | 'enter_building'
        | 'arrive';
      language_code: 'id' | 'en';
      license_source: 'online' | 'manual';
      license_status: 'active' | 'grace' | 'expired' | 'revoked';
      location_status: 'active' | 'coming_soon' | 'inactive_temporary' | 'inactive_permanent';
      node_role: 'path' | 'entrance' | 'origin' | 'info_point' | 'connector';
      publication_origin: 'publish' | 'rollback';
      unit_status: 'occupied' | 'vacant' | 'renovation';
      venue_type:
        | 'hospital'
        | 'campus'
        | 'office'
        | 'airport_station'
        | 'factory_warehouse'
        | 'shopping_center'
        | 'custom';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ['super_admin', 'admin', 'editor', 'operator', 'viewer'],
      connector_kind: ['elevator', 'escalator', 'stairs', 'building_door'],
      display_mode: ['2d', '3d'],
      escalator_direction: ['up', 'down', 'both'],
      feature_kind: [
        'unit',
        'corridor',
        'wall',
        'door',
        'elevator',
        'escalator',
        'stairs',
        'exit',
        'non_walkable',
        'outdoor_area',
        'facility',
        'landmark',
      ],
      field_type: ['text', 'number', 'select', 'opening_hours', 'image', 'link'],
      floor_plan_format: ['png', 'jpg', 'pdf', 'dwg', 'dxf'],
      instruction_action: [
        'start',
        'straight',
        'turn_left',
        'turn_right',
        'slight_left',
        'slight_right',
        'elevator_up',
        'elevator_down',
        'escalator_up',
        'escalator_down',
        'stairs_up',
        'stairs_down',
        'exit_building',
        'enter_building',
        'arrive',
      ],
      language_code: ['id', 'en'],
      license_source: ['online', 'manual'],
      license_status: ['active', 'grace', 'expired', 'revoked'],
      location_status: ['active', 'coming_soon', 'inactive_temporary', 'inactive_permanent'],
      node_role: ['path', 'entrance', 'origin', 'info_point', 'connector'],
      publication_origin: ['publish', 'rollback'],
      unit_status: ['occupied', 'vacant', 'renovation'],
      venue_type: [
        'hospital',
        'campus',
        'office',
        'airport_station',
        'factory_warehouse',
        'shopping_center',
        'custom',
      ],
    },
  },
} as const;
