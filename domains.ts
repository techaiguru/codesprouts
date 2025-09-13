import { EDGE_FUNCTIONS } from '../config/supabase';
import { kenicRegistrars } from '../config/registrars';
import { 
  DomainLookupRequest, 
  DomainLookupResponse, 
  DomainSearchResult, 
  DomainExtension, 
  KenicRegistrar,
  ApiResponse 
} from '../types';

export class DomainsService {
  // Search for domain availability using WHOIS Edge Function
  static async searchDomain(domain: string, extension: DomainExtension): Promise<ApiResponse<DomainSearchResult>> {
    try {
      const request: DomainLookupRequest = {
        domain: domain.toLowerCase().trim(),
        domainType: extension,
      };

      const response = await fetch(EDGE_FUNCTIONS.WHOIS_LOOKUP, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP error: ${response.status}`,
        };
      }

      const data: DomainLookupResponse = await response.json();

      const result: DomainSearchResult = {
        domain: request.domain,
        extension: request.domainType,
        available: data.available,
        registrars: data.available ? this.getRegistrars() : undefined,
      };

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Domain lookup failed',
      };
    }
  }

  // Get all KENIC registrars
  static getRegistrars(): KenicRegistrar[] {
    return kenicRegistrars;
  }

  // Get registrars with pagination
  static getRegistrarsPaginated(page: number = 1, limit: number = 10): {
    registrars: KenicRegistrar[];
    hasMore: boolean;
    total: number;
  } {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const registrars = kenicRegistrars.slice(startIndex, endIndex);
    
    return {
      registrars,
      hasMore: endIndex < kenicRegistrars.length,
      total: kenicRegistrars.length,
    };
  }

  // Get a specific registrar by ID
  static getRegistrar(id: string): KenicRegistrar | null {
    return kenicRegistrars.find(registrar => registrar.id === id) || null;
  }

  // Generate website URL from email
  static formatRegistrarUrl(email: string): string {
    const domain = email.split('@')[1];
    return `https://${domain}`;
  }

  // Validate domain name
  static validateDomainName(domain: string): { isValid: boolean; error?: string } {
    const cleanDomain = domain.toLowerCase().trim();
    
    if (!cleanDomain) {
      return {
        isValid: false,
        error: 'Domain name cannot be empty',
      };
    }

    if (cleanDomain.length < 1) {
      return {
        isValid: false,
        error: 'Domain name is too short',
      };
    }

    if (cleanDomain.length > 63) {
      return {
        isValid: false,
        error: 'Domain name is too long',
      };
    }

    // Check for valid characters (letters, numbers, hyphens)
    const domainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
    if (!domainRegex.test(cleanDomain)) {
      return {
        isValid: false,
        error: 'Domain name contains invalid characters',
      };
    }

    // Cannot start or end with hyphen
    if (cleanDomain.startsWith('-') || cleanDomain.endsWith('-')) {
      return {
        isValid: false,
        error: 'Domain name cannot start or end with a hyphen',
      };
    }

    return {
      isValid: true,
    };
  }

  // Get domain extensions with descriptions
  static getDomainExtensions(): { extension: DomainExtension; description: string }[] {
    return [
      { extension: '.me.ke', description: 'Perfect for personal portfolios and blogs' },
      { extension: '.co.ke', description: 'Ideal for commercial businesses' },
      { extension: '.ke', description: 'General purpose Kenya domain' },
      { extension: '.or.ke', description: 'For organizations and NGOs' },
      { extension: '.ac.ke', description: 'For academic institutions' },
    ];
  }

  // Get suggested domains based on input
  static getSuggestedDomains(baseDomain: string): string[] {
    const suggestions = [
      baseDomain,
      `${baseDomain}ke`,
      `${baseDomain}online`,
      `my${baseDomain}`,
      `${baseDomain}site`,
      `${baseDomain}web`,
    ];

    return suggestions.filter(suggestion => 
      this.validateDomainName(suggestion).isValid
    );
  }

  // Check multiple domains at once
  static async checkMultipleDomains(
    domains: string[], 
    extension: DomainExtension
  ): Promise<ApiResponse<DomainSearchResult[]>> {
    try {
      const results: DomainSearchResult[] = [];
      
      // Process domains in batches to avoid overwhelming the API
      const batchSize = 5;
      for (let i = 0; i < domains.length; i += batchSize) {
        const batch = domains.slice(i, i + batchSize);
        const batchPromises = batch.map(domain => 
          this.searchDomain(domain, extension)
        );
        
        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value.success) {
            results.push(result.value.data!);
          } else {
            // Add a failed result
            results.push({
              domain: batch[index],
              extension,
              available: false,
            });
          }
        });
      }

      return {
        success: true,
        data: results,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Batch domain lookup failed',
      };
    }
  }

  // Get popular domain suggestions for Kenya
  static getPopularSuggestions(): string[] {
    return [
      'myportfolio',
      'techblog',
      'creativehub',
      'startupke',
      'innovate',
      'digitalspace',
      'codemaster',
      'webdev',
      'designer',
      'consultant',
    ];
  }
}
