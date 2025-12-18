import { pgTable, text, serial, integer, timestamp, boolean, real, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const businesses = pgTable("businesses", {
  id: serial("id").primaryKey(),
  yelpId: text("yelp_id").unique(),
  name: text("name").notNull(),
  address: text("address"),
  phone: text("phone"),
  rating: real("rating"),
  reviewCount: integer("review_count"),
  categories: jsonb("categories").$type<string[]>(),
  url: text("url"),
  imageUrl: text("image_url"),
  scrapedAt: timestamp("scraped_at").defaultNow(),
});

export const reviewers = pgTable("reviewers", {
  id: serial("id").primaryKey(),
  yelpUserId: text("yelp_user_id"),
  name: text("name").notNull(),
  location: text("location"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  yelpReviewId: text("yelp_review_id"),
  businessId: integer("business_id").references(() => businesses.id),
  reviewerId: integer("reviewer_id").references(() => reviewers.id),
  rating: integer("rating"),
  text: text("text"),
  date: text("date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const enrichments = pgTable("enrichments", {
  id: serial("id").primaryKey(),
  reviewerId: integer("reviewer_id").references(() => reviewers.id),
  success: boolean("success").default(false),
  likelihood: real("likelihood"),
  email: text("email"),
  phone: text("phone"),
  linkedin: text("linkedin"),
  facebook: text("facebook"),
  instagram: text("instagram"),
  whatsapp: text("whatsapp"),
  twitter: text("twitter"),
  company: text("company"),
  jobTitle: text("job_title"),
  city: text("city"),
  state: text("state"),
  country: text("country"),
  industry: text("industry"),
  rawData: jsonb("raw_data"),
  enrichedAt: timestamp("enriched_at").defaultNow(),
});

export const businessesRelations = relations(businesses, ({ many }) => ({
  reviews: many(reviews),
}));

export const reviewersRelations = relations(reviewers, ({ many, one }) => ({
  reviews: many(reviews),
  enrichment: one(enrichments, {
    fields: [reviewers.id],
    references: [enrichments.reviewerId],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  business: one(businesses, {
    fields: [reviews.businessId],
    references: [businesses.id],
  }),
  reviewer: one(reviewers, {
    fields: [reviews.reviewerId],
    references: [reviewers.id],
  }),
}));

export const enrichmentsRelations = relations(enrichments, ({ one }) => ({
  reviewer: one(reviewers, {
    fields: [enrichments.reviewerId],
    references: [reviewers.id],
  }),
}));

export type Business = typeof businesses.$inferSelect;
export type InsertBusiness = typeof businesses.$inferInsert;
export type Reviewer = typeof reviewers.$inferSelect;
export type InsertReviewer = typeof reviewers.$inferInsert;
export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;
export type Enrichment = typeof enrichments.$inferSelect;
export type InsertEnrichment = typeof enrichments.$inferInsert;
