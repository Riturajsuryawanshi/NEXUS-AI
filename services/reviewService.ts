import { ReviewAudit, ReviewPreprocessResult, ReviewAIInsight, RawReview, ReviewPlatform, PlatformReviewData, CompetitorProfile, CompetitorBenchmark, CompetitorRanking, BenchmarkDimension } from '../types';
import { GeminiService } from './geminiService';
import { supabase } from './supabaseClient';

const REVIEW_CACHE_PREFIX = 'nexus_review_v3_';
const AI_CACHE_PREFIX = 'nexus_review_ai_v3_';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_REVIEWS_FOR_AI = 20;
const MAX_REVIEW_TEXT_LENGTH = 500;

// English stopwords for keyword extraction
const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'by', 'from', 'is', 'it', 'as', 'was', 'are', 'were', 'been', 'be', 'have', 'has',
  'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
  'shall', 'can', 'need', 'dare', 'ought', 'used', 'i', 'me', 'my', 'myself', 'we',
  'our', 'ours', 'you', 'your', 'yours', 'he', 'him', 'his', 'she', 'her', 'hers',
  'its', 'they', 'them', 'their', 'what', 'which', 'who', 'whom', 'this', 'that',
  'these', 'those', 'am', 'being', 'having', 'doing', 'just', 'about', 'above',
  'after', 'again', 'all', 'also', 'any', 'because', 'before', 'below', 'between',
  'both', 'during', 'each', 'few', 'further', 'here', 'how', 'into', 'more', 'most',
  'no', 'nor', 'not', 'only', 'other', 'out', 'over', 'own', 'same', 'so', 'some',
  'such', 'than', 'then', 'there', 'through', 'too', 'under', 'until', 'up', 'very',
  'went', 'go', 'get', 'got', 'going', 'come', 'came', 'really', 'much', 'even',
  'still', 'well', 'back', 'also', 'like', 'one', 'two', 'when', 'where', 'why',
  'while', 'if', 'though', 'however', 'place', 'been', 'made', 'us', 'im', 'dont',
  'ive', 'didnt', 'wasnt', 'wont', 'cant', 'couldnt', 'shouldnt', 'wouldnt',
]);

export type ReviewPipelineStep =
  | 'idle'
  | 'parsing'
  | 'fetching'
  | 'fetching_platforms'
  | 'fetching_competitors'
  | 'preprocessing'
  | 'ai_analysis'
  | 'benchmarking'
  | 'complete'
  | 'error';

export interface AuditOptions {
  platforms?: ReviewPlatform[];
  competitorUrls?: string[];
  autoDetectCompetitors?: boolean;
  maxCompetitors?: number;
}

export class ReviewService {

  // ====================================================
  // PUBLIC API
  // ====================================================

  /**
   * Main entry point. Runs the full pipeline:
   * 1. Parse URL → 2. Fetch Reviews (multi-platform) → 3. Preprocess → 4. AI Insights
   * 5. (Optional) Competitor Benchmarking
   */
  static async getAudit(
    placeUrl: string,
    onStep?: (step: ReviewPipelineStep) => void,
    options?: AuditOptions
  ): Promise<ReviewAudit> {

    const platforms = options?.platforms || ['google'];
    const competitorUrls = options?.competitorUrls || [];
    const autoDetect = options?.autoDetectCompetitors ?? false;
    const maxCompetitors = options?.maxCompetitors ?? 5;

    // STEP 1: Basic Validation
    onStep?.('parsing');
    if (!placeUrl || placeUrl.length < 3) {
      throw new Error("Please enter a valid business URL or name.");
    }

    // STEP 2: Fetch Google reviews (primary — always fetched)
    onStep?.('fetching');
    let googleResult: any;
    let reviews: RawReview[];

    try {
      const result = await this.fetchReviews(placeUrl);
      reviews = result.reviews;
      googleResult = result;
    } catch (err: any) {
      console.error('[ReviewService] Primary fetch failed:', err);
      throw new Error(err.message || "Unable to fetch business details. Please check the URL.");
    }

    const realPlaceId = googleResult.meta.place_id;

    // Check cache
    const cacheKey = REVIEW_CACHE_PREFIX + realPlaceId + '_' + platforms.join(',');
    const cached = this.getFromCache<ReviewAudit>(cacheKey);
    if (cached) {
      onStep?.('complete');
      return cached;
    }

    // Build primary platform data
    const allPlatformData: PlatformReviewData[] = [{
      platform: 'google',
      reviews: reviews,
      rating: googleResult.meta.rating || 0,
      totalReviews: googleResult.meta.totalReviews || reviews.length,
      profileUrl: googleResult.meta.profileUrl,
      fetchedAt: Date.now(),
    }];

    // STEP 2b: Fetch reviews from additional platforms (in parallel)
    const extraPlatforms = platforms.filter(p => p !== 'google');
    if (extraPlatforms.length > 0) {
      onStep?.('fetching_platforms');
      const platformResults = await Promise.allSettled(
        extraPlatforms.map(platform =>
          this.fetchPlatformReviews(platform, googleResult.meta.name)
        )
      );

      for (let i = 0; i < platformResults.length; i++) {
        const result = platformResults[i];
        if (result.status === 'fulfilled') {
          allPlatformData.push(result.value);
          // Add platform reviews to the main reviews array
          reviews = reviews.concat(result.value.reviews);
        } else {
          allPlatformData.push({
            platform: extraPlatforms[i],
            reviews: [],
            rating: 0,
            totalReviews: 0,
            fetchedAt: Date.now(),
            error: result.reason?.message || 'Fetch failed',
          });
        }
      }
    }

    // STEP 3: Deterministic Preprocessing on ALL reviews
    onStep?.('preprocessing');
    const preprocessResult = this.preprocessReviews(reviews, {
      name: googleResult.meta.name,
      industry: googleResult.meta.industry,
      location: googleResult.meta.location,
      place_id: realPlaceId,
      platforms: platforms,
    });

    // STEP 4: AI Insights
    onStep?.('ai_analysis');
    let aiInsights: ReviewAIInsight | null = null;
    try {
      if (preprocessResult.total_reviews > 0) {
        const AI_TIMEOUT = 15000; // Allow more time for multi-platform
        aiInsights = await Promise.race([
          this.generateAIInsights(preprocessResult, allPlatformData),
          new Promise<null>((_, reject) => setTimeout(() => reject(new Error('AI timeout')), AI_TIMEOUT))
        ]);
      }
    } catch (err: any) {
      console.warn('[ReviewService] AI skipped:', err.message);
    }

    // STEP 5: Competitor Benchmarking (optional)
    let competitorBenchmark: CompetitorBenchmark | null = null;
    if (competitorUrls.length > 0 || autoDetect) {
      onStep?.('fetching_competitors');
      try {
        competitorBenchmark = await this.buildCompetitorBenchmark(
          {
            name: googleResult.meta.name,
            place_id: realPlaceId,
            rating: preprocessResult.average_rating,
            total_reviews: preprocessResult.total_reviews,
            types: googleResult.meta.types || [],
            address: googleResult.meta.location,
            location: googleResult.meta.geometry?.location,
          },
          competitorUrls,
          autoDetect,
          maxCompetitors,
          googleResult.meta.geometry?.location,
          googleResult.meta.types?.[0]
        );
        onStep?.('benchmarking');
      } catch (err: any) {
        console.warn('[ReviewService] Competitor benchmarking failed:', err.message);
      }
    }

    // Build final ReviewAudit
    const audit = this.buildAudit(preprocessResult, aiInsights, allPlatformData, competitorBenchmark);

    // Cache result
    this.setCache(cacheKey, audit);

    onStep?.('complete');
    return audit;
  }

  // ====================================================
  // STEP 2: FETCH REVIEWS (Google — via places-proxy)
  // ====================================================

  private static async fetchReviews(
    url: string
  ): Promise<{ reviews: RawReview[]; meta: any }> {

    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
    const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error("Missing Supabase configuration");

    console.log('[ReviewService] calling places-proxy for:', url);
    const response = await fetch(`${SUPABASE_URL}/functions/v1/places-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ url })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Proxy Error: ${response.status}`);
    }

    const data = await response.json();
    if (!data || !data.place_id) throw new Error("Invalid response from Places API");

    const reviews: RawReview[] = (data.reviews || []).map((r: any) => ({
      rating: Number(r.rating) || 0,
      text: r.text || '',
      timestamp: r.time ? new Date(r.time * 1000).toISOString() : new Date().toISOString(),
      author: r.author_name || 'Google User',
      platform: 'google' as ReviewPlatform,
    }));

    const meta = {
      name: data.name || 'Unknown Business',
      industry: (data.types && data.types.length > 0)
        ? data.types[0].replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
        : 'Business',
      location: data.formatted_address || 'Unknown Location',
      place_id: data.place_id,
      types: data.types || [],
      geometry: data.geometry,
      rating: data.rating || 0,
      totalReviews: data.user_ratings_total || 0,
      profileUrl: data.url,
    };

    // FALLBACK: If API Key is missing (mock data detected)
    if (meta.name === "Mock Coffee Roasters" || meta.place_id === "mock_place_id_123") {
      console.warn("[ReviewService] Mock data detected. Using local demo reviews.");
      return this.getLocalDemoReviews(url);
    }

    return { reviews, meta };
  }

  // ====================================================
  // STEP 2b: FETCH PLATFORM REVIEWS (via reviews-proxy)
  // ====================================================

  private static async fetchPlatformReviews(
    platform: ReviewPlatform,
    businessName: string
  ): Promise<PlatformReviewData> {
    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
    const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return {
        platform, reviews: [], rating: 0, totalReviews: 0,
        fetchedAt: Date.now(), error: 'Missing Supabase config'
      };
    }

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/reviews-proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          action: 'fetch_reviews',
          platform,
          query: businessName,
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        return {
          platform, reviews: [], rating: 0, totalReviews: 0,
          fetchedAt: Date.now(), error: errData.error || `HTTP ${response.status}`
        };
      }

      const data = await response.json();

      return {
        platform,
        reviews: (data.reviews || []).map((r: any) => ({
          ...r,
          platform,
        })),
        rating: data.rating || 0,
        totalReviews: data.totalReviews || 0,
        profileUrl: data.profileUrl,
        fetchedAt: Date.now(),
        error: data.error,
      };
    } catch (err: any) {
      return {
        platform, reviews: [], rating: 0, totalReviews: 0,
        fetchedAt: Date.now(), error: err.message
      };
    }
  }

  // ====================================================
  // COMPETITOR BENCHMARKING
  // ====================================================

  private static async buildCompetitorBenchmark(
    subject: CompetitorProfile,
    competitorUrls: string[],
    autoDetect: boolean,
    maxCompetitors: number,
    subjectLocation?: { lat: number; lng: number },
    subjectType?: string
  ): Promise<CompetitorBenchmark> {

    let competitorProfiles: CompetitorProfile[] = [];

    // 1. Auto-detect competitors via Nearby Search
    if (autoDetect && subjectLocation) {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

      try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/reviews-proxy`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            action: 'find_competitors',
            location: `${subjectLocation.lat},${subjectLocation.lng}`,
            category: subjectType,
            placeId: subject.place_id,
          })
        });

        if (response.ok) {
          const data = await response.json();
          competitorProfiles = (data.competitors || []).slice(0, maxCompetitors);
        }
      } catch (err) {
        console.warn('[ReviewService] Auto-detect competitors failed:', err);
      }
    }

    // 2. Fetch competitors from manually provided URLs
    if (competitorUrls.length > 0) {
      const manualResults = await Promise.allSettled(
        competitorUrls.slice(0, maxCompetitors).map(async (url) => {
          const result = await this.fetchReviews(url);
          return {
            name: result.meta.name,
            place_id: result.meta.place_id,
            rating: result.meta.rating || result.reviews.reduce((s: number, r: RawReview) => s + r.rating, 0) / (result.reviews.length || 1),
            total_reviews: result.meta.totalReviews || result.reviews.length,
            types: result.meta.types || [],
            address: result.meta.location,
            location: result.meta.geometry?.location,
          } as CompetitorProfile;
        })
      );

      for (const r of manualResults) {
        if (r.status === 'fulfilled') {
          competitorProfiles.push(r.value);
        }
      }
    }

    // Deduplicate by place_id
    const seen = new Set<string>([subject.place_id]);
    competitorProfiles = competitorProfiles.filter(c => {
      if (seen.has(c.place_id)) return false;
      seen.add(c.place_id);
      return true;
    });

    // 3. Build rankings
    const allBusinesses = [subject, ...competitorProfiles];

    const ratingRanking: CompetitorRanking = {
      metric: 'Rating',
      rankings: allBusinesses
        .map(b => ({ name: b.name, value: b.rating, rank: 0, isSubject: b.place_id === subject.place_id }))
        .sort((a, b) => (b.value as number) - (a.value as number))
        .map((r, i) => ({ ...r, rank: i + 1 })),
    };

    const reviewCountRanking: CompetitorRanking = {
      metric: 'Review Count',
      rankings: allBusinesses
        .map(b => ({ name: b.name, value: b.total_reviews, rank: 0, isSubject: b.place_id === subject.place_id }))
        .sort((a, b) => (b.value as number) - (a.value as number))
        .map((r, i) => ({ ...r, rank: i + 1 })),
    };

    // 4. Build benchmark dimensions (Rating + Review Volume + estimated dimensions)
    const dimensions: BenchmarkDimension[] = [
      {
        name: 'Rating',
        subjectScore: Math.round((subject.rating / 5) * 10),
        scores: competitorProfiles.map(c => ({
          name: c.name,
          score: Math.round((c.rating / 5) * 10),
        })),
      },
      {
        name: 'Review Volume',
        subjectScore: this.normalizeReviewCount(subject.total_reviews, allBusinesses.map(b => b.total_reviews)),
        scores: competitorProfiles.map(c => ({
          name: c.name,
          score: this.normalizeReviewCount(c.total_reviews, allBusinesses.map(b => b.total_reviews)),
        })),
      },
      {
        name: 'Reputation',
        subjectScore: Math.round(subject.rating * 2),
        scores: competitorProfiles.map(c => ({
          name: c.name,
          score: Math.round(c.rating * 2),
        })),
      },
      {
        name: 'Engagement',
        subjectScore: this.estimateEngagement(subject),
        scores: competitorProfiles.map(c => ({
          name: c.name,
          score: this.estimateEngagement(c),
        })),
      },
      {
        name: 'Visibility',
        subjectScore: Math.min(10, Math.round(Math.log10(Math.max(1, subject.total_reviews)) * 3)),
        scores: competitorProfiles.map(c => ({
          name: c.name,
          score: Math.min(10, Math.round(Math.log10(Math.max(1, c.total_reviews)) * 3)),
        })),
      },
    ];

    return {
      subject,
      competitors: competitorProfiles,
      dimensions,
      rankings: [ratingRanking, reviewCountRanking],
      generatedAt: Date.now(),
    };
  }

  private static normalizeReviewCount(count: number, all: number[]): number {
    const max = Math.max(...all, 1);
    return Math.round((count / max) * 10);
  }

  private static estimateEngagement(profile: CompetitorProfile): number {
    // Heuristic: Higher rating + more reviews = higher engagement
    const ratingFactor = profile.rating / 5;
    const volumeFactor = Math.min(1, profile.total_reviews / 200);
    return Math.round((ratingFactor * 0.6 + volumeFactor * 0.4) * 10);
  }

  // ====================================================
  // LOCAL DEMO REVIEWS (No API Required)
  // ====================================================

  private static getLocalDemoReviews(url: string): { reviews: RawReview[]; meta: any } {
    let businessName = "Urban Bistro";
    try {
      const decoded = decodeURIComponent(url);
      const placeMatch = decoded.match(/\/place\/([^/@?]+)/);
      if (placeMatch) businessName = placeMatch[1].replace(/\+/g, ' ');
      else if (!decoded.includes('google.com') && !decoded.includes('goo.gl')) {
        businessName = decoded.trim().substring(0, 50);
      }
    } catch { /* use default */ }

    const now = Date.now();
    const DAY = 86400000;
    const reviews: RawReview[] = [
      { rating: 5, text: "Absolutely wonderful experience! The attention to detail here is remarkable. The staff went above and beyond to make us feel welcome.", timestamp: new Date(now - 2 * DAY).toISOString(), author: "Sarah Mitchell", platform: 'google' },
      { rating: 4, text: "Really good overall. The service was prompt and the quality exceeded my expectations. Only reason not 5 stars is the wait time on weekends.", timestamp: new Date(now - 5 * DAY).toISOString(), author: "James Rodriguez", platform: 'google' },
      { rating: 5, text: "Best in the city, hands down! I've been a regular for over a year now and the consistency is impressive.", timestamp: new Date(now - 7 * DAY).toISOString(), author: "Priya Sharma", platform: 'google' },
      { rating: 2, text: "Disappointed with my last visit. Had to wait 40 minutes despite having a reservation. When we finally got served, the order was wrong.", timestamp: new Date(now - 10 * DAY).toISOString(), author: "Michael Chen", platform: 'google' },
      { rating: 5, text: "A hidden gem! The quality here rivals places charging twice the price. Everything was fresh and beautifully presented.", timestamp: new Date(now - 14 * DAY).toISOString(), author: "Amanda Foster", platform: 'google' },
      { rating: 3, text: "It's decent but nothing special. The pricing feels a bit steep for what you get. Service was okay.", timestamp: new Date(now - 18 * DAY).toISOString(), author: "Robert Kim", platform: 'google' },
      { rating: 1, text: "Terrible experience. The manager was rude when I raised a concern about billing. Charged us for items we never received.", timestamp: new Date(now - 21 * DAY).toISOString(), author: "Lisa Thompson", platform: 'google' },
      { rating: 4, text: "Very professional and efficient. The new renovations look great and the expanded menu has some excellent additions.", timestamp: new Date(now - 25 * DAY).toISOString(), author: "David Washington", platform: 'google' },
      { rating: 5, text: "Outstanding! Brought my family here for a celebration and everyone loved it. The staff even brought out a complimentary dessert.", timestamp: new Date(now - 30 * DAY).toISOString(), author: "Kavitha Nair", platform: 'google' },
      { rating: 4, text: "Good quality and reasonable prices. The location is convenient and there's usually availability even during peak hours.", timestamp: new Date(now - 35 * DAY).toISOString(), author: "Thomas Wright", platform: 'google' },
      { rating: 2, text: "Used to be much better. The last two visits were disappointing — inconsistent quality and smaller portions.", timestamp: new Date(now - 42 * DAY).toISOString(), author: "Jennifer Lee", platform: 'google' },
      { rating: 5, text: "Perfection! Every detail was thoughtfully handled. I've recommended this place to all my friends.", timestamp: new Date(now - 48 * DAY).toISOString(), author: "Alex Patel", platform: 'google' },
      { rating: 4, text: "Solid 4 stars. Great product quality, friendly staff, clean premises. The online booking system could use some improvement.", timestamp: new Date(now - 55 * DAY).toISOString(), author: "Rachel Green", platform: 'google' },
      { rating: 3, text: "Average experience. Nothing wrong per se, but nothing memorable either. The staff seemed disinterested.", timestamp: new Date(now - 60 * DAY).toISOString(), author: "Kevin Okoye", platform: 'google' },
      { rating: 5, text: "Can't say enough good things! The personalized attention, the quality, the atmosphere — everything was on point.", timestamp: new Date(now - 75 * DAY).toISOString(), author: "Sophia Wang", platform: 'google' },
      { rating: 1, text: "Never again. Found a foreign object during my visit. When I complained, the staff tried to brush it off.", timestamp: new Date(now - 85 * DAY).toISOString(), author: "Mark Johnson", platform: 'google' },
      { rating: 4, text: "Very impressed with the recent changes. The new layout is much more comfortable and the updated offerings are excellent.", timestamp: new Date(now - 90 * DAY).toISOString(), author: "Diana Cruz", platform: 'google' },
      { rating: 5, text: "World class! Traveled 50km just to visit based on a friend's recommendation and it did not disappoint.", timestamp: new Date(now - 100 * DAY).toISOString(), author: "Rahul Mehta", platform: 'google' },
      { rating: 3, text: "Hit or miss. Some visits are great, others are mediocre. There's an inconsistency problem here.", timestamp: new Date(now - 120 * DAY).toISOString(), author: "Emily Brown", platform: 'google' },
      { rating: 4, text: "Pleasantly surprised! Came with low expectations but was blown away by the quality inside.", timestamp: new Date(now - 150 * DAY).toISOString(), author: "Chris Anderson", platform: 'google' },
      { rating: 5, text: "My absolute favorite spot! Been coming here weekly for 6 months and it gets better every time.", timestamp: new Date(now - 180 * DAY).toISOString(), author: "Nina Kowalski", platform: 'google' },
      { rating: 2, text: "Overrated and overpriced. Don't believe the hype. The experience was mediocre at best.", timestamp: new Date(now - 200 * DAY).toISOString(), author: "Sam Davis", platform: 'google' },
      { rating: 4, text: "Consistently good quality. Nothing flashy, just solid and reliable every time. The loyalty program is a nice touch.", timestamp: new Date(now - 240 * DAY).toISOString(), author: "Anita Desai", platform: 'google' },
      { rating: 5, text: "Simply the best in the area. I've tried every competitor and none come close.", timestamp: new Date(now - 300 * DAY).toISOString(), author: "Oliver Zhang", platform: 'google' },
      { rating: 3, text: "It's fine. Nothing exciting but nothing bad. Decent quality, fair prices, okay service.", timestamp: new Date(now - 350 * DAY).toISOString(), author: "Grace Williams", platform: 'google' },
    ];

    return {
      reviews,
      meta: {
        name: businessName,
        industry: "Business",
        location: "Local Area",
        place_id: `demo_${Date.now()}`,
        types: ['business'],
        rating: 3.8,
        totalReviews: reviews.length,
      }
    };
  }

  // ====================================================
  // STEP 3: DETERMINISTIC PREPROCESSING
  // ====================================================

  private static preprocessReviews(
    reviews: RawReview[],
    meta: { name: string; industry: string; location: string; place_id: string; platforms?: ReviewPlatform[] }
  ): ReviewPreprocessResult {

    const total = reviews.length;

    // A. Rating Distribution
    const ratingDist: { [star: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let ratingSum = 0;
    for (const r of reviews) {
      const star = Math.min(5, Math.max(1, Math.round(r.rating)));
      ratingDist[star] = (ratingDist[star] || 0) + 1;
      ratingSum += r.rating;
    }
    const avgRating = total > 0 ? Math.round((ratingSum / total) * 10) / 10 : 0;
    const negativeCount = (ratingDist[1] || 0) + (ratingDist[2] || 0);
    const positiveCount = (ratingDist[4] || 0) + (ratingDist[5] || 0);
    const negativePercentage = total > 0 ? Math.round((negativeCount / total) * 100) : 0;
    const positivePercentage = total > 0 ? Math.round((positiveCount / total) * 100) : 0;

    // B. Time Trends
    const monthMap = new Map<string, { ratings: number[]; count: number; negCount: number }>();
    for (const r of reviews) {
      const date = new Date(r.timestamp);
      if (isNaN(date.getTime())) continue;
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, { ratings: [], count: 0, negCount: 0 });
      }
      const entry = monthMap.get(monthKey)!;
      entry.ratings.push(r.rating);
      entry.count++;
      if (r.rating <= 2) entry.negCount++;
    }
    const timeTrends = Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        avgRating: Math.round((data.ratings.reduce((s, v) => s + v, 0) / data.ratings.length) * 10) / 10,
        count: data.count,
        negativeCount: data.negCount,
      }));

    // C. Word Frequency
    const wordCounts = new Map<string, number>();
    for (const r of reviews) {
      const words = r.text
        .toLowerCase()
        .replace(/[^a-z\s'-]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 3 && !STOPWORDS.has(w));
      for (const word of words) {
        wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
      }
    }
    const topKeywords = Array.from(wordCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([word, count]) => ({ word, count }));

    // D. Sentiment Breakdown
    const sentimentBreakdown = {
      positive: positiveCount,
      negative: negativeCount,
      neutral: total - positiveCount - negativeCount,
    };

    // Prepare inputs for AI (truncated)
    const negReviews = reviews
      .filter(r => r.rating <= 2)
      .slice(0, MAX_REVIEWS_FOR_AI)
      .map(r => r.text.substring(0, MAX_REVIEW_TEXT_LENGTH));

    const posReviews = reviews
      .filter(r => r.rating >= 4)
      .slice(0, MAX_REVIEWS_FOR_AI)
      .map(r => r.text.substring(0, MAX_REVIEW_TEXT_LENGTH));

    return {
      business_name: meta.name,
      business_industry: meta.industry,
      business_location: meta.location,
      total_reviews: total,
      average_rating: avgRating,
      rating_distribution: ratingDist,
      negative_review_percentage: negativePercentage,
      positive_review_percentage: positivePercentage,
      top_keywords: topKeywords,
      time_trends: timeTrends,
      sentiment_breakdown: sentimentBreakdown,
      raw_review_clusters_input: {
        negative_reviews_summary: negReviews,
        positive_reviews_summary: posReviews,
      },
      platforms_analyzed: meta.platforms,
    };
  }

  // ====================================================
  // STEP 4: AI INSIGHTS
  // ====================================================

  private static async generateAIInsights(
    preprocess: ReviewPreprocessResult,
    platformData?: PlatformReviewData[]
  ): Promise<ReviewAIInsight> {
    const aiCacheKey = AI_CACHE_PREFIX + preprocess.business_name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const cached = this.getFromCache<ReviewAIInsight>(aiCacheKey);
    if (cached) return cached;

    // Call Gemini Service — pass platform data for cross-platform analysis
    const aiResponse = await GeminiService.generateReviewInsights(preprocess, platformData);

    // Parse Response
    let jsonStr = aiResponse.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) jsonStr = jsonMatch[0];

    let parsed: ReviewAIInsight;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (e) {
      console.error('[ReviewService] AI response parse failed:', e);
      throw new Error('AI response was not valid JSON');
    }

    if (!parsed.executive_summary) {
      throw new Error('AI response missing required fields');
    }

    // Safe defaults
    if (!parsed.executive_summary) parsed.executive_summary = { rating: 0, total_reviews: 0, sentiment_score: 0, local_visibility_score: 0, summary_text: 'Pending analysis' };
    if (!parsed.sentiment_analysis) parsed.sentiment_analysis = { positive_percent: 0, neutral_percent: 0, negative_percent: 0, trend_summary: 'Pending analysis' };
    if (!parsed.top_positive_themes) parsed.top_positive_themes = [];
    if (!parsed.top_complaints) parsed.top_complaints = [];
    if (!parsed.competitor_comparison) parsed.competitor_comparison = [];
    if (!parsed.reputation_risks) parsed.reputation_risks = [];
    if (!parsed.revenue_opportunities) parsed.revenue_opportunities = [];
    if (!parsed.action_plan) parsed.action_plan = [];

    this.setCache(aiCacheKey, parsed);
    return parsed;
  }

  // ====================================================
  // BUILD FINAL AUDIT
  // ====================================================

  private static buildAudit(
    preprocess: ReviewPreprocessResult,
    aiInsights: ReviewAIInsight | null,
    platformData?: PlatformReviewData[],
    competitorBenchmark?: CompetitorBenchmark | null
  ): ReviewAudit {

    const insights = aiInsights ?? this.buildDeterministicFallbackInsights(preprocess);

    const reviewClusters = insights?.top_complaints?.map((c) => ({
      theme: c.problem,
      frequency_percentage: c.frequency_percent,
      sentiment: 'negative' as const,
      key_complaints_or_praises: [c.problem],
      business_impact_estimate: `Severity Score: ${c.severity_score}/10`,
    })) || [];

    const revenueLeaks = insights?.top_complaints?.slice(0, 3).map(c => ({
      issue: c.problem,
      potential_business_risk: `Severity Score: ${c.severity_score}/10`,
      recommended_fix: "See action plan for details.",
    })) || [];

    const upsells = (insights?.revenue_opportunities || []).map(opt => ({
      opportunity: opt.opportunity,
      supporting_review_pattern: opt.expected_impact
    }));

    return {
      source: aiInsights ? 'full' : 'deterministic',
      preprocess,
      ai_insights: insights,
      business_summary: {
        name: preprocess.business_name,
        rating: preprocess.average_rating,
        total_reviews: preprocess.total_reviews,
        place_id: preprocess.business_name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      },
      platformData,
      competitorBenchmark: competitorBenchmark || null,
      review_clusters: reviewClusters,
      revenue_leak_indicators: revenueLeaks,
      upsell_opportunities: upsells,
      generatedAt: Date.now(),
    };
  }

  // ====================================================
  // DETERMINISTIC FALLBACK
  // ====================================================

  private static buildDeterministicFallbackInsights(p: ReviewPreprocessResult): ReviewAIInsight {
    const { average_rating, total_reviews, positive_review_percentage, negative_review_percentage,
      sentiment_breakdown, top_keywords, business_name } = p;

    const positivePct = sentiment_breakdown?.positive ?? positive_review_percentage ?? 60;
    const negativePct = sentiment_breakdown?.negative ?? negative_review_percentage ?? 30;
    const neutralPct = sentiment_breakdown?.neutral ?? (100 - positivePct - negativePct);
    const positiveKeywords = top_keywords.filter((_, i) => i % 3 !== 1).slice(0, 5).map(k => k.word);
    const negativeKeywords = top_keywords.filter((_, i) => i % 3 === 1).slice(0, 5).map(k => k.word);

    const severityScore = Math.max(1, Math.min(10, Math.round(negativePct / 5)));

    return {
      executive_summary: {
        rating: average_rating,
        total_reviews: total_reviews,
        sentiment_score: positivePct,
        local_visibility_score: total_reviews > 100 ? 80 : 50,
        summary_text: `${business_name} has a ${average_rating.toFixed(1)}★ average rating across ${total_reviews} reviews. Basic analysis generated due to AI unavailability.`
      },
      sentiment_analysis: {
        positive_percent: positivePct,
        neutral_percent: neutralPct,
        negative_percent: negativePct,
        trend_summary: negativePct > 30 ? "Elevated negative feedback observed." : "Generally positive feedback profile."
      },
      top_positive_themes: positiveKeywords.map((kw, i) => ({
        theme: kw.charAt(0).toUpperCase() + kw.slice(1),
        frequency: Math.round(positivePct / (i + 2)),
        description: `Customers frequently praise the ${kw}.`
      })),
      top_complaints: negativeKeywords.map((kw, i) => ({
        problem: kw.charAt(0).toUpperCase() + kw.slice(1) + ' Issues',
        frequency_percent: Math.round(negativePct / (i + 2)),
        severity_score: severityScore
      })),
      competitor_comparison: [
        { metric: "Rating", your_business: average_rating.toFixed(1), competitor_avg: "4.2" },
        { metric: "Review Count", your_business: total_reviews, competitor_avg: "150" }
      ],
      reputation_risks: [{
        problem: "Negative sentiment ratio",
        frequency_percent: negativePct,
        severity_score: severityScore
      }],
      revenue_opportunities: [{
        opportunity: "Improve response rate",
        expected_impact: "Could improve rating by converting 1-star to 3-star reviews."
      }],
      business_mission: `To provide high-quality ${p.business_industry || 'services'} to the ${p.business_location || 'local'} community with a focus on customer satisfaction.`,
      strategic_roadmap: [
        { point: "Digital Presence Optimization", benefit: "Increase discovery by 30-40%" },
        { point: "Reputation Management Automation", benefit: "Maintain a 4.5+ star rating consistently" }
      ],
      online_presence_audit: [
        { platform: "Google Maps", status: "active", action_required: "Optimize photos" },
        { platform: "Facebook", status: "incomplete", action_required: "Update business hours" },
        { platform: "Yelp", status: "missing", action_required: "Create profile" }
      ],
      recommended_partners: ["Local Food Delivery Apps", "Nearby complementary businesses"],
      agency_contribution: ["Professional Website Redesign", "Local SEO Optimization", "Social Media Strategy"],
      action_plan: [
        { timeline_week: "Week 1", action: "Review all 1 and 2 star feedback from the past month." },
        { timeline_week: "Week 2", action: "Address the most frequent operational complaint." }
      ]
    };
  }

  // ====================================================
  // CACHE UTILITIES
  // ====================================================

  private static getFromCache<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (Date.now() - parsed.timestamp > CACHE_TTL_MS) {
        localStorage.removeItem(key);
        return null;
      }
      return parsed.data as T;
    } catch {
      return null;
    }
  }

  private static setCache<T>(key: string, data: T): void {
    try {
      localStorage.setItem(key, JSON.stringify({ timestamp: Date.now(), data }));
    } catch (e) {
      console.warn('[ReviewService] Cache write failed:', e);
    }
  }
}
