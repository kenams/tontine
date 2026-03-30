import { supabaseAdmin } from "../config/supabase";

/**
 * Socle minimal pour mutualiser les opérations Supabase.
 */
export abstract class BaseRepository<TRecord extends Record<string, unknown>> {
  protected supabase = supabaseAdmin;

  protected abstract tableName: string;

  protected async findAll(filters?: Record<string, unknown>): Promise<TRecord[]> {
    let query = this.supabase.from(this.tableName).select("*");

    if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        query = query.eq(key, value);
      }
    }

    const { data, error } = await query;

    if (error) {
      this.handleError(error, `de lecture multiple sur ${this.tableName}`);
    }

    return (data as TRecord[] | null) ?? [];
  }

  protected async findById(id: string): Promise<TRecord | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      this.handleError(error, `de lecture par id sur ${this.tableName}`);
    }

    return (data as TRecord | null) ?? null;
  }

  protected async create(data: Partial<TRecord>): Promise<TRecord> {
    const { data: createdRecord, error } = await this.supabase
      .from(this.tableName)
      .insert(data)
      .select("*")
      .single();

    if (error || !createdRecord) {
      this.handleError(error, `de création sur ${this.tableName}`);
    }

    return createdRecord as TRecord;
  }

  protected async update(id: string, data: Partial<TRecord>): Promise<TRecord> {
    const { data: updatedRecord, error } = await this.supabase
      .from(this.tableName)
      .update(data)
      .eq("id", id)
      .select("*")
      .single();

    if (error || !updatedRecord) {
      this.handleError(error, `de mise à jour sur ${this.tableName}`);
    }

    return updatedRecord as TRecord;
  }

  protected async delete(id: string): Promise<void> {
    const { error } = await this.supabase.from(this.tableName).delete().eq("id", id);

    if (error) {
      this.handleError(error, `de suppression sur ${this.tableName}`);
    }
  }

  protected handleError(error: unknown, operation: string): never {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    throw new Error(`Erreur ${operation}: ${message}`);
  }
}

