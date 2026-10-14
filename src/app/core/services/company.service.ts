import { Injectable, signal, computed, inject } from '@angular/core';
import { Company } from '../models/company.model';
import { MOCK_COMPANIES } from '../data/mock-data';
import { SupabaseService } from './supabase.service';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class CompanyService {
  private supabase = inject(SupabaseService);
  private toast = inject(ToastService);

  private readonly LOCAL_STORAGE_KEY = 'placementconnect_companies_cache';

  private companiesSignal = signal<Company[]>(this.loadInitialCompanies());
  isLoading = signal<boolean>(false);

  companies = computed(() => this.companiesSignal());

  constructor() {
    this.fetchCompaniesFromDatabase();
  }

  private loadInitialCompanies(): Company[] {
    try {
      const stored = localStorage.getItem(this.LOCAL_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    return MOCK_COMPANIES;
  }

  private saveCompaniesToCache(list: Company[]) {
    try {
      localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(list));
    } catch {
      // ignore
    }
  }

  async fetchCompaniesFromDatabase() {
    const client = this.supabase.getClient();
    if (!this.supabase.isConfigured || !client) return;

    this.isLoading.set(true);
    try {
      const { data, error } = await client
        .from('companies')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.warn('Could not fetch companies from Supabase:', error.message);
        return;
      }

      if (data && data.length > 0) {
        const mapped: Company[] = data.map((d: any) => this.mapDbRowToCompany(d));
        this.companiesSignal.set(mapped);
        this.saveCompaniesToCache(mapped);
      }
    } catch (e) {
      console.warn('Companies fetch exception:', e);
    } finally {
      this.isLoading.set(false);
    }
  }

  private mapDbRowToCompany(row: any): Company {
    return {
      id: row.id,
      name: row.name,
      logo: row.logo || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=128&auto=format&fit=crop&q=80',
      website: row.website || '',
      description: row.description || '',
      industry: row.industry || 'Technology',
      location: row.location || 'Bengaluru, India',
      tier: row.tier || 'Super Dream (Tier 1)',
      activeJobsCount: row.active_jobs_count || 1,
      placedStudentsCount: row.placed_students_count || 5,
      averagePackage: row.average_package || '₹24 LPA',
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  getCompanyById(id: string): Company | undefined {
    return this.companiesSignal().find(c => c.id === id);
  }

  async addCompany(company: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>): Promise<Company> {
    const newCompany: Company = {
      ...company,
      id: `c-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.companiesSignal.update(list => [newCompany, ...list]);
    this.saveCompaniesToCache(this.companiesSignal());

    const client = this.supabase.getClient();
    if (this.supabase.isConfigured && client) {
      try {
        const { data, error } = await client
          .from('companies')
          .insert({
            name: company.name,
            logo: company.logo,
            website: company.website,
            description: company.description,
            industry: company.industry,
            location: company.location,
            tier: company.tier,
            active_jobs_count: company.activeJobsCount || 1,
            placed_students_count: company.placedStudentsCount || 0,
            average_package: company.averagePackage || '₹24 LPA'
          })
          .select()
          .single();

        if (!error && data) {
          const mapped = this.mapDbRowToCompany(data);
          this.companiesSignal.update(list => list.map(c => c.id === newCompany.id ? mapped : c));
          this.saveCompaniesToCache(this.companiesSignal());
          this.toast.success('Company Added', `${mapped.name} has been saved to database.`);
          return mapped;
        }
      } catch (err) {
        console.warn('Add company DB error:', err);
      }
    }

    this.toast.success('Company Added', `${newCompany.name} has been added to placement partners.`);
    return newCompany;
  }

  async updateCompany(id: string, updates: Partial<Company>) {
    this.companiesSignal.update(list =>
      list.map(c => c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c)
    );
    this.saveCompaniesToCache(this.companiesSignal());

    const client = this.supabase.getClient();
    if (this.supabase.isConfigured && client) {
      try {
        const payload: any = {};
        if (updates.name) payload.name = updates.name;
        if (updates.logo) payload.logo = updates.logo;
        if (updates.website) payload.website = updates.website;
        if (updates.description) payload.description = updates.description;
        if (updates.industry) payload.industry = updates.industry;
        if (updates.location) payload.location = updates.location;
        if (updates.tier) payload.tier = updates.tier;
        payload.updated_at = new Date().toISOString();

        await client.from('companies').update(payload).eq('id', id);
      } catch (err) {
        console.warn('Update company DB error:', err);
      }
    }

    this.toast.success('Company Updated', 'Company details saved.');
  }

  async deleteCompany(id: string) {
    const comp = this.getCompanyById(id);
    this.companiesSignal.update(list => list.filter(c => c.id !== id));
    this.saveCompaniesToCache(this.companiesSignal());

    const client = this.supabase.getClient();
    if (this.supabase.isConfigured && client) {
      try {
        await client.from('companies').delete().eq('id', id);
      } catch (err) {
        console.warn('Delete company DB error:', err);
      }
    }

    this.toast.warning('Company Removed', `${comp?.name || 'Company'} removed from platform.`);
  }
}
