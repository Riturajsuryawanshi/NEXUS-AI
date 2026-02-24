import { describe, it, expect } from 'vitest';
import { ReviewService } from './reviewService';
import { RawReview } from '../types/reviews';

describe('ReviewService.preprocessReviews', () => {
    // Access private method via casting or testing public side effect
    // Since preprocessReviews is private, we'll test it by mocking the fetch step if possible, 
    // OR we can expose it for testing, OR we recreate the logic test. 
    // Ideally, we test public methods. But getAudit handles fetching.
    // We will cast to any to test the private static method for this unit test to ensure logic correctness.

    const mockReviews: RawReview[] = [
        { rating: 5, text: "Great place!", timestamp: "2023-01-01", author: "A" },
        { rating: 1, text: "Terrible service.", timestamp: "2023-01-02", author: "B" },
        { rating: 5, text: "Loved it.", timestamp: "2023-01-03", author: "C" },
    ];

    const mockMeta = {
        name: "Test Business",
        industry: "Test Industry",
        location: "Test City",
        place_id: "test_id"
    };

    it('should calculate correct average rating', () => {
        // @ts-ignore
        const result = ReviewService.preprocessReviews(mockReviews, mockMeta);
        // (5+1+5)/3 = 3.666 -> 3.7
        expect(result.average_rating).toBe(3.7);
    });

    it('should calculate correct rating distribution', () => {
        // @ts-ignore
        const result = ReviewService.preprocessReviews(mockReviews, mockMeta);
        expect(result.rating_distribution[1]).toBe(1);
        expect(result.rating_distribution[5]).toBe(2);
        expect(result.rating_distribution[3]).toBe(0);
    });

    it('should identify negative and positive percentages', () => {
        // @ts-ignore
        const result = ReviewService.preprocessReviews(mockReviews, mockMeta);
        // 1 negative (33%), 2 positive (67%)
        expect(result.negative_review_percentage).toBe(33);
        expect(result.positive_review_percentage).toBe(67);
    });

    it('should extract basic keywords', () => {
        const reviews: RawReview[] = [
            { rating: 5, text: "The pizza was amazing and the pizza was hot", timestamp: "", author: "" }
        ];
        // @ts-ignore
        const result = ReviewService.preprocessReviews(reviews, mockMeta);
        const keywords = result.top_keywords.map((k: any) => k.word);
        expect(keywords).toContain('pizza');
        expect(result.top_keywords.find((k: any) => k.word === 'pizza')?.count).toBe(2);
    });
});
