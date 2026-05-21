import { ReviewsService } from './reviews.service';
export declare class ReviewsController {
    private readonly reviewsService;
    constructor(reviewsService: ReviewsService);
    create(user: any, body: {
        productId: string;
        rating: number;
        comment: string;
    }): Promise<import("./entities/review.entity").Review>;
    findByProduct(productId: string): Promise<import("./entities/review.entity").Review[]>;
    reportReview(id: string, reason: string): Promise<import("./entities/review.entity").Review>;
    respond(id: string, user: any, response: string): Promise<import("./entities/review.entity").Review>;
}
