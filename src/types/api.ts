export interface ApiEnvelope<T> {
  ok: boolean;
  data: T;
  message?: string;
}

export type ApiResponse<T> = ApiEnvelope<T>;

// Player

export interface Player {
  _id: string;
  wallet_address: string;
  name: string;
  referral_code?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PlayerNonceResponse {
  nonce: string;
}

export interface LoginRequest {
  walletAddress: string;
  message: string;
  signature: string;
  name?: string;
  metadata?: unknown;
  referralCode?: string;
}

export interface PrivyTonLoginRequest {
  walletAddress: string;
  identityToken: string;
  name?: string;
  metadata?: unknown;
  referralCode?: string;
}

export interface LoginResponse {
  token: string;
  player: Player;
}

export interface UpdateNameRequest {
  name: string;
}

export interface PlayerGameScoreEntry {
  identification: string;
  score: number;
  weight: number;
  weightedScore: number;
  rank: number | null;
}

export interface PlayerProfileStats {
  walletAddress: string;
  username: string;
  rank: number | null;
  totalScore: number;
  level: number;
  totalGamesPlayed: number;
  completedQuests: number;
  gameScoresList: PlayerGameScoreEntry[];
  purchasedAssets?: unknown;
}

export interface PlayerProfileApiData {
  cached: boolean;
  profile: PlayerProfileStats;
}

export interface FullPlayerProfile {
  player: Player;
  cached: boolean;
  rank: number | null;
  totalScore: number;
  level: number;
  totalGamesPlayed: number;
  completedQuests: number;
  gameScoresList: PlayerGameScoreEntry[];
  purchasedAssets?: unknown;
}

// Games

export interface LocalizedString {
  en: string;
  [locale: string]: string;
}

export interface GameImage {
  url: string;
  variant?: string;
}

export interface GameThumbnailVariant {
  url: string | null;
  alt?: string | null;
  blurhash?: string | null;
  height?: number | null;
  width?: number | null;
  mime_type?: string | null;
  size_in_kb?: number | null;
  svg_content?: string | null;
}

export interface GameThumbnail {
  horizontal?: GameThumbnailVariant | null;
  vertical?: GameThumbnailVariant | null;
  square?: GameThumbnailVariant | null;
  ultrawide?: GameThumbnailVariant | null;
}

export interface Game {
  _id: string;
  identification?: string;
  slug?: string;
  name: LocalizedString | string;
  description?: LocalizedString | string;
  about?: string;
  category: string;
  platform?: string[];
  rating?: number;
  image_url?: string;
  images?: GameImage[];
  thumbnail?: GameThumbnail | null;
  slogan?: string;
  url?: string;
  isDownloadable?: boolean;
  is_downloadable?: boolean;
  is_active?: boolean;
  play_count?: number;
  knowledge_facts?: string[];
  metadata?: Record<string, unknown>;
}

export interface GamesResponse {
  games: Game[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Marketplace

export interface MarketplaceListing {
  id: string;
  name: string;
  shortDescription?: string | null;
  longDescription?: string | null;
  assetUrl?: string | null;
  price: number;
  category: string;
  currency: string;
  gameIdentification: string;
  status: string;
  contractItemId?: string | null;
  purchaseCalldata?: `0x${string}` | null;
  purchaseContractAddress?: `0x${string}` | null;
  purchaseValueWei?: string | null;
  purchaseChainId?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface MarketplaceListingsResponse {
  listings: MarketplaceListing[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface MarketplacePrepareOrderRequest {
  listingId: string;
  paymentToken: string;
  quantity?: number;
}

export interface MarketplaceCreateOrderRequest {
  listingId: string;
  paymentToken?: string;
  quantity?: number;
  txHash?: string;
}

export interface MarketplaceCompleteOrderRequest {
  orderId: string;
  txHash: string;
}

export interface MarketplaceOrder {
  id: string;
  orderId: string;
  listingId: string;
  playerId: string;
  buyerWallet?: string;
  gameIdentification: string;
  paymentToken?: string;
  pricePaid: number;
  quantity: number;
  status: string;
  txHash?: string;
  createdAt?: string;
}

// Leaderboard

export interface LeaderboardEntry {
  rank: number;
  wallet_address: string;
  name?: string;
  score: number;
  wins?: number;
  level?: string;
  game?: string;
  metadata?: unknown;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
  updated_at?: string;
}

// Content

export interface ContentSectionResponse {
  content: Record<string, unknown>[];
  totalContentCount: number;
  page: number;
  pageSize: number;
}

export interface GetContentParams {
  page: string;
  section: string;
  pageNum?: number;
  pageSize?: number;
}

// Moments

export interface Moment {
  momentId: string;
  playerWalletAddress: string;
  assetUrl?: string;
  assetMetadata?: Record<string, unknown>;
  assetZgUrl?: string;
  title: string;
  description?: string;
  tags: string[];
  relatedGames: string[];
  socialMediaLinks?: Record<string, unknown>;
  numLikes: number;
  numComments: number;
  aiCaption?: string;
  aiRankScore?: number;
  aiHighlights: string[];
  aiStatus?: string;
  aiMomentType?: string;
  aiSkillScore?: number;
  aiReactionQuality?: string;
  aiRarity?: string;
  assetZgHash?: string;
  assetZgTxHash?: string;
  metadataZgHash?: string;
  metadataZgTxHash?: string;
  zgStatus?: string;
  zgError?: string;
  zgUploadedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateMomentRequest {
  assetUrl?: string;
  assetMetadata?: Record<string, unknown>;
  title: string;
  description?: string;
  tags?: string[];
  relatedGames?: string[];
  socialMediaLinks?: Record<string, unknown>;
}

export interface UpdateMomentRequest {
  assetUrl?: string;
  assetMetadata?: Record<string, unknown>;
  title?: string;
  description?: string;
  tags?: string[];
  relatedGames?: string[];
  socialMediaLinks?: Record<string, unknown>;
}

export interface MomentsFeedResponse {
  moments: Moment[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface MomentMutationResponse {
  message: string;
}

export interface CreateMomentResponse extends MomentMutationResponse {
  momentId: string;
}

export interface MomentLikeResponse extends MomentMutationResponse {
  liked: boolean;
}

export interface MomentDaEvent {
  momentId: string;
  eventType: string;
  payload?: unknown;
  createdAt?: string;
}

export interface MomentDaEventsResponse {
  events: MomentDaEvent[];
}

export interface MomentZgProofResponse {
  assetZgHash?: string;
  assetZgTxHash?: string;
  metadataZgHash?: string;
  metadataZgTxHash?: string;
  zgStatus?: string;
  zgError?: string;
  zgUploadedAt?: string;
  gatewayUrl?: string | null;
  explorerUrl?: string | null;
}

// Social media

export interface SubmitSocialPostRequest {
  platform: string;
  postUrl: string;
}

export interface SubmitSocialPostResponse {
  message: string;
  postId: string;
}

export interface SocialPost {
  id: string;
  walletAddress: string;
  platform: string;
  postId: string;
  postUrl: string;
  rawData?: unknown;
  scrapedAt?: string;
  validationStatus?: string;
  createdAt?: string;
}

export interface SocialPostsResponse {
  posts: SocialPost[];
}

// Referral

export interface ReferralInfo {
  code: string;
  link: string;
}
