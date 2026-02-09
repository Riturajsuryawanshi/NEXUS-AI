import { supabase } from './supabaseClient';

export class StorageService {
  static async upload(path: string, content: string | Blob): Promise<string> {
    const { error } = await supabase.storage
      .from('datasets')
      .upload(path, content, { upsert: true });

    if (error) throw error;
    return path;
  }

  static async download(path: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from('datasets')
      .download(path);

    if (error) throw error;
    return await data.text();
  }
}
